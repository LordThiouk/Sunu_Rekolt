# Progress: Sunu Rekolt

**Date:** 2024-07-28

## 1. What Works / Completed

*   **Project Setup:** Initial project structure.
*   **Documentation & Memory Bank:** Reviewed & Initialized/Updated.
*   **Phase 1 (Initial Setup):** Completed.
*   **Dependencies:** Resolved & Installed.
*   **Components:** `ProductCard.tsx` refined.
*   **Context:** `AuthContext.tsx`, `CartContext.tsx` structure verified.
*   **Catalogue:** Fetches products, displays using `ProductCard` (incl. farmer names).
*   **Product Detail:** Fetches details, displays correctly, 'Add to Cart' functional.
*   **RLS:** Policy issue resolved for profile joins and phone visibility.
*   **Auth Screens:** Login & Register screens reviewed/verified.
*   **Cart:** Context, Screen, and Add-to-Cart logic reviewed/verified.
*   **Checkout:** Address fields added to `orders` table and Payment Screen.
*   **Order Confirmation:** Screen implemented and tested (shows details, address, farmer phone).

## 2. What's In Progress

*   **Phase 2/4 (Frontend/Backend):**
    *   Implementing Order History screen (buyer/farmer views).
    *   Implementing Order Status update logic/UI.

## 3. What's Left to Build (High-Level MVP Goals)

*   **Frontend Development (Phase 2/4 cont.):**
    *   Implement Payment Screen & Flow (PayDunya Integration).
    *   Implement Farmer Dashboard.
    *   Implement Add Product Screen.
    *   Implement Profile Screen.
*   **Backend Integration & Logic (Phase 3+):**
    *   Implement RLS for phone number visibility post-order (Farmer reading Buyer).
    *   Develop/Deploy Supabase Edge Functions (SMS w/ buyer phone, Order status triggers?).
    *   Admin validation workflow.
    *   Agricultural inputs view.
*   **Testing & Deployment (Phase 8+):**

## 4. Known Issues / Blockers

*   Project-level TypeScript/JSX configuration errors (Linter noise).
*   Uninvestigated "activity stats" error.

### Completed

- Initial project setup verified.
- Supabase client configured (`lib/supabase.ts`).
- Expo Router navigation setup (`app/_layout.tsx`).
- `ProductCard` component updated (`components/ProductCard.tsx`), uses `expo-image`.
- Dependencies installed (`expo-image`, `expo-router`, etc.).
- `AuthContext` reviewed (`context/AuthContext.tsx`), handles auth state and profile creation.
- Catalogue Screen (`app/(tabs)/index.tsx`) displays products with farmer names.
- RLS policy allows authenticated reads on `profiles` if linked via `products`.
- Product Detail Screen (`app/(tabs)/catalog/[id].tsx`) displays product details and handles potential missing farmer name.
- Login/Register screens (`app/(auth)/...`) reviewed and functional.
- Cart implementation (`context/CartContext.tsx`, `app/(tabs)/cart.tsx`, Add to Cart logic) reviewed and functional.
- Order Confirmation Screen (`app/(tabs)/order-confirmation.tsx`) implemented, displays order details, delivery address, and farmer phone number.
- RLS policy allows buyers to see farmer phone number post-order.
- Delivery address collection added to Payment Screen (`app/(tabs)/payment.tsx`).
- `orders` table updated with `delivery_address` and `delivery_details`.
- Order status enum includes `pending`, `paid`, `delivering`, `delivered`, `received`, `cancelled`.
- RLS policies allow buyers to update `delivered` -> `received`.
- RLS policies allow farmers (associated with an item) to update `paid` -> `delivering` and `delivering` -> `delivered`.

### What's Left to Build

- **Order History / Status Updates (Profile Screen):** Implemented. (Placeholder for refund).
- **Farmer Dashboard (`components/ActivityDashboard.tsx`):** Implement logic to show relevant stats (sales, new orders, score).
- **Product Management (Farmer):** Allow editing/deleting own products.
- **Admin Panel:** Features like product approval, user management, stats view.
- **Notifications:** Implement SMS notifications to farmers on new orders via Edge Function.
- **Reliability Score:** Implement calculation logic.
- **Boutique Intrants:** Currently read-only, future purchase logic needed.
- **Refunds:** Implement `process_refund` Edge function and UI linkage for the "Demander remboursement" button.

### Current Status

- Core user flow (Signup -> Login -> Catalog -> Product Detail -> Cart -> Checkout -> Order Confirmation) is functional.
- Profile screen (`app/(tabs)/profile.tsx`) correctly fetches and displays separated order lists (Received/Placed) for farmers.
- Order status update buttons (Mark Delivering/Delivered, Confirm Reception) are functional.
- Placeholder button "Demander remboursement" is displayed for buyers on relevant orders.
- JSON parsing error related to `items` column seems resolved.
- RLS policies are in place for basic product visibility, profile reading, post-order phone visibility, and order status updates.
- Migrations for order status enum values and update policies are complete.
- **Next:** User choice: Add Product screen, Farmer Dashboard, Order Details screen, or fix Linter/TouchableOpacity issues.

### Known Issues

- Linter errors present in several files (JSX flag, types). Need investigation and potentially `tsconfig.json` adjustments.
- `TouchableOpacity` `ReferenceError` on Order Confirmation screen needs further investigation (possibly bundler/platform specific).
- Docker connectivity issue prevented `supabase db reset` locally.

Order status enum includes `pending`, `paid`, `delivering`, `delivered`, `received`, `cancelled`.
RLS policies allow buyers to update `delivered` -> `received`.
RLS policies allow farmers (associated with an item) to update `paid` -> `delivering` and `delivering` -> `delivered`. 