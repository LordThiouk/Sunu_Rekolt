# Tech Context: Sunu Rekolt

## 1. Frontend

*   **Framework:** React Native (via Expo SDK 50+)
*   **Language:** TypeScript
*   **Routing:** Expo Router (File-based)
*   **State Management:** React Context API (potentially Zustand/Jotai later)
*   **UI Components:** Custom components, potentially `react-native-paper` helpers.
*   **Styling:** `StyleSheet.create` / `styled-components`
*   **Forms:** `react-hook-form`, `zod` for validation
*   **Linting/Formatting:** ESLint, Prettier

## 2. Backend

*   **Platform:** Supabase (Cloud Hosted)
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth (JWT, phone/password, OTP)
*   **API:** Supabase Auto-generated REST API (PostgREST)
*   **Serverless Functions:** Supabase Edge Functions (Deno, TypeScript)
*   **Storage:** Supabase Storage (S3 compatible)

## 3. Integrations

*   **SMS:** Twilio API (called from Supabase Edge Function)
*   **Payments:** PayDunya API (called from Supabase Edge Function)
*   **Push Notifications:** `expo-notifications` (future integration with FCM/APNS)

## 4. Infrastructure & DevOps

*   **Version Control:** Git / GitHub
*   **Hosting:** Supabase (Backend), Vercel/Netlify (potential Web App), App Stores (Mobile)
*   **CI/CD:** GitHub Actions (Lint, Test, Build)
*   **Database Migrations:** Supabase CLI

## 5. Development Environment

*   **IDE:** VS Code with Cursor extension
*   **Package Manager:** npm or yarn
*   **Emulator/Simulator:** Android Studio Emulator / iOS Simulator (via Xcode)
*   **Mobile Client:** Expo Go app for development testing

## 6. Key Libraries/Tools

*   `@supabase/supabase-js`: Client library for interacting with Supabase.
*   `react-native-phone-number-input`: For secure phone number entry.
*   `expo-image`: Optimized image handling.
*   `react-native-svg`: For SVG support.

## 7. Constraints & Considerations

*   **Offline Capability:** Limited in MVP, planned for future phases (requires local storage like SQLite/AsyncStorage).
*   **Network Conditions:** Potential for poor connectivity in target regions requires robust error handling and potentially offline-first strategies later.
*   **Scalability:** Supabase provides auto-scaling, but Edge Function performance/limits need monitoring.
*   **Security:** RLS is critical and must be thoroughly implemented and tested. 