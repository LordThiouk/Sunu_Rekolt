# Active Context: Sunu Rekolt

**Date:** 2024-05-26

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

