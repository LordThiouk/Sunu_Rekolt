# Tech Context: Sunu Rekolt

## 1. Frontend

*   **Framework:** React Native (via Expo SDK 53)
*   **Language:** TypeScript
*   **Routing:** Expo Router (File-based)
*   **State Management:** React Context API (`AuthContext`, `CartContext`).
*   **UI Components:** Custom components, `@expo/vector-icons` (replacing `lucide-react-native`).
*   **Styling:** `StyleSheet.create`. Theme in `constants/Colors.ts`.
*   **Forms:** `react-hook-form`, `zod` for validation.
*   **Linting/Formatting:** ESLint, Prettier.
*   **Type Declarations:** Custom `.d.ts` files (e.g., `image.d.ts`) for asset imports.

## 2. Backend

*   **Platform:** Supabase (Cloud Hosted)
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth (JWT, phone/password, OTP)
*   **API:** Supabase Auto-generated REST API (PostgREST), Custom RPC functions.
*   **Serverless Functions:** Supabase Edge Functions (Deno, TypeScript) - Planned.
*   **Storage:** Supabase Storage (S3 compatible) - Used for user avatars, field pictures.

## 3. Integrations

*   **SMS:** Twilio API (Planned - via Edge Function).
*   **Payments:** PayDunya API (Planned - via Edge Function).
*   **Push Notifications:** `expo-notifications` (Future integration).

## 4. Infrastructure & DevOps

*   **Version Control:** Git / GitHub
*   **Hosting:** Supabase (Backend), App Stores (Mobile)
*   **CI/CD:** GitHub Actions (Planned/Basic Setup).
*   **Database Migrations:** Supabase CLI (`supabase/migrations/`).
*   **Metro Config:** Custom `metro.config.js` used to disable package exports.

## 5. Development Environment

*   **IDE:** VS Code with Cursor extension
*   **Package Manager:** npm (`npm install --legacy-peer-deps` used for SDK 53 upgrade).
*   **Emulator/Simulator:** Android Studio Emulator / iOS Simulator.
*   **Mobile Client:** Expo Go app (Note: Version mismatch warning observed).

## 6. Key Libraries/Tools

*   `@supabase/supabase-js`: Supabase client.
*   `@expo/vector-icons`: Icon library.
*   `expo-image`: Optimized image handling.
*   `expo-image-picker`: Image selection from device (Note: Deprecation warning).
*   `base64-arraybuffer`: Image upload prep.
*   `react-native-url-polyfill`: Supabase JS compatibility.

## 7. Constraints & Considerations

*   **Offline Capability:** Limited in MVP.
*   **Network Conditions:** Requires robust error handling (`Network request failed` observed).
*   **Dependency Conflicts:** SDK 53 upgrade required `--legacy-peer-deps` due to React 19 / RN 0.79 incompatibilities (e.g., `react-native-web`). Potential runtime instability.
*   **Scalability:** Monitor Supabase usage.
*   **Security:** RLS critical; Storage policies need verification.

### Local Development 