# Active Context - Sunu Rekolt

## Recently Achieved Goal
Significant enhancements to product management, including a fully functional "Edit Product" screen with a working image upload solution for Expo Go, and the implementation of "Archive/Unlist" and advanced filtering features on the "Mes Produits" screen. Farmer Dashboard live data integration was previously completed.

## Current Goal
With core product management (Add, Edit, Delete, Archive, Filter) for farmers largely complete and functional in Expo Go, the next focus can be on other key areas such as farmer order management, buyer-side features (cart, checkout), or administrative functionalities like product approval.

## Recent Changes & Discoveries

*   **Product Management Overhaul (Completed):**
    *   **"Edit Product" Screen (`app/product/edit/[id].tsx`):**
        *   Successfully implemented screen to fetch existing product data, pre-fill form, and update details.
        *   **Image Upload Fix for Expo Go:** Resolved the 0-byte image upload issue by modifying `uploadImage` function. The new method uses `FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })` to get a base64 string, then `decode(base64)` (from `base64-arraybuffer`) to create an `ArrayBuffer`. This `ArrayBuffer` is successfully uploaded via `supabase.storage.from('product-images').upload()`. This is now the confirmed working method for image uploads from Expo Go in this screen.
    *   **"Mes Produits" Screen Enhancements (`app/(tabs)/my-products.tsx`):**
        *   **Archive/Unlist Functionality:**
            *   `is_archived` boolean field added to `products` table via migration `20250512234143_add_is_archived_to_products.sql`.
            *   Frontend types (`Product`, `FarmerProduct`) updated.
            *   Implemented `handleToggleArchive` function to update product's `is_archived` status in Supabase and refresh UI.
            *   UI updated with archive/unarchive icons (eye/eye-off) and visual styling (dimming) for archived items.
        *   **Status-Based Filtering:**
            *   Implemented robust client-side filtering for products: "Tous" (shows non-archived), "En attente", "Approuvés".
            *   Added a dedicated "Archivés" filter to view only archived products.
        *   **Edit Product Navigation:** Button navigates to `app/product/edit/[id].tsx`.
        *   **Delete Product:** Functionality with confirmation and image deletion from storage is in place.

*   **Product Image Upload Functionality Restored & Verified (for Add Product and Edit Product).**
*   **Farmer Dashboard Live Data Integration (Previously Completed):**
    *   `app/(tabs)/farmer-dashboard.tsx` updated to fetch reliability score, new orders count, and sales data.
    *   RPC function `get_farmer_sales_summary` created and working.
    *   `ActivityDashboard` component functional and integrated.
*   **Clarification of `ActivityDashboard` Data & Labels (Previously Completed).**
*   **Resolution of `lucide-react-native` Import Error (Previously Completed).**
*   **`.env` File Issues Resolved (Previously Completed).**
*   **Push Notification Work (On Hold - Previously Noted):**
    *   Database Migration for Initial Push Notification Trigger Applied (functionality on hold).
    *   Edge Function Code Created for Push Notifications (functionality on hold).
    *   Push Notification Backend Configuration Challenges & Deferral (Vault unavailability on free tier).
*   **Docker Confirmed Running (Previously Noted).**


## Next Immediate Steps
1.  **Prioritize Next Feature Block:** Decide whether to focus on:
    *   Farmer Order Management (`app/(tabs)/farmer-orders.tsx`).
    *   Buyer-side features (e.g., Cart, Checkout).
    *   Admin panel (e.g., Product Approval workflow).
2.  Perform thorough testing of the new product management features (Edit, Archive, Filters).
3.  Address any minor UI/UX refinements for the product management screens.

## Open Questions/Decisions
*   Strategy for addressing local Deno linting issues in VS Code for Edge Functions.
*   Push notification architecture for server-side triggers (revisit with Vault on Supabase paid plan).
*   iOS build strategy (Catalina/Xcode 12.4 limitations - currently parked).

## Build & Environment Notes
*   **Expo Go Image Upload Solution:** For `app/product/edit/[id].tsx`, the `fetch(uri).blob()` method for image uploads was unreliable in Expo Go (resulting in 0-byte files). Switching to `FileSystem.readAsStringAsync` (to get base64) -> `decode` (to get ArrayBuffer) -> Supabase upload fixed this for Expo Go. This pattern should be considered for other image uploads if similar issues arise in Expo Go.
*   **iOS Build Issues (Parked):**
    *   Encountered `plutil` error during EAS Build, likely due to using an old Xcode version (12.4) on macOS Catalina. Modern Expo SDKs/EAS Build expect newer Xcode.
    *   Previous EAS builds for iOS simulator also failed due to the app requiring a newer iOS version (e.g., 15.1) than what the Catalina-compatible Xcode 12.4 simulators provide (e.g., 14.4).

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

