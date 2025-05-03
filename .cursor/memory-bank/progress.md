# Progress: Sunu Rekolt

**Date:** 2024-07-28

## 1. What Works / Completed

*   **Project Setup:** Initial project structure.
*   **Documentation & Memory Bank:** Reviewed & Updated.
*   **Phase 1 (Initial Setup):** Completed.
*   **Dependencies:** Resolved & Installed.
*   **Components:** `ProductCard.tsx` refined.
*   **Context:** `AuthContext.tsx`, `CartContext.tsx` structure verified.
*   **Catalogue:** Fetches products, displays using `ProductCard`.
*   **Product Detail:** Fetches details, 'Add to Cart' functional.
*   **Auth Screens:** Login & Register screens reviewed/verified.
*   **Cart:** Context, Screen, and Add-to-Cart logic reviewed/verified.
*   **Checkout:** Address fields added, order creation logic updated for `order_items`.
*   **Order Confirmation Screen (`app/(tabs)/order-confirmation.tsx`):** Implemented and tested (shows details, address, farmer phone).
*   **Profile Screen Orders (`app/(tabs)/profile.tsx`):** Fetches and displays separated Received/Placed orders, allows status updates, fixed date mapping.
*   **Farmer Order Detail Screen (`app/(tabs)/farmer-order-detail/[id].tsx`):** Implemented and tested. Loads correctly, displays buyer info, items, allows status updates.
*   **Backend/RLS:**
    *   `orders` and `order_items` tables structure finalized.
    *   RLS policies allow profile reads, phone visibility post-order, order status updates (buyer/farmer).
    *   `SECURITY DEFINER` SQL function (`get_order_details_for_farmer`) implemented to handle farmer order detail fetching without RLS recursion.
    *   Migrations applied for all schema changes, RLS policies, and SQL functions.

## 2. What's In Progress

*   **Profile Editing:** UI coded but not rendering.
*   **Dependency Resolution:** Actively trying to resolve `ERESOLVE` conflicts.
*   Implement Payment Screen & Flow (PayDunya Integration).
*   Implement Farmer Dashboard (`components/ActivityDashboard.tsx`).
*   Implement Add Product Screen (`app/(tabs)/product/add.tsx`).
*   **Profile Editing:**
    *   Verify UI renders correctly after dependency fix.
    *   Implement `AuthContext` update on save.
    *   Implement navigation back on save.
    *   Display avatar on main profile screen.
*   Refine Profile Screen UI/features.
*   **Peer Dependency Conflicts:** Major conflicts exist between navigation packages (`@react-navigation/bottom-tabs@^7.2.0` -> `7.3.11`) and `react-native@0.76.9`, and between installed `expo` related packages and expected SDK versions. **This is the primary blocker preventing UI updates from appearing.**
*   Project-level TypeScript/JSX configuration errors (Linter noise).
*   Uninvestigated "activity stats" error in `ActivityDashboard`.
*   **Profile Editing:** UI changes (image pickers, bio) coded but not rendering in the app, likely due to dependency conflicts.
*   **Storage Setup:** Bucket created, RLS policies applied via migration after repairing history.
*   **Dependencies:** Installed `expo-image-picker` and `base64-arraybuffer` using `npm install --force` due to peer dependency conflicts.
*   **Profile Editing:** Added `bio` field for farmers to `edit-profile.tsx`. Updated `User` type and `profiles` table schema (`avatarUrl`, `fieldPictureUrl`, `bio`). Implemented image selection/upload UI and logic.
*   **Next:** Resolve dependency conflicts, then test profile edit UI and functionality.

## 3. What's Left to Build (High-Level MVP Goals)

*   **Frontend Development:**
    *   Implement Payment Screen & Flow (PayDunya Integration).
    *   Implement Farmer Dashboard (`components/ActivityDashboard.tsx`).
    *   Implement Add Product Screen (`app/(tabs)/product/add.tsx`).
    *   Refine Profile Screen UI/features.
    *   Product Management (Farmer - Edit/Delete).
*   **Backend Integration & Logic:**
    *   Develop/Deploy Supabase Edge Functions (SMS w/ buyer phone, Reliability Score?).
    *   Admin validation workflow/panel.
    *   Agricultural inputs view logic (currently read-only).
    *   Refunds logic (`process_refund` Edge function, UI integration).
*   **Testing & Deployment.**

## 4. Known Issues / Blockers

*   Project-level TypeScript/JSX configuration errors (Linter noise).
*   Uninvestigated "activity stats" error in `ActivityDashboard`.
*   Uninvestigated `TouchableOpacity` `ReferenceError` on Order Confirmation screen.
*   Docker connectivity issue prevented `supabase db reset` locally.
*   **Peer Dependency Conflicts:** Navigation packages require `react-native@0.79.2` but project uses `0.76.9`. Installed `expo-image-picker` using `--force`, which might cause runtime issues.

---

### Detailed Progress Notes (Latest First)

- **Dependency Management:** Installed `expo-image-picker` using `npm install --force` to override peer dependency conflicts with React Navigation / React Native versions.
- **Profile Editing:** Added `bio` field for farmers to `edit-profile.tsx`. Updated `User` type and `profiles` table schema (`avatarUrl`, `fieldPictureUrl`, `bio`). Implemented basic save logic for name, location, farm size, bio.
- **Farmer Order Detail Screen:** Successfully debugged loading issues (`PGRST116`/`42P17`). Implemented `get_order_details_for_farmer` SQL function to bypass RLS recursion. Resolved persistent SyntaxError. Screen now functional.
- **Profile Screen Orders:** Fixed "Invalid Date" mapping for received orders. Confirmed status update logic works.
- **Database Schema:** Migrated from `orders.items` JSONb to separate `order_items` table.
- **Order Creation:** Updated checkout flow (`payment.tsx`) to insert into `order_items`.
- **RLS Policies:** Iteratively refined RLS for orders, order_items, profiles, and phone visibility. Added policies for status updates. Dropped recursive policy on `orders` in favor of SQL function.
- **Seed Data:** Added seed products for testing.
- **Order Card Click:** Implemented navigation from profile order cards to detail screens.
- Initial setup, component reviews, context verification, etc.

### Current Status

- Core user flow (Signup -> Login -> Catalog -> Cart -> Checkout -> Order Confirmation) is functional.
- Buyer can view placed orders and confirm reception.
- Farmer can view received/placed orders, view details of received orders, and update status (`paid` -> `delivering` -> `delivered`).
- Backend structure supports the core order flow.
- **Next:** User choice: Add Product, Farmer Dashboard, PayDunya integration, or investigate known issues. 