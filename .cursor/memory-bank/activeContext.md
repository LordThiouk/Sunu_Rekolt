# Active Context - Sunu Rekolt

## Recently Achieved Goal
Resolved critical "Bucket not found" error for product image uploads. This involved:
*   Deciding to use a separate `product-images` bucket for product listings.
*   Manually creating the `product-images` bucket in Supabase.
*   Modifying `app/(tabs)/product/add.tsx` to use the `product-images` bucket and include `farmer_id` in the image path (`products/<FARMER_ID>/<FILENAME>`).
*   Creating and applying a new database migration (`20250510232515_create_rls_for_product_images_bucket.sql`) to establish RLS policies for the `product-images` bucket, ensuring farmers can manage their own images.
*   **Connected Farmer Dashboard to live data:**
    *   Successfully fetched and displayed live data for metrics: Reliability Score, New Orders Count (status 'paid').
    *   Created and deployed a new Supabase RPC function `get_farmer_sales_summary(farmer_id_param uuid)` to calculate total sales and current month sales (based on orders with status 'received' and using `price_at_time` from `order_items`). This involved iterative debugging of the SQL to correctly reference table columns (e.g., `price_at_time` instead of `price` in `order_items`, and deriving farmer association via `order_items` -> `products` instead of a direct `farmer_id` on the `orders` table).
    *   Integrated the existing `ActivityDashboard` component into the Farmer Dashboard screen, which fetches its own activity data (total products, monthly order counts, top product) using the farmer's ID.

## Current Goal
Review other pending tasks or features now that the Farmer Dashboard is connected to live data. Defer full server-side push notification implementation (DB trigger to Edge Function) until Supabase paid plan allows for Vault usage for secure key management. Client-side push token registration is functional.

## Recent Changes & Discoveries
*   **Product Image Upload Functionality Restored & Verified.**
*   **Farmer Dashboard Live Data Integration:**
    *   `app/(tabs)/farmer-dashboard.tsx` updated to fetch reliability score, new orders count, and sales data.
    *   RPC function `get_farmer_sales_summary` created via migration `supabase/migrations/20250511015623_create_farmer_sales_summary_rpc.sql`. Troubleshooting involved correcting column name references within the SQL (e.g., `orders.farmer_id` to an indirect lookup, `order_items.price` to `order_items.price_at_time`) and resolving migration history sync issues with `supabase db pull` and `supabase migration repair` before successfully applying the migration with `supabase db push`.
    *   `ActivityDashboard` component confirmed to be functional and integrated, fetching its own data.
*   **Clarification of `ActivityDashboard` Data & Labels:**
    *   Identified that the RPC functions used by `ActivityDashboard.tsx` (`get_farmer_monthly_sales`, `get_farmer_top_products`) filter orders by `status = 'paid'`, not `status = 'received'`.
    *   Updated labels in `ActivityDashboard.tsx` for clarity: "Commandes reçues" changed to "Commandes Payées (6m)" and chart title "Évolution des ventes" changed to "Évolution des Commandes Payées". This ensures the UI accurately reflects the underlying data related to paid orders rather than completed sales (received orders).
*   **Resolution of `lucide-react-native` Import Error:**
    *   Identified and fixed an import error in `components/ActivityDashboard.tsx` that was attempting to use the uninstalled `lucide-react-native` package.
    *   Replaced `lucide-react-native` icons with equivalents from `@expo/vector-icons/Feather`.
*   **`.env` File Issues Resolved.**
*   **Database Migration for Initial Push Notification Trigger Applied** (functionality on hold).
*   **Edge Function Code Created for Push Notifications** (functionality on hold).
*   **Push Notification Backend Configuration Challenges & Deferral:** Confirmed Vault unavailability on free tier and insufficient permissions for GUC-based secret management, leading to deferral of backend push notification work.
*   **Docker Confirmed Running.**

## Next Immediate Steps
1.  **Identify and prioritize the next feature or task for development.**
2.  (Previously completed) Verify Product Image Uploads.
3.  (Previously completed) Revert/Remove Pre-Shared Key Migration for push notifications.

## Open Questions/Decisions
*   Strategy for addressing local Deno linting issues in VS Code for Edge Functions (user to investigate Deno VS Code extension setup).
*   Push notification architecture for server-side triggers will be revisited with Vault once on a Supabase paid plan.

## Current Focus

We're currently implementing and enhancing the notification system and review functionality for the Sunu Rekolt app. This includes:

1. Creating notification infrastructure via the `user_alerts` table
2. Implementing review functionality to calculate farmer reliability scores
3. Setting up database triggers to automate notification creation
4. Designing UI components for displaying notifications
5. Connecting the header notification icon to the backend

The app's UI has been overhauled to improve user experience, with a consistent header now featuring the app name with a logo on the left and a notification bell on the right. This header appears across all screens.

We have also refined the navigation structure to simplify the farmer's experience by limiting to 4 tabs instead of 5 (removed the dedicated Orders tab but kept the screen accessible through the dashboard).

## Recent Changes

1. **Database Schema Enhancements** (Migration: 20250508181151_create_notifications_reviews_score.sql)
   - Added `reliability_score` column to `profiles` table
   - Added `reviews` table for storing buyer reviews of farmers
   - Added `user_alerts` table for in-app notifications
   - Added database triggers for automatic notification creation
   - Created function for calculating reliability scores
   - Ensured `refunds` table exists for payment processing

2. **UI/UX Improvements**
   - Updated header to show app name with white logo on left, notification bell icon on right
   - Simplified farmer navigation to 4 tabs
   - Created dashboard UI with metrics and quick action buttons
   - Applied consistent styling across screens

3. **Role-Based Navigation**
   - Implemented separate tab layouts for farmers vs buyers
   - Added role-based redirection after login

4. **Recent Changes (May 2025)**
   - **Fixed RLS Policy for `user_alerts` Table**
     - Added missing RLS policies for the `user_alerts` table via migration file `20250508184309_fix_user_alerts_rls.sql`
     - This addressed the critical error that was preventing users from completing the payment process
     - Policies created:
       - `Allow authenticated users to create alerts` (INSERT)
       - `Users can view their own alerts` (SELECT)
       - `Users can update their own alerts` (UPDATE)
       - `Users can delete their own alerts` (DELETE)
     - The policies ensure that while any authenticated user can create alerts (application logic handles the recipient), users can only view, update, and delete their own alerts.

5. **Refined Farmer Product Access (May 2025)**
   - **Migration**: `20250508185302_refine_farmer_product_access_rls.sql`
   - **Objective**: 
       - Prevent farmers from ordering their own products.
       - Prevent farmers from seeing their own products in the general catalogue listing (they use "My Products" section for that).
   - **RLS Policies Added/Updated**:
       - **`order_items` (INSERT)**: New policy "Prevent ordering own products" stops insertion if `products.farmer_id` matches `auth.uid()` for the item being added.
       - **`products` (SELECT)**: 
           - "Farmers can view their own products": Ensures farmers can always see their items (e.g., in a dedicated "My Products" screen).
           - "Buyers can view all approved products": Standard access for buyers to the catalogue.
           - "Farmers can view other approved products in catalogue": Allows farmers to see products from other farmers in the general catalogue.
           - *Frontend Enhancement*: The catalogue screen (`app/(tabs)/index.tsx`) now also includes a client-side filter (`query = query.neq('farmer_id', user.id);`) when a farmer is viewing, to explicitly hide their own products from this general listing, complementing the RLS policies.
   - **Impact**: Enhances business logic integrity and user experience by creating clearer boundaries for farmer interactions with their own products in the marketplace context.

## Next Steps

1. **Frontend**:
   - Build notification list screen (accessible via bell icon)
   - Implement notification counter (unread count)
   - Create review prompt and form after order completion
   - Display reliability score on farmer profiles
   - Connect dashboard metrics to real Supabase data

2. **Backend**:
   - Test notification triggers with sample data
   - Implement periodic reliability score calculation
   - Create Edge Function for SMS notifications via Twilio
   - Connect refund system with PayDunya

## Active Decisions & Considerations

1. **Notification Priority Levels**:
   - Critical: Payment failures, refund status changes, account issues
   - High: New orders, order status changes
   - Medium: Product approvals, reviews received
   - Low: System announcements, tips

2. **Reliability Score Calculation**:
   - Based on review ratings (1-5 stars) - 60% weight
   - Order completion rate - 30% weight
   - Refund rate (lower is better) - 10% weight

3. **User Experience Flow**:
   - When an order is placed, farmer receives both SMS and in-app notification
   - When order status changes, both parties receive in-app notifications
   - After receiving an order, buyer is prompted to review the farmer
   - Admin receives notifications for new products, significant payments, refund requests

4. **Technical Implementation**:
   - Database triggers are preferred for notification generation (efficiency, reliability)
   - Notifications polled on app startup and periodically while app is active
   - Reviews saved immediately but reliability score calculation may be batched

## Blockers / Questions

1. **Notification delivery**:
   - Need to determine if we'll implement real-time updates or polling
   - If real-time, consider Supabase Realtime subscriptions

2. **Review UI design**:
   - Need mockup for review submission form and display

3. **Reliability Score Display**:
   - Determine visual representation (stars, percentage, or numerical score)

## 1. Current Focus

*   **Farmer Dashboard Implementation:** Implemented and improved the farmer dashboard with metrics, welcome message, and quick action buttons.
*   **Tab Navigation Reorganization:** Fixed the tab navigation for farmers to display only 4 tabs (Dashboard, Produits, Catalogue, Profil).
*   **Header Styling:** Updated the application header design to maintain consistent branding and visual style.
*   **Previous Focus:**
    *   Authentication UI Redesign
    *   Login Screen Implementation
    *   Registration Screen Implementation
    *   Typography Implementation

## 2. Recent Changes

*   **Farmer Dashboard (`app/(tabs)/farmer-dashboard.tsx`):**
    *   Implemented a clean dashboard with welcome message showing the farmer's name
    *   Created a metrics grid with 4 key performance indicators:
        *   Monthly sales figures
        *   New orders to process (with clickable navigation)
        *   Reliability score percentage  
        *   Total sales figures
    *   Added circular icon backgrounds with appropriate colors for each metric
    *   Implemented "Actions Rapides" section with two buttons:
        *   "Ajouter un nouveau produit" button (primary style)
        *   "Voir toutes mes commandes" button (outline style)
    *   Made the orders metric card clickable to navigate to orders screen

*   **Tab Navigation Structure (`app/(tabs)/_layout.tsx`):**
    *   Fixed the tab layout structure to properly show only 4 main tabs for farmers
    *   Addressed TypeScript errors related to headerTitleAlign
    *   Reorganized tab screens to prevent "Layout children must be of type Screen" warnings
    *   Updated the header styling with consistent green color and icon
    *   Created proper conditional rendering based on user role

*   **Authentication Context (`context/AuthContext.tsx`):**
    *   Fixed routing issues to ensure farmers are directed to their dashboard on login
    *   Addressed type errors with router.replace paths

*   **Previous Changes:**
    *   Authentication UI Redesign (Welcome, Login, Register screens)
    *   Typography implementation with Baloo Bhai 2 font
    *   Dependencies upgraded to Expo SDK 53 / RN 0.79 / React 19
    *   Icon refactoring from lucide-react-native to @expo/vector-icons/Feather

## 3. Next Steps

1.  **Complete Dashboard Integration:**
    * Connect dashboard metrics to actual data from Supabase (currently using placeholder data)
    * Implement any missing functionality in the "Ajouter un nouveau produit" flow

2.  **Extend Styling Implementation:** 
    * Apply consistent styling to remaining screens in the app
    * Address any TypeScript/styling warnings throughout the app

3.  **Address Previously Identified Issues:**
    * Resolve Profile Image Rendering Bug
    * Choose a long-term solution for the type mismatch in `edit-profile.tsx`
    * Address Text rendering warnings

4.  **Implement Core Features:**
    * Complete Payment Screen & Flow (PayDunya Integration)
    * Farmer Order Management
    * Add Product Screen
    * Admin Panel

## 4. Open Questions / Decisions

*   How to formalize the design system (colors, typography, spacing) for consistency across all screens
*   Best approach for form validation (current approach vs form libraries)
*   Whether to use a standard loading indicator component across the app
*   Whether to implement additional features for the farmer dashboard (charts, trend analysis)

## 5. Blockers

*   **Dependency State:** Risk of runtime instability due to `--legacy-peer-deps` installation.
*   **Profile Image Rendering Bug:** Prevents users from seeing updated images immediately.
*   **Component Styling:** Moving away from TailwindCSS/NativeWind to standard React Native styles requires refactoring of existing screens.

## Active Context - Push Notifications & Backend Integration

**Current Focus:**
*   Achieving successful end-to-end push notification delivery: DB Insert -> DB Trigger -> Edge Function -> Expo Push Service -> Device.
*   Resolving the Supabase Vault access issue (`schema "supabase_vault" does not exist`) for the database trigger to securely obtain the Service Role Key, especially considering the project is on the Supabase free tier.
*   If Vault is not viable on the free tier, research and implement an alternative secure authentication mechanism for the DB trigger to call the Edge Function.

**Recent Changes:**
*   **Client-Side Push Token:** Successfully implemented Expo push token registration on the client. Token is correctly saved to `profiles.expo_push_token`.
*   **DB Trigger & Edge Function:**
    *   Created `user_alerts` table.
    *   Developed and deployed a database trigger (`on_new_user_alert_send_push_row` using `trigger_send_push_notification_for_row()`) that calls the `send-expo-push-notification` Edge Function.
    *   Edge Function `send-expo-push-notification` is deployed.
*   **Trigger Authentication & Testing:**
    *   Diagnosed `ERROR: schema "supabase_vault" does not exist` when the trigger attempts to use `supabase_vault.secret_get()`. This is likely related to Supabase free tier limitations.
    *   Temporarily hardcoded the Service Role Key in the DB trigger for a test. This confirmed the trigger *can* call the Edge Function.
    *   **Security:** The trigger was immediately reverted to the secure (Vault-calling) version after this test.
*   **FCM Configuration:**
    *   The hardcoding test revealed an FCM `InvalidCredentials` error from the Edge Function.
    *   Resolved this by adding the FCM Server Key to EAS credentials.

**Next Steps:**
1.  **Final Push Notification Test:** Re-test the end-to-end push notification pipeline (DB insert -> ... -> device) now that the FCM Server Key is configured. This will require another cycle of:
    *   Temporarily modifying the DB trigger to use the hardcoded Service Role Key (manually in SQL Editor).
    *   Inserting a test `user_alert`.
    *   **Critically: Immediately reverting the DB trigger** to the secure Vault-calling version.
2.  **Resolve Vault/Secure Key Access for Trigger:**
    *   Investigate Supabase documentation and community resources regarding Vault availability and setup on the free tier.
    *   If Vault is confirmed unusable/problematic on the free tier, research and implement an alternative secure method for the trigger to authenticate its call to the Edge Function (e.g., pre-shared secret used to sign a JWT, though this adds complexity).
    *   Contact Supabase support regarding the Vault schema issue, mentioning the free tier.
3.  **EAS Build Configuration:** Address the `eas build` warning: `Project config: Slug for project identified by "extra.eas.projectId" (bolt-expo-nativewind) does not match the "slug" field (sunurekolt)`.
4.  **Comprehensive Testing:** Test push notifications thoroughly (app in foreground, background, killed).

