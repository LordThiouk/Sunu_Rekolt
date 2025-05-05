# System Patterns: Sunu Rekolt

## 1. Overall Architecture

*   **Mobile-First:** React Native (Expo SDK 53) application for iOS and Android.
*   **Backend-as-a-Service (BaaS):** Supabase handles Auth, Database (PostgreSQL), Storage, and Edge Functions.
*   **Serverless:** Relies on Supabase infrastructure and Edge Functions for backend logic (e.g., notifications, payments, refunds).
*   **Event-Driven:** Database triggers and Edge Functions respond to events (e.g., new order -> SMS notification).

## 2. Frontend Patterns (React Native / Expo)

*   **Routing:** Expo Router with directory-based routing (`app/(auth)`, `app/(tabs)`).
*   **State Management:** React Context API for global state (`AuthContext`, `CartContext`). Includes manual context update pattern (`updateUser` in `AuthContext`) for profile changes.
*   **Component Structure:** Reusable UI components in `components/` (e.g., `ProductCard`, `Button`).
*   **UI Styling:** `StyleSheet.create` with theme constants (`constants/Colors.ts`).
*   **Icons:** Uses `@expo/vector-icons` (specifically Feather) for UI iconography (migrated from `lucide-react-native`).
*   **Forms:** `react-hook-form` for form state management and validation, `zod` for schema validation.
*   **Image Handling:** `expo-image` for display, `expo-image-picker` for selection, `base64-arraybuffer` for upload preparation.
*   **Asynchronous Operations:** `async/await` with error handling (e.g., Supabase calls, image uploads).
*   **Type Safety:** TypeScript used throughout the codebase.

## 3. Backend Patterns (Supabase)

*   **Authentication:** Phone/Password + OTP (Twilio integration planned), managed by Supabase Auth.
*   **Authorization:** Row Level Security (RLS) policies enforce data access based on user roles (`farmer`, `buyer`, `admin`) and context (e.g., phone visibility post-order).
*   **Data Modeling:** Relational database (PostgreSQL) with tables like `profiles`, `products`, `orders`, `order_items`, `refunds`.
*   **API Access:** Direct calls to Supabase REST API (auto-generated) and custom RPC functions (`get_order_details_for_farmer`) from the frontend client (`@supabase/supabase-js`).
*   **Storage:** User uploads (avatar, field pictures) stored in Supabase Storage buckets (`user-uploads`) with RLS policies for access control.
*   **Edge Functions:** Planned for server-side logic requiring secrets (Twilio SMS, PayDunya payments/refunds).
*   **Database Functions/Triggers:** Used for data consistency (`updated_at` timestamps), potentially for future logic (e.g., calculating reliability scores).

## 4. Development & Build Process

*   **Package Management:** `npm` used, with `--legacy-peer-deps` flag required for SDK 53 upgrade.
*   **Build Configuration:** Custom `metro.config.js` to disable package exports.
*   **Type Checking:** `typescript` compiler (`tsc`).
*   **Linting:** ESLint.
*   **Version Control:** Git / GitHub.

## 5. Key Data Flow Patterns

*   **Product Lifecycle:** Farmer creates (`pending`) -> Admin reviews (`approved`/`rejected`) -> Buyer views (`approved`).
*   **Order Lifecycle:** Buyer initiates -> Pays (PayDunya) -> `paid` -> Farmer notified (SMS) -> Farmer marks `delivering` -> Buyer confirms `received` -> (Future: Payout triggered).
*   **Phone Number Access:** RLS policies strictly control access to `profiles.phone`. Only visible between buyer/farmer *after* an order is placed/confirmed.
*   **Refunds:** Initiated by buyer/admin -> Recorded in `refunds` table -> Processed by `process_refund` Edge Function (calls PayDunya API) - Planned.
*   **Profile Update:** User edits via `EditProfileScreen` -> Images uploaded to Storage -> Text/URLs saved to `profiles` table -> `AuthContext` state updated manually via `updateUser`.

## 6. Security Patterns

*   RLS is the primary mechanism for data access control.
*   API keys (Twilio, PayDunya) stored securely as Supabase Edge Function secrets, never exposed client-side.
*   Input validation on client (Zod) and server (DB constraints, Edge Function logic).
*   HTTPS enforced for all communication.
*   Supabase Storage access controlled via RLS policies (needs verification, especially for uploads). 