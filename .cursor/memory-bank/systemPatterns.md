# System Patterns: Sunu Rekolt

## 1. Overall Architecture

*   **Mobile-First:** React Native (Expo SDK 53) application for iOS and Android.
*   **Backend-as-a-Service (BaaS):** Supabase handles Auth, Database (PostgreSQL), Storage, and Edge Functions.
*   **Serverless:** Relies on Supabase infrastructure and Edge Functions for backend logic (e.g., notifications, payments, refunds).
*   **Event-Driven:** Database triggers and Edge Functions respond to events (e.g., new order -> SMS notification, new review -> reliability score update).

## 2. Frontend Patterns (React Native / Expo)

*   **Routing:** Expo Router with directory-based routing (`app/(auth)`, `app/(tabs)`).
    *   Welcome screen implemented at `app/(auth)/index.tsx` as entry point for unauthenticated users
    *   Authentication flow: Welcome → Login/Register → Main App
    *   Redirection in `app/index.tsx` to appropriate route based on authentication state
    *   Role-based navigation: Farmers directed to dashboard, buyers to catalog
*   **Navigation Structure:**
    *   Tab-based navigation via `app/(tabs)/_layout.tsx` with role-specific tabs
    *   Farmers see: Dashboard, Produits, Catalogue, Profil
    *   Buyers see: Catalogue, Commandes, Panier, Profil
    *   Hidden screens (not in tabs but accessible via navigation) include: product detail, orders, edit profile
*   **State Management:** React Context API for global state (`AuthContext`, `CartContext`). Includes manual context update pattern (`updateUser` in `AuthContext`) for profile changes.
*   **Component Structure:** Reusable UI components in `components/` (e.g., `ProductCard`, `Button`).
*   **UI Styling:** Mixed approach:
    *   **StyleSheet.create** with theme constants (`constants/Colors.ts`) - Primary method for auth screens and most recent components
    *   **TailwindCSS/NativeWind** classes in older components (experiencing issues with proper application)
    *   Transition toward consistent direct StyleSheet approach in progress
*   **Design Patterns:**
    *   **Background Pattern:** Pattern image with semi-transparent color overlay (rgba(240, 255, 240, 0.85))
    *   **Color Scheme:** Primary green (#059669) for buttons, icons, links, and accents
    *   **Icons:** Icons displayed in colored containers with rounded corners
    *   **Form Inputs:** Consistent styling with labels, placeholders, and validation
    *   **Buttons:** Primary action buttons in green with white text, secondary/ghost buttons for less prominent actions
    *   **Role Selection:** Custom segmented control for role selection (farmer/buyer)
    *   **Country Code Selector:** Custom component for international phone numbers
    *   **Metric Cards:** Used in dashboard - white cards with colored circular icon containers, value, and label
    *   **Action Buttons:** Primary (filled green) and outline (green border) styles with icon containers
    *   **Header:** Consistent green header with app name and white icon logo
    *   **Notifications:** Bell icon in header to access notifications list
*   **Dashboard UI Pattern:**
    *   Welcome card with user name and subtitle
    *   2x2 grid of metric cards with colored circular icons
    *   Each metric card contains: icon, value, and descriptive label
    *   "Actions Rapides" section with prominent buttons
    *   Clickable elements for navigation (e.g., orders metric card navigates to orders screen)
*   **Typography:** 
    *   Uses custom fonts via Expo Google Fonts:
       *   `Inter_400Regular`, `Inter_500Medium`, etc. for general text
       *   `BalooBhai2_400Regular`, `BalooBhai2_600SemiBold`, etc. for branded elements
    *   Font loading implemented in `app/_layout.tsx` with SplashScreen control
    *   Typography hierarchy:
       *   App title: `BalooBhai2_600SemiBold`, 24pt, green (#059669)
       *   Screen titles: `BalooBhai2_600SemiBold`, 24pt, dark gray (#212121)
       *   Body text: `BalooBhai2_400Regular`, 16pt or 14pt depending on context
       *   Button text: `BalooBhai2_400Regular` for default, `BalooBhai2_600SemiBold` for emphasis
       *   Metric values: `BalooBhai2_600SemiBold`, 18pt, dark gray (#424242)
       *   Metric labels: `BalooBhai2_400Regular`, 13pt, medium gray (#616161)
*   **Icons:** Uses `@expo/vector-icons` (specifically Feather) for UI iconography (migrated from `lucide-react-native`).
*   **Forms:** `react-hook-form` for form state management and validation, `zod` for schema validation.
*   **Image Handling:**
    *   Display: `expo-image`.
    *   Selection: `expo-image-picker`.
    *   Upload Prep: `expo-file-system` used to read image as base64 string for direct upload via Supabase client.
*   **Asynchronous Operations:** `async/await` with error handling (e.g., Supabase calls, image uploads).
*   **Type Safety:** TypeScript used throughout the codebase. Encountered issues matching DB `null` values with frontend `undefined` types, addressed with casting.

## 3. Backend Patterns (Supabase)

*   **Authentication:** Phone/Password + OTP (Twilio integration planned), managed by Supabase Auth.
*   **Authorization:** Row Level Security (RLS) policies enforce data access based on user roles (`farmer`, `buyer`, `admin`) and context (e.g., phone visibility post-order).
*   **Data Modeling:** Relational database (PostgreSQL) with tables like `profiles`, `products`, `orders`, `order_items`, `refunds`, `user_alerts`, `reviews`.
    *   **`orders` table schema (observed):**
        *   `id` (uuid, primary key)
        *   `buyer_id` (uuid, foreign key to `profiles.id`)
        *   `total` (numeric) - Likely the total amount for the order.
        *   `status` (text) - e.g., 'paid', 'received', 'pending_farmer_action', 'delivering', 'cancelled'.
        *   `payment_method` (text)
        *   `created_at` (timestamp with time zone)
        *   `updated_at` (timestamp with time zone)
        *   `delivery_address` (text, nullable)
        *   `delivery_details` (text, nullable)
        *   *Note: Does not directly contain `farmer_id`. Farmer association is through `order_items` -> `products`.*
    *   **`order_items` table schema (observed):**
        *   `id` (uuid, primary key)
        *   `order_id` (uuid, foreign key to `orders.id`)
        *   `product_id` (uuid, foreign key to `products.id`)
        *   `farmer_id` (uuid, foreign key to `profiles.id`) - *This was observed in an example row, indicating denormalization or a specific setup for farmer attribution per item.*
        *   `quantity` (integer)
        *   `price_at_time` (numeric) - Price of one unit of the product when the order was placed.
        *   `created_at` (timestamp with time zone)
*   **API Access:** Direct calls to Supabase REST API (auto-generated) and custom RPC functions (`get_order_details_for_farmer`, `get_farmer_sales_summary`) from the frontend client (`@supabase/supabase-js`).
*   **Storage:** User uploads are managed in dedicated Supabase Storage buckets:
    *   `user-uploads`: For profile avatars and field pictures. Images are stored with paths like `avatars/<USER_ID>/<FILENAME>` or `fields/<USER_ID>/<FILENAME>`.
    *   `product-images`: For product images. Images are stored with paths like `products/<FARMER_ID>/<FILENAME>`. This path structure was implemented in `app/(tabs)/product/add.tsx`.
    *   Both buckets are secured with RLS policies for access control. Uploads are primarily implemented using base64 strings or blobs via the JS client.
*   **Edge Functions:** Planned for server-side logic requiring secrets (Twilio SMS, PayDunya payments/refunds).
*   **Database Functions/Triggers:** 
    * Used for data consistency (`updated_at` timestamps)
    * Triggers for notification creation (`create_notification_on_new_order`, `create_notification_on_order_status_change`)
    * Function for calculating reliability scores based on reviews and order completion
    * Triggers for alerting system events (payment, refund, new user, new product)
*   **Notification System:** 
    * `user_alerts` table tracks all notifications for users
    * Categorized by type (`order_related`, `payment_related`, `review_related`, `system`) 
    * Generated automatically by database triggers
    * Prioritized by importance level
    * Read/unread status tracking
*   **Reviews & Reliability Score:**
    * `reviews` table stores user reviews after order completion
    * Ratings stored as 1-5 value with comments
    * Reliability score calculated from review ratings, order completion rate, and refund rate
    * Auto-updates on profiles via triggers

## 4. Development & Build Process

*   **Package Management:** `npm` used, with `--legacy-peer-deps` flag required for SDK 53 upgrade.
*   **Build Configuration:** Custom `metro.config.js` to disable package exports.
*   **Type Checking:** `typescript` compiler (`tsc`).
*   **Linting:** ESLint.
*   **Version Control:** Git / GitHub. Changes regularly pushed.
*   **Supabase Migrations:** Managed via Supabase CLI (`supabase migrations new`, `supabase db push`).

## 5. Key Data Flow Patterns

*   **Authentication Flow:** 
    *   User arrives on welcome screen -> Chooses register/login -> Completes auth -> Redirected to main app
    *   System checks session on app load and routes appropriately via `app/index.tsx`
    *   Role-based redirection: Farmers to dashboard, buyers to catalog
    *   Registration validation includes role-specific fields (e.g., location required for farmers)
    *   Terms & conditions acceptance required for registration
*   **Farmer Dashboard Flow:**
    *   Metrics displayed from placeholders (to be connected to Supabase data)
    *   Orders metric card clickable - navigates to orders screen
    *   "Add Product" button navigates to product creation flow
    *   "View Orders" button provides alternative navigation to orders screen
*   **Product Lifecycle:** Farmer creates (`pending`) -> Admin receives notification -> Admin reviews (`approved`/`rejected`) -> If approved, Farmer receives notification -> Buyer views (`approved`).
*   **Order Lifecycle:** Buyer initiates -> Pays (PayDunya) -> `paid` -> Farmer notified (SMS + in-app) -> Farmer marks `delivering` -> Buyer receives notification -> Buyer confirms `received` -> Buyer prompted to review farmer -> (Future: Payout triggered).
*   **Phone Number Access:** RLS policies strictly control access to `profiles.phone`. Only visible between buyer/farmer *after* an order is placed/confirmed.
*   **Refunds:** Initiated by buyer/admin -> Recorded in `refunds` table -> Processed by `process_refund` Edge Function (calls PayDunya API) - Planned.
*   **Profile Update:** User edits via `EditProfileScreen` -> Images uploaded to Storage (as base64) -> Text/URLs saved to `profiles` table -> `AuthContext` state updated manually via `updateUser` with verified partial changes.
*   **Notification Flow:** Event occurs (order placed, status changed) -> Trigger executes -> Entry added to `user_alerts` -> Frontend polls or listens for new notifications -> Displays count/list.
*   **Review & Rating Flow:** Order marked `received` -> Buyer prompted to review -> Review saved to `reviews` table -> Trigger recalculates reliability score -> Score updated in `profiles.reliability_score`.

## 6. Security Patterns

*   RLS is the primary mechanism for data access control.
*   API keys (Twilio, PayDunya) stored securely as Supabase Edge Function secrets, never exposed client-side.
*   Input validation on client (Zod) and server (DB constraints, Edge Function logic).
*   HTTPS enforced for all communication.
*   Supabase Storage access for `user-uploads` and `product-images` buckets is controlled via specific RLS policies. The `product-images` RLS policies ensure farmers can only manage images in their designated folders.
*   Notification privacy enforced via RLS policies (users can only see their own notifications).
*   Reviews visible to all but can only be created by the buyer in an order.

## Row Level Security (RLS) Policies

Supabase RLS policies control data access based on user roles and ownership:

### Core RLS Patterns

1. **Ownership-based access**:
   - Users can only read/modify their own data
   - Example: `auth.uid() = user_id` in policy conditions
   
2. **Role-based access**:
   - Different capabilities based on user role (farmer vs buyer vs admin)
   - Admins have broader access to data
   
3. **Public vs Private data**:
   - Public data (e.g., approved products) available to all authenticated users
   - Private data (user details, messages) restricted to relevant parties

### Table-Specific Policies

#### user_alerts
- **INSERT**: Any authenticated user can create alerts (application logic ensures correct recipient)
- **SELECT/UPDATE/DELETE**: Users can only access their own alerts (where `auth.uid() = user_id`)
- This enables the notification system while maintaining privacy 

#### products
- **SELECT Policies for Product Visibility**:
    - **"Farmers can view their own products"**: Allows farmers to see all their products (e.g., for management in "My Products" screen). Condition: `(SELECT role FROM public.profiles WHERE id = auth.uid()) = 'farmer' AND farmer_id = auth.uid()`.
    - **"Buyers can view all approved products"**: Allows buyers to see all `is_approved = true` products in the catalogue. Condition: `(SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'farmer' AND is_approved = true`.
    - **"Farmers can view other approved products in catalogue"**: Allows farmers to see `is_approved = true` products from *other* farmers. Condition: `(SELECT role FROM public.profiles WHERE id = auth.uid()) = 'farmer' AND farmer_id <> auth.uid() AND is_approved = true`. 
        - *Note*: To ensure farmers don't see their *own* products in the *general catalogue*, the frontend query in `app/(tabs)/index.tsx` for this specific view also includes a filter `products.farmer_id <> auth.uid()` when the user is a farmer. This works in conjunction with RLS.
- **Other `products` policies** (INSERT, UPDATE, DELETE) would typically restrict these actions to the `farmer_id` who owns the product or to `admin` users.

#### order_items
- **INSERT**: Policy "Prevent ordering own products" checks that `(SELECT p.farmer_id FROM public.products p WHERE p.id = product_id) <> auth.uid()`. This prevents a user from adding a product to an order if they are the farmer who listed that product. 

#### storage.objects (product-images bucket)
- **SELECT**: Public read access is allowed for all objects in the `product-images` bucket.
- **INSERT**: Authenticated users with the 'farmer' role can upload to a path `products/<THEIR_USER_ID>/<FILENAME>`.
- **UPDATE**: Authenticated users with the 'farmer' role can update objects within their own `products/<THEIR_USER_ID>/` path.
- **DELETE**: Authenticated users with the 'farmer' role can delete objects from their own `products/<THEIR_USER_ID>/` path.
- *Note: These policies were implemented in migration `20250510232515_create_rls_for_product_images_bucket.sql`.*

## Navigation Patterns

*   **Expo Router:** File-based routing is used via `expo-router`.
    *   Layouts are defined in `_layout.tsx` files within route groups (e.g., `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`).
    *   Screens are individual `.tsx` files or `index.tsx` within a directory for the default screen of that route.
*   **Role-Based Redirection and Tab Layout:**
    *   **Redirection:** `context/AuthContext.tsx` handles redirection after login. Based on the `user.role`:
        *   Farmers are redirected to `/(tabs)/farmer-dashboard`.
        *   Buyers are redirected to `/(tabs)/` (which typically loads `index.tsx` or the first defined tab like Catalogue).
    *   **Conditional Tabs:** `app/(tabs)/_layout.tsx` conditionally renders different sets of tabs based on `user.role` fetched from `AuthContext`.
        *   **Farmer Tabs:** Dashboard, Mes Produits, Catalogue, Profil.
        *   **Buyer Tabs:** (Example: Catalogue, Panier, Commandes, Profil - to be confirmed/refined as buyer section is built out).
    *   This pattern centralizes role-specific navigation logic, keeping individual screen components focused on their content.

## State Management

*   **React Context API:** Used for global state management in `AuthContext` and `CartContext`.
*   **Manual Context Update:** `updateUser` method in `AuthContext` for manual profile updates.
*   **Conditional Rendering:** Based on user role, different sets of tabs are rendered in `app/(tabs)/_layout.tsx`.
*   **Role-Based Redirection:** After login, users are redirected to appropriate dashboard based on their role.

## Backend Push Notification Flow (Server-Triggered)

This pattern describes how a new important event in the database triggers a push notification to a user via an Expo Push Notification service.

1.  **Event Creation:** An event occurs that needs to notify a user (e.g., new order for a farmer, critical system alert). This results in a new row being inserted into the `public.user_alerts` table with relevant details (`user_id`, `title`, `message`, `data`, `importance_level`, etc.).
2.  **Database Trigger Activation:**
    *   An `AFTER INSERT ON public.user_alerts FOR EACH ROW` trigger named `on_new_user_alert_send_push_row` is activated.
    *   This trigger executes the `plpgsql` function `public.trigger_send_push_notification_for_row()`.
3.  **Trigger Function Logic (`trigger_send_push_notification_for_row`):**
    *   Checks if the `NEW.importance_level` is 'high' or 'critical' and `NEW.is_read` is `FALSE`.
    *   Constructs a JSON payload containing `user_id`, `title`, `message`, and `data` from the `NEW` alert record.
    *   Retrieves the Supabase Service Role Key by reading a PostgreSQL configuration variable (`current_setting('app_settings.supabase_service_key', true)`). **This variable must be pre-set by an administrator directly in the database.**
    *   Constructs the URL for the `send-expo-push-notification` Edge Function (e.g., `https://<project_ref>.supabase.co/functions/v1/send-expo-push-notification`).
    *   Uses the `pg_net` PostgreSQL extension to make an HTTP POST request to the Edge Function URL.
    *   The request includes the JSON payload and an `Authorization: Bearer <SERVICE_ROLE_KEY>` header.
    *   Includes basic error handling to log issues with the HTTP call without failing the original database transaction.
4.  **Edge Function Execution (`send-expo-push-notification`):**
    *   The Deno-based Edge Function receives the HTTP POST request.
    *   It parses the JSON payload (`user_id`, `title`, `message`, `data`).
    *   It initializes a Supabase client using its own environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`) set via `supabase secrets set`. This client is used to query the database.
    *   It queries the `public.profiles` table to fetch the `expo_push_token` for the given `user_id`.
    *   If a token is found, it constructs a message object for the Expo Push API (`https://exp.host/--/api/v2/push/send`), including the `to` (token), `title`, `body` (message), and `data` fields.
    *   It makes an HTTP POST request to the Expo Push API.
    *   It logs the response from Expo and handles potential errors, such as "DeviceNotRegistered" (optionally clearing the invalid token from `profiles`).
5.  **Push Notification Delivery:**
    *   Expo's Push API attempts to deliver the notification to the user's device via APNS (Apple) or FCM (Google).
    *   The frontend app, upon receiving the push notification (while in foreground, background, or killed state), handles it according to its setup (displaying, navigating on tap via the `data` payload).

**Security Considerations:**
*   The Service Role Key used by the database trigger must be managed securely (e.g., via PostgreSQL configuration variables set by an admin, not hardcoded).
*   The Edge Function itself is JWT-protected (`verify_jwt = true` in `config.toml`), and the database trigger provides the Service Role Key as the Bearer token.
*   The Edge Function uses its own Service Role Key (via `supabase secrets set`) for its internal Supabase client to query `expo_push_token`.