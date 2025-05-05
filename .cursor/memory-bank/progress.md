# Progress: Sunu Rekolt

**Date:** 2024-05-05

## 1. What Works / Completed

*   **Project Setup & SDK:** Upgraded core dependencies to Expo SDK 53 / RN 0.79 / React 19 (using `--legacy-peer-deps`). `metro.config.js` added to disable package exports.
*   **Documentation & Memory Bank:** Reviewed & Updated.
*   **Phase 1 (Initial Setup):** Completed.
*   **Dependencies:** Uninstalled `lucide-react-native`.
*   **Icon Refactoring:** Replaced icons in `app/(tabs)/_layout.tsx` with `@expo/vector-icons`.
*   **Components:** `ProductCard.tsx` refined.
*   **Context:** `AuthContext.tsx`, `CartContext.tsx` structure verified. `AuthContext` updated with `updateUser` function.
*   **Catalogue:** Fetches products, displays using `ProductCard`.
*   **Product Detail:** Fetches details, 'Add to Cart' functional.
*   **Auth Screens:** Login & Register screens reviewed/verified.
*   **Cart:** Context, Screen, and Add-to-Cart logic reviewed/verified.
*   **Checkout:** Address fields added, order creation logic updated for `order_items`.
*   **Order Confirmation Screen (`app/(tabs)/order-confirmation.tsx`):** Implemented and tested (shows details, address, farmer phone).
*   **Profile Screen Orders (`app/(tabs)/profile.tsx`):** Fetches and displays separated Received/Placed orders, allows status updates, fixed date mapping. (Order lists later removed from main profile screen).
*   **Farmer Order Detail Screen (`app/(tabs)/farmer-order-detail/[id].tsx`):** Implemented and tested. Loads correctly, displays buyer info, items, allows status updates.
*   **Backend/RLS:**
    *   `orders` and `order_items` tables structure finalized.
    *   RLS policies allow profile reads, phone visibility post-order, order status updates (buyer/farmer).
    *   `SECURITY DEFINER` SQL function (`get_order_details_for_farmer`) implemented.
    *   Migrations applied for schema changes, RLS policies, SQL functions, added profile fields (`avatar_url`, `field_picture_url`, `bio`).
*   **Profile Screen UI (`app/(tabs)/profile.tsx`):** Redesigned, displays detailed info.
*   **Edit Profile Screen (`app/(tabs)/edit-profile.tsx`):** Image upload logic, context update implemented.
*   **AuthContext (`context/AuthContext.tsx`):** Added `updateUser` function.
*   **Type Declarations (`image.d.ts`):** Created for image imports.
*   **Core Order Flow:** Signup -> Login -> Catalog -> Cart -> Checkout -> Order Confirmation.
*   **Order Management (Separate Screens):** Buyer/Farmer can view/update orders on detail screens.

## 2. What's In Progress

*   **Icon Refactoring:** Replacing `lucide-react-native` icons with `@expo/vector-icons` in remaining files.
*   **Investigating Runtime Warnings/Errors:** Need to address Text warning, Network error, Image Picker deprecation.

## 3. What's Left to Build (High-Level MVP Goals)

*   **Frontend Development:**
    *   Complete Icon Refactoring.
    *   Implement Order History screen.
    *   Implement Payment Screen & Flow (PayDunya Integration).
    *   Implement Farmer Dashboard (`components/ActivityDashboard.tsx`).
    *   Implement Add Product Screen (`app/(tabs)/product/add.tsx`).
    *   Refine Profile Screen features (Notifications, Privacy links etc.).
    *   Product Management (Farmer - Edit/Delete).
*   **Backend Integration & Logic:**
    *   Develop/Deploy Supabase Edge Functions (SMS w/ buyer phone, Reliability Score?).
    *   Admin validation workflow/panel.
    *   Agricultural inputs view logic (currently read-only).
    *   Refunds logic (`process_refund` Edge function, UI integration).
*   **Testing & Deployment.**

## 4. Known Issues / Blockers

*   **Dependency State:** Dependencies installed using `--legacy-peer-deps` due to React 19 / RN 0.79 compatibility issues with libraries like `react-native-web`. Risk of runtime instability. **High Priority.**
*   **Runtime Warning:** `Warning: Text strings must be rendered within a <Text> component` persists, originating from `ActionRow` in `ProfileScreen`. Needs investigation.
*   **Image Upload Error:** Observed `Network request failed` error during field picture upload attempt in logs. Needs investigation (possible network issue, emulator config, or Supabase Storage RLS/setup issue).
*   **Expo Go Version:** Warning about mismatched Expo Go version (2.32.19 vs recommended 2.33.19 for SDK 53). Needs update on device/emulator.
*   **Image Picker Warning:** `[expo-image-picker] \`ImagePicker.MediaTypeOptions\` have been deprecated...` warning appears in logs. Low priority.
*   Uninvestigated "activity stats" error in `ActivityDashboard`.
*   Uninvestigated `TouchableOpacity` `ReferenceError` on Order Confirmation screen.

---

### Detailed Progress Notes (Latest First)

- **Icon Refactor:** Replaced icons in `app/(tabs)/_layout.tsx`.
- **Dependencies:** Upgraded project core deps to Expo SDK 53 / RN 0.79 / React 19. Uninstalled `lucide-react-native`. Required `--legacy-peer-deps` flag for install due to React 19 conflicts. Added `metro.config.js` to disable package exports.
- **Profile Update:** Added Bio display to `ProfileScreen`.
- **AuthContext:** Added `updateUser` function to allow manual state updates. Integrated call into `EditProfileScreen` save logic.
- **Edit Profile:** Changed placeholder image loading from `require` to `import` to try and fix resolution errors. Added `image.d.ts` and updated `tsconfig.json` to support image imports. Re-applied placeholder fix for `default-field.png`.
- **Profile UI:** Redesigned `ProfileScreen` based on user request (display Role, Location, Field Pic). Retained Action List and Sign Out.
- **Farmer Order Detail Screen:** Successfully debugged loading issues (`PGRST116`/`42P17`). Implemented `get_order_details_for_farmer` SQL function. Resolved SyntaxError. Screen functional.
- **Profile Screen Orders:** Fixed \"Invalid Date\" mapping for received orders. Confirmed status update logic works. (Order lists later removed from main profile UI).
- **Dependencies:** Used `npm install --force` to bypass peer dependency errors.
- **Database Schema:** Added `avatar_url`, `field_picture_url`, `bio` to `profiles` table. Migrated from `orders.items` JSONb to separate `order_items` table.
- **Order Creation:** Updated checkout flow (`payment.tsx`) to insert into `order_items`.
- **RLS Policies:** Iteratively refined RLS for orders, order_items, profiles, and phone visibility. Added policies for status updates. Dropped recursive policy on `orders` in favor of SQL function.
- **Seed Data:** Added seed products for testing.
- **Order Card Click:** Implemented navigation from profile order cards to detail screens.
- Initial setup, component reviews, context verification, etc.

### Current Status

- Core user flow (Signup -> Login -> Catalog -> Cart -> Checkout -> Order Confirmation) is functional.
- Buyer can view placed orders and confirm reception (via separate detail screen, not profile).
- Farmer can view received/placed orders, view details, update status (via separate detail screen, not profile).
- Profile Screen displays user info (inc. Role, Location, Bio, Field Pic if available) and allows navigation to Edit Profile.
- Edit Profile allows updating text fields, attempting image uploads, and updates app state on successful save.
- **Next:** Investigate warnings/errors (Text, Network, Dependencies) or proceed with next feature based on user choice. 