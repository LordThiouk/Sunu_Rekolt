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
*   **API Access:** Direct calls to Supabase REST API (auto-generated) and custom RPC functions (`get_order_details_for_farmer`) from the frontend client (`@supabase/supabase-js`).
*   **Storage:** User uploads (avatar, field pictures) stored in Supabase Storage buckets (`user-uploads`) with RLS policies for access control. Upload implemented using base64 strings via JS client.
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
*   Supabase Storage access controlled via RLS policies (needs verification, especially for uploads).
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