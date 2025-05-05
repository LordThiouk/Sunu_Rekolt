# Active Context: Sunu Rekolt

**Date:** 2024-05-05

## 1. Current Focus

*   **Icon Refactoring:** Replacing `lucide-react-native` icons with `@expo/vector-icons` across the project. Started with `app/(tabs)/_layout.tsx`.
*   **Post-Refactor:** Address runtime warnings/errors (Text, Network, Expo Go version).
*   **Next Feature:** Awaiting user decision after refactoring and error fixing.
*   **Investigating Runtime Warnings/Errors:** Prioritizing fixes for:
    *   `Warning: Text strings must be rendered within a <Text> component`
    *   `Image Upload Error: Network request failed`
    *   Potentially revisiting dependency conflicts.
*   **Next Feature:** Awaiting user decision (Order History, PayDunya, Add Product, Farmer 
Dashboard) after addressing critical issues.

## 2. Recent Changes

*   **Dependencies:** Upgraded project to Expo SDK 53 / RN 0.79 / React 19 using `--legacy-peer-deps`.
*   **Dependencies:** Uninstalled `lucide-react-native`.
*   **Metro Config:** Created `metro.config.js` to disable `package.json` exports resolution (workaround).
*   **Icons:** Replaced Lucide icons with Feather icons in `app/(tabs)/_layout.tsx`.
*   **Profile Screen (`app/(tabs)/profile.tsx`):** UI updated to show Role, Location, Bio, Field Pic.
*   **Edit Profile Screen (`app/(tabs)/edit-profile.tsx`):** Context update logic implemented.
*   **AuthContext (`context/AuthContext.tsx`):** `updateUser` function added.
*   **Types (`image.d.ts`):** Added for image imports.

## 3. Next Steps

1.  **Continue Icon Refactoring:** Go through the list of files identified by `grep` and replace Lucide icons.
2.  **Address Text Warning:** Investigate and attempt fix for `Text strings must be rendered...` warning.
3.  **Address Network Error:** Investigate image upload failure.
4.  **Update Expo Go:** Ensure the correct version is installed on the test device/emulator.
5.  **Address Image Picker Deprecation:** Update usage (Lower priority).
6.  **Remove Debug Log:** Remove `console.log(user)` from `profile.tsx`.
7.  **Implement Next Feature:** Based on user choice.

## 4. Open Questions / Decisions

*   Best strategy to eventually resolve core dependency conflicts (avoid `--legacy-peer-deps`)?
*   Exact PayDunya integration flow.
*   Cause of "activity stats" error in `ActivityDashboard`.
*   Cause of `TouchableOpacity` `ReferenceError` on Order Confirmation screen.

## 5. Blockers

*   **Dependency State:** Risk of runtime instability due to `--legacy-peer-deps` installation.
*   **Image Upload Network Error:** Prevents saving profile/field pictures.
*   **Text Warning:** Might indicate subtle rendering issues.
*   (Need to refactor remaining icons before app will build successfully).

