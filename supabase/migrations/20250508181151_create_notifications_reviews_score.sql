-- Suggested Filename: YYYYMMDDHHMMSS_create_notifications_reviews_score.sql
-- (Replace YYYYMMDDHHMMSS with the actual UTC timestamp e.g., 20240527100530)

-- 0. Add reliability_score to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(5, 2) DEFAULT NULL;

COMMENT ON COLUMN public.profiles.reliability_score IS 'Farmer reliability score, auto-calculated (e.g., based on reviews, order completion). Range 0.00-5.00 or 0-100 depending on scale chosen. Initialized to NULL.';

-- Create ENUM types for refunds status if they don't exist from other tables (e.g. order_status)
-- For simplicity, using TEXT and CHECK constraint as in backend_structure_document

-- PRE-STEP: Create refunds table (as it seems it was missing)
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Farmer involved in the original order
  amount_requested decimal NOT NULL CHECK (amount_requested > 0),
  amount_refunded decimal CHECK (amount_refunded >= 0 AND amount_refunded <= amount_requested),
  reason text,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'approved', 'rejected', 'processing', 'success', 'failed')), -- Added processing, approved, rejected based on common flows
  initiated_by text CHECK (initiated_by IN ('buyer', 'admin', 'system')),
  processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin who processed it
  initiated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  failure_reason text,
  admin_notes TEXT -- For admins to add notes during processing
);
COMMENT ON TABLE public.refunds IS 'Records refund requests and their statuses.';
COMMENT ON COLUMN public.refunds.status IS 'Status of the refund request (initiated, approved, rejected, processing, success, failed).';

-- Add updated_at trigger for refunds table (assuming update_updated_at_column function exists)
-- CREATE TRIGGER handle_refunds_updated_at ... (if you want updated_at on refunds)

-- RLS for refunds (basic example, align with your project's needs)
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can manage their own refund requests" 
  ON public.refunds FOR ALL 
  TO authenticated 
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id AND status = 'initiated'); -- Buyer can only create/update if initiated

CREATE POLICY "Farmers can view refunds related to their orders" 
  ON public.refunds FOR SELECT
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = refunds.order_id AND oi.farmer_id = auth.uid()));

CREATE POLICY "Admins have full access to refunds" 
  ON public.refunds FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 1. Define ENUM for alert types
CREATE TYPE public.user_alert_type AS ENUM (
    -- Farmer Notifications
    'new_order',                 -- A new order has been placed for the farmer's products
    'payment_received',          -- Payment for an order has been confirmed
    'new_review_posted',         -- A buyer has posted a new review for the farmer
    'product_approved_farmer',   -- Farmer's submitted product has been approved by an admin
    -- Buyer Notifications
    'order_paid',                -- Buyer's order payment has been confirmed
    'order_delivering',          -- Buyer's order is now out for delivery
    'order_delivered',           -- Buyer's order has been marked as delivered
    'please_review_order',       -- Prompt for buyer to review a completed order
    'refund_status_changed',     -- Notification to buyer about their refund status update
    -- Admin Notifications
    'product_pending_admin',     -- A new product has been submitted by a farmer and awaits approval
    'new_payment_admin',         -- A new payment has been successfully processed in the system
    'refund_request_admin',      -- A buyer has initiated a refund request
    'new_user_admin'             -- A new user has registered on the platform
);

-- 2. Create user_alerts table
CREATE TABLE IF NOT EXISTS public.user_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Recipient of the alert
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,       -- User who triggered the alert (nullable for system events)
    type public.user_alert_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    related_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    related_review_id uuid, -- FK constraint added after reviews table creation
    related_refund_id uuid REFERENCES public.refunds(id) ON DELETE SET NULL,
    related_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- e.g., the new user for new_user_admin alert, or the actor if distinct
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.user_alerts IS 'In-app alerts and notifications for users (farmers, buyers, admins).';
COMMENT ON COLUMN public.user_alerts.user_id IS 'The user profile ID of the recipient of this alert.';
COMMENT ON COLUMN public.user_alerts.actor_id IS 'The user profile ID of the person/entity that performed the action causing the alert.';

-- 3. Create reviews table (removing direct CHECK constraints with subqueries)
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_order_reviewer_product UNIQUE (order_id, reviewer_id, product_id)
);
COMMENT ON TABLE public.reviews IS 'Reviews for farmers/products.';

-- Add FK for user_alerts.related_review_id
ALTER TABLE public.user_alerts
ADD CONSTRAINT fk_user_alerts_related_review_id FOREIGN KEY (related_review_id)
REFERENCES public.reviews(id) ON DELETE SET NULL;

-- Trigger function to validate review constraints (replaces direct CHECKs)
CREATE OR REPLACE FUNCTION public.validate_review_constraints()
RETURNS TRIGGER AS $$
BEGIN
    -- Check reviewer is a buyer
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.reviewer_id AND p.role = 'buyer') THEN
        RAISE EXCEPTION 'Reviewer must be a buyer.';
    END IF;
    -- Check farmer is a farmer
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.farmer_id AND p.role = 'farmer') THEN
        RAISE EXCEPTION 'Reviewed entity must be a farmer.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_or_update_reviews_validate_roles
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_constraints();

CREATE TRIGGER handle_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS Policies
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own alerts" ON public.user_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update (mark as read) their own alerts" ON public.user_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all alerts" ON public.user_alerts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read non-archived reviews" ON public.reviews FOR SELECT USING (is_archived = FALSE);
CREATE POLICY "Buyers can create reviews for their completed orders" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = reviewer_id AND o.status IN ('delivered', 'received'))
);
CREATE POLICY "Reviewers can update their own non-archived reviews" ON public.reviews FOR UPDATE TO authenticated USING (reviewer_id = auth.uid() AND is_archived = FALSE);
CREATE POLICY "Admins can manage all aspects of reviews" ON public.reviews FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Function to update farmer reliability_score
CREATE OR REPLACE FUNCTION public.update_farmer_reliability_score(p_farmer_id uuid)
RETURNS void AS $$
DECLARE avg_rating DECIMAL;
BEGIN
    SELECT AVG(r.rating) INTO avg_rating FROM public.reviews r WHERE r.farmer_id = p_farmer_id AND r.is_archived = FALSE;
    UPDATE public.profiles SET reliability_score = avg_rating WHERE id = p_farmer_id AND role = 'farmer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_update_farmer_score_on_review()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN PERFORM public.update_farmer_reliability_score(OLD.farmer_id);
    ELSE PERFORM public.update_farmer_reliability_score(NEW.farmer_id); END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change_update_farmer_score
AFTER INSERT OR UPDATE OF rating, is_archived OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_farmer_score_on_review();

-- 6. Functions and Triggers to create alerts
CREATE OR REPLACE FUNCTION public.create_admin_alert(
    p_type public.user_alert_type, p_title TEXT, p_message TEXT DEFAULT NULL, p_actor_id uuid DEFAULT NULL,
    p_related_order_id uuid DEFAULT NULL, p_related_product_id uuid DEFAULT NULL, p_related_review_id uuid DEFAULT NULL,
    p_related_refund_id uuid DEFAULT NULL, p_related_user_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE admin_profile RECORD;
BEGIN
    FOR admin_profile IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        INSERT INTO public.user_alerts (user_id, type, title, message, actor_id, related_order_id, related_product_id, related_review_id, related_refund_id, related_user_id)
        VALUES (admin_profile.id, p_type, p_title, p_message, p_actor_id, p_related_order_id, p_related_product_id, p_related_review_id, p_related_refund_id, p_related_user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user_alert_admin_trigger() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_admin_alert('new_user_admin', 'Nouvel Utilisateur', 'L''utilisateur ' || NEW.name || ' (Role: ' || NEW.role || ') s''est inscrit.', NEW.id, NULL, NULL, NULL, NULL, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_new_profile_creation_alert_admins AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_alert_admin_trigger();

CREATE OR REPLACE FUNCTION public.handle_new_product_alert_admin_trigger() RETURNS TRIGGER AS $$
DECLARE a_farmer_name TEXT;
BEGIN
    IF NEW.is_approved = FALSE THEN
        SELECT name INTO a_farmer_name FROM public.profiles WHERE id = NEW.farmer_id;
        PERFORM public.create_admin_alert('product_pending_admin', 'Produit en Attente', 'Produit "' || NEW.name || '" par ' || COALESCE(a_farmer_name, 'un agriculteur') || ' attend approbation.', NEW.farmer_id, NULL, NEW.id);
    END IF; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_new_product_submission_alert_admins AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_new_product_alert_admin_trigger();

CREATE OR REPLACE FUNCTION public.handle_product_approved_alert_farmer_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_approved = TRUE AND OLD.is_approved = FALSE THEN
        INSERT INTO public.user_alerts (user_id, actor_id, type, title, message, related_product_id)
        VALUES (NEW.farmer_id, auth.uid(), 'product_approved_farmer', 'Produit Approuvé', 'Votre produit "' || NEW.name || '" a été approuvé.', NEW.id);
    END IF; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_product_approval_alert_farmer AFTER UPDATE OF is_approved ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_product_approved_alert_farmer_trigger();

CREATE OR REPLACE FUNCTION public.handle_new_order_item_alert_farmer_trigger() RETURNS TRIGGER AS $$
DECLARE buyer_name_var TEXT; product_name_var TEXT; alert_already_exists BOOLEAN; order_buyer_id uuid;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.user_alerts ua WHERE ua.related_order_id = NEW.order_id AND ua.user_id = NEW.farmer_id AND ua.type = 'new_order') INTO alert_already_exists;
    IF NOT alert_already_exists THEN
        SELECT o.buyer_id INTO order_buyer_id FROM public.orders o WHERE o.id = NEW.order_id;
        SELECT p.name INTO buyer_name_var FROM public.profiles p WHERE p.id = order_buyer_id;
        SELECT pr.name INTO product_name_var FROM public.products pr WHERE pr.id = NEW.product_id;
        INSERT INTO public.user_alerts (user_id, actor_id, type, title, message, related_order_id, related_product_id)
        VALUES (NEW.farmer_id, order_buyer_id, 'new_order', 'Nouvelle Commande', 'Cmd de "' || COALESCE(product_name_var, 'produit') || '" par ' || COALESCE(buyer_name_var, 'acheteur') || '.', NEW.order_id, NEW.product_id);
    END IF; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_new_order_item_insertion_alert_farmer AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.handle_new_order_item_alert_farmer_trigger();

CREATE OR REPLACE FUNCTION public.handle_order_status_change_alerts_trigger() RETURNS TRIGGER AS $$
DECLARE buyer_alert_type public.user_alert_type; buyer_alert_message TEXT; farmer_id_var uuid; buyer_name_text TEXT; order_id_short TEXT;
BEGIN
    order_id_short := SUBSTRING(NEW.id::text from 1 for 8);
    SELECT name INTO buyer_name_text FROM public.profiles WHERE id = NEW.buyer_id;

    IF NEW.status != OLD.status THEN
        CASE NEW.status
            WHEN 'paid' THEN buyer_alert_type := 'order_paid'; buyer_alert_message := 'Paiement pour cmd #' || order_id_short || ' confirmé.';
            WHEN 'delivering' THEN buyer_alert_type := 'order_delivering'; buyer_alert_message := 'Cmd #' || order_id_short || ' en livraison.';
            WHEN 'delivered' THEN buyer_alert_type := 'order_delivered'; buyer_alert_message := 'Cmd #' || order_id_short || ' livrée. Confirmez SVP!';
            ELSE buyer_alert_type := NULL;
        END CASE;
        IF buyer_alert_type IS NOT NULL THEN
            INSERT INTO public.user_alerts (user_id, actor_id, type, title, message, related_order_id)
            VALUES (NEW.buyer_id, auth.uid(), buyer_alert_type, 'Mise à Jour Commande', buyer_alert_message, NEW.id);
        END IF;
        IF NEW.status IN ('delivered', 'received') THEN
             INSERT INTO public.user_alerts (user_id, actor_id, type, title, message, related_order_id)
             VALUES (NEW.buyer_id, auth.uid(), 'please_review_order', 'Évaluez Votre Commande', 'Veuillez évaluer la cmd #' || order_id_short || '.', NEW.id);
        END IF;
        IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
            PERFORM public.create_admin_alert('new_payment_admin', 'Paiement Reçu (Admin)', 'Paiement pour cmd #' || order_id_short || ' par ' || COALESCE(buyer_name_text, 'un acheteur') || '.', NEW.buyer_id, NEW.id);
            SELECT oi.farmer_id INTO farmer_id_var FROM public.order_items oi WHERE oi.order_id = NEW.id LIMIT 1;
            IF farmer_id_var IS NOT NULL THEN
                INSERT INTO public.user_alerts (user_id, actor_id, type, title, message, related_order_id)
                VALUES (farmer_id_var, NEW.buyer_id, 'payment_received', 'Paiement Reçu', 'Paiement pour cmd #' || order_id_short || ' confirmé.', NEW.id);
            END IF;
        END IF;
    END IF; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_order_status_update_alert_parties AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_change_alerts_trigger();

CREATE OR REPLACE FUNCTION public.handle_new_review_alert_farmer_trigger() RETURNS TRIGGER AS $$
DECLARE reviewer_name_var TEXT;
BEGIN
    SELECT name INTO reviewer_name_var FROM public.profiles WHERE id = NEW.reviewer_id;
    INSERT INTO public.user_alerts (user_id, actor_id, type, title, message, related_order_id, related_review_id, related_product_id)
    VALUES (NEW.farmer_id, NEW.reviewer_id, 'new_review_posted', 'Nouvelle Évaluation', COALESCE(reviewer_name_var, 'Un acheteur') || ' a évalué (Note: ' || NEW.rating || '/5).', NEW.order_id, NEW.id, NEW.product_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_new_review_insertion_alert_farmer AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_new_review_alert_farmer_trigger();

CREATE OR REPLACE FUNCTION public.handle_new_refund_request_alert_admin_trigger() RETURNS TRIGGER AS $$
DECLARE buyer_name_var TEXT;
BEGIN
    IF NEW.status = 'initiated' THEN
        SELECT name INTO buyer_name_var FROM public.profiles WHERE id = NEW.buyer_id;
        PERFORM public.create_admin_alert('refund_request_admin', 'Demande de Remboursement', 'Demande par ' || COALESCE(buyer_name_var, 'un acheteur') || ' pour cmd #' || SUBSTRING(NEW.order_id::text from 1 for 8) || '.', NEW.buyer_id, NEW.order_id, NULL, NEW.id);
    END IF; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_new_refund_request_creation_alert_admins AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.handle_new_refund_request_alert_admin_trigger();

-- End of migration SQL --
