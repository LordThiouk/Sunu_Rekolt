# Active Context: Sunu Rekolt

**Date:** 2024-07-28

## 1. Current Focus

*   **Phase 2/4:** Implementing Order History & Status Updates:
    *   Order History screen (buyer/farmer views).
    *   Order status update logic (Mark Delivered / Confirm Reception).

## 2. Recent Changes

*   Completed **Phase 1.**
*   **Dependencies:** Resolved.
*   **Components:** `ProductCard.tsx` refined.
*   **Catalogue/Detail:** Verified fetch works, joins successful, RLS resolved.
*   **Context:** `AuthContext.tsx`, `CartContext.tsx` reviewed/verified.
*   **Auth Screens:** Login & Register screens reviewed/verified.
*   **Cart Implementation:** Reviewed.
*   **RLS:** Resolved profile read issue.
*   **Checkout Flow:** Added address fields to Payment screen and order creation.
*   **Order Confirmation:** Screen implemented, fetches/displays order details, address, and farmer phone. Tested successfully.

## 3. Next Steps

*   **Implement Order History Screen:** Fetch and display user-specific orders (buyer/farmer perspective).
*   **Implement Status Updates:** Add UI and logic for order status changes.
*   **Implement Payment Integration:** Replace simulated payment.
*   Address remaining features (Farmer Dashboard, Add Product, Profile).

## 4. Open Questions / Decisions

*   Confirm UI library preference.
*   Finalize API service layer structure.
*   Exact PayDunya integration flow.
*   Source of "activity stats" error.

## 5. Blockers

*   Persistent project-level TypeScript/JSX configuration errors (Linter noise).

### Current Work Focus

- **Task:** Project setup for version control (Git/GitHub).
- **Status:** 
    - Order status update functionality implemented and tested (placeholder for refund).
    - Display of separated order lists confirmed.
    - JSON parsing error resolved.
- **Next Steps:** 
    1. Initialize Git repository.
    2. Stage and commit current project files.
    3. Guide user to create GitHub repo and provide URL.
    4. Add remote origin.
    5. Push initial commit to GitHub.

### Recent Changes

- Implemented `handleUpdateOrderStatus` function and connected it to `OrderCard`.
- Added conditional rendering logic for action buttons in `OrderCard`.
- Added placeholder "Demander remboursement" button.
- Refactored `ProfileScreen` state/fetch for separated orders.
- Applied all necessary migrations for order status logic.

### Active Decisions & Considerations

- Need to address persistent JSX/TypeScript linter errors later.
- Need to investigate `TouchableOpacity` `ReferenceError` later.
- GitHub repository URL is needed from the user to push the code. 