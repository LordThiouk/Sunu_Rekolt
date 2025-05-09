# Project Progress: Sunu Rekolt

## What Works

1. **Authentication & Authorization**
   - Basic authentication with phone & password ✅
   - User role selection (farmer, buyer) during registration ✅
   - Role-based redirects after login (Farmer to Dashboard, Buyer to Catalogue) ✅
   - Different UX flows based on user role (e.g., farmer-specific tabs) ✅

2. **Database**
   - Basic schema with `profiles`, `products`, `orders`, `order_items` ✅
   - RLS policies for basic data security ✅
   - Database triggers for `updated_at` timestamps ✅
   - Refunds table for payment processing ✅
   - Reviews table for farmer feedback ✅
   - User alerts table for notifications ✅
   - Triggers for automatic notification creation ✅

3. **UI & Navigation**
   - Welcome/login/register screens ✅
   - Tab-based navigation with role-specific tabs (Farmer: Dashboard, Produits, Catalogue, Profil; Buyer: Catalogue, Panier, Commandes, Profil) ✅
   - Farmer Dashboard (`app/(tabs)/farmer-dashboard.tsx`) UI with placeholders for sales, orders, reliability, and "Add Product" button ✅
   - Consistent header with app name, logo, and notification bell ✅
   - Basic profile viewing and editing ✅
   - Basic form validation ✅
   - Product cards in catalog ✅

4. **Backend Services**
   - Supabase authentication ✅
   - Database migrations via Supabase CLI ✅
   - Custom RPC function for order details ✅
   - Function for calculating reliability scores ✅

## In Progress

1. **Frontend**
   - Farmer Dashboard: Connect metrics to Supabase data, implement button actions 🔄
   - Farmer Sections: Develop "Mes Produits" (`my-products.tsx`) and "Commandes" (`farmer-orders.tsx`) screens 🔄
   - Notification list screen 🔄
   - Review submission flow 🔄
   - Reliability score display 🔄
   - Cart functionality 🔄
   - Checkout process 🔄
   - Order status management UI 🔄

2. **Backend**
   - Edge function for SMS notifications (Twilio) 🔄
   - Payment integration (PayDunya) 🔄
   - Implement RLS for new tables (reviews, user_alerts) 🔄
   - Process refund functions 🔄
   - Testing notification triggers 🔄

3. **Feature Development**
   - Complete product CRUD process 🔄
   - Order lifecycle management 🔄
   - Admin panel for product approval 🔄
   - SMS notifications system 🔄

1. **Complete Farmer Dashboard & Core Loop**
   - Connect Farmer Dashboard metrics to live data.
   - Implement "Ajouter un produit" flow for farmers.
   - Develop "Mes Produits" and "Commandes" screens for farmers.

2. **Complete Notification System**
   - Implement notification list screen

## Not Started

1. **Features**
   - Push notifications ❌
   - Reporting tools for admins ❌
   - Analytics dashboard ❌
   - Offline functionality ❌
   - Intégration boutique d'intrants (read-only in MVP) ❌
   - Admin management interface ❌

2. **Performance & Infrastructure**
   - Image compression & optimization ❌
   - Full test suite ❌
   - CI/CD pipeline ❌
   - App Store / Play Store submission ❌

## Known Issues

1. **Technical Debt**
   - Some TypeScript type inconsistencies between database nulls and frontend undefined values
   - Need to standardize styling approach (mix of StyleSheet and inline styles)
   - Form validation needs improvement
   - Error handling needs standardization
   - Loading states not consistently implemented

2. **UX Issues**
   - Limited error feedback to users
   - No loading indicators in some places
   - Missing confirmation dialogs for critical actions
   - Limited accessibility features

3. **Backend Concerns**
   - Need to implement more comprehensive RLS policies for new tables
   - Need to test notification triggers thoroughly 
   - Edge function deployment and testing needed

## Next Milestone: Core Features

Complete the following to reach the next project milestone:

1. **Complete Notification System**
   - Implement notification list screen
   - Add unread count indicator
   - Test notification triggers with sample data
   - Connect to real order events

2. **Implement Review System**
   - Create review submission form
   - Display past reviews
   - Show reliability score on farmer profiles
   - Test automatic score calculation

3. **Finalize Order Lifecycle**
   - Complete order status tracking
   - Implement status change notifications
   - Add payment integration

This milestone represents the core marketplace functionality to enable farmers and buyers to effectively use the platform.

## Bug Fixes & Improvements

### Recent Fixes (May 2025)

1. **Payment Flow RLS Error** (FIXED)
   - Issue: Payment processing was failing with error `new row violates row-level security policy for table "user_alerts"`
   - Fix: Created proper RLS policies for the `user_alerts` table via migration
   - Migration file: `20250508184309_fix_user_alerts_rls.sql`
   - Status: ✅ Fixed and deployed

## Progress - Push Notifications Feature

**What Works:**
*   **Client Push Token Registration:** App successfully registers for Expo push notifications, and the token (`ExponentPushToken[qBvYe7BggYlWt2cnWTBWpf]`) is saved to the `profiles` table for the test user.
*   **Database Setup:** `user_alerts` table created.
*   **DB Trigger:** `on_new_user_alert_send_push_row` trigger is created and attached to `user_alerts`.
*   **Edge Function:** `send-expo-push-notification` Edge Function is deployed.
*   **Trigger to Edge Function Call (via temporary hardcoding):** Confirmed that the DB trigger *can* successfully invoke the Edge Function when a Service Role Key is available.
*   **FCM Server Key:** The FCM Server Key has been configured in EAS credentials.
*   **Foreground Notification Handling:** App's notification handler processes notifications when the app is in the foreground.

**What's Left to Build/Fix:**
1.  **End-to-End Push Notification Delivery:** Confirm successful push notification delivery to the device now that the FCM Server Key is configured.
2.  **Secure Service Role Key Access for DB Trigger (Production Viability):**
    *   **Vault Issue:** Resolve the `ERROR: schema "supabase_vault" does not exist` problem. This is critical for securely fetching the Service Role Key in the trigger. Likely a Supabase free tier limitation or misconfiguration.
    *   **Alternative (if Vault fails):** If Vault is not a viable option on the free tier, an alternative secure method for the trigger to authenticate its call to the Edge Function needs to be implemented.
3.  **EAS Build Configuration:** Fix the `slug` vs `extra.eas.projectId` mismatch warning to ensure clean and correctly associated EAS builds.
4.  **Refinement & Testing:**
    *   Test push notifications thoroughly when the app is in the background or killed.
    *   Ensure no hardcoded keys or temporary test code remains in any production path.
    *   Consider error handling and retry mechanisms in the push notification pipeline.

**Current Status:**
*   The push notification pipeline is substantially built. The main components (client token, DB trigger, Edge Function) are in place.
*   The immediate blocker for a fully secure and functional pipeline is the inability of the DB trigger to access the Service Role Key via Supabase Vault (likely due to free tier constraints).
*   An FCM configuration issue was identified and resolved. Ready for a full end-to-end test once the trigger can be safely (even if temporarily) enabled with a valid key.

**Known Issues:**
*   **Supabase Vault:** `ERROR: schema "supabase_vault" does not exist` prevents the DB trigger from using `supabase_vault.secret_get()` to obtain the Service Role Key. This is the primary blocker for a secure implementation on the free tier.
*   **EAS Build Warning:** `Project config: Slug for project identified by "extra.eas.projectId" (bolt-expo-nativewind) does not match the "slug" field (sunurekolt)`. 