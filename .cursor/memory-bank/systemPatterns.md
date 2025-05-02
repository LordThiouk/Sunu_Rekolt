# System Patterns: Sunu Rekolt

## 1. Overall Architecture

*   **Mobile-First:** React Native (Expo) application for iOS and Android.
*   **Backend-as-a-Service (BaaS):** Supabase handles Auth, Database (PostgreSQL), Storage, and Edge Functions.
*   **Serverless:** Relies on Supabase infrastructure and Edge Functions for backend logic (e.g., notifications, payments, refunds).
*   **Event-Driven:** Database triggers and Edge Functions respond to events (e.g., new order -> SMS notification).

## 2. Frontend Patterns (React Native / Expo)

*   **Routing:** Expo Router with directory-based routing (`app/(auth)`, `app/(tabs)`).
*   **State Management:** React Context API for global state (`AuthContext`, `CartContext`). Potential future migration to Zustand/Jotai if complexity increases.
*   **Component Structure:** Reusable UI components in `components/` (e.g., `ProductCard`, `Button`).
*   **Styling:** `StyleSheet.create` or potentially `styled-components`. Theme defined in `constants/Colors.ts`.
*   **Data Fetching:** Direct calls to Supabase client (`lib/supabase.ts`) from components or custom hooks. Consider creating dedicated API service layer (`lib/api/`).
*   **Form Handling:** `react-hook-form` with `zod` for validation.

## 3. Backend Patterns (Supabase)

*   **Authentication:** Supabase Auth with phone/password and OTP verification (Twilio integration).
*   **Authorization:** Role-Based Access Control (RBAC) implemented via PostgreSQL Row Level Security (RLS) policies based on user roles (`farmer`, `buyer`, `admin`).
*   **Database:** Relational schema in PostgreSQL. Key tables: `profiles`, `products`, `orders`, `order_items`, `payments`, `refunds`, `agricultural_inputs`, `notifications`.
*   **API:** Auto-generated REST API provided by Supabase based on database schema.
*   **Serverless Logic:** Supabase Edge Functions (Deno/TypeScript) for:
    *   Sending SMS notifications (via Twilio).
    *   Processing payments/refunds (via PayDunya).
    *   Calculating reliability scores (future).
*   **Storage:** Supabase Storage for user-uploaded images (e.g., product photos).
*   **Database Migrations:** Managed via Supabase CLI, stored in `supabase/migrations/`.

## 4. Key Data Flow Patterns

*   **Product Lifecycle:** Farmer creates (`pending`) -> Admin reviews (`approved`/`rejected`) -> Buyer views (`approved`).
*   **Order Lifecycle:** Buyer initiates -> Pays (PayDunya) -> `paid` -> Farmer notified (SMS) -> Farmer marks `delivering` -> Buyer confirms `received` -> (Future: Payout triggered).
*   **Phone Number Access:** RLS policies strictly control access to `profiles.phone`. Only visible between buyer/farmer *after* an order is placed/confirmed.
*   **Refunds:** Initiated by buyer/admin -> Recorded in `refunds` table -> Processed by `process_refund` Edge Function (calls PayDunya API).

## 5. Security Patterns

*   RLS is the primary mechanism for data access control.
*   API keys (Twilio, PayDunya) stored securely as Supabase Edge Function secrets, never exposed client-side.
*   Input validation on client (Zod) and server (DB constraints, Edge Function logic).
*   HTTPS enforced for all communication. 