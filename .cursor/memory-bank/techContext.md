# Tech Context: Sunu Rekolt

## 1. Frontend

*   **Framework:** React Native (via Expo SDK 53)
*   **Language:** TypeScript
*   **Routing:** Expo Router (File-based)
*   **State Management:** React Context API (`AuthContext`, `CartContext`).
*   **UI Components:** Custom components, `@expo/vector-icons/Feather` (replaced `lucide-react-native`).
*   **Styling:** 
    *   Primary: `StyleSheet.create`. Theme in `constants/Colors.ts`.
    *   Secondary: TailwindCSS/NativeWind classes (experiencing issues with application)
*   **Typography:**
    *   `@expo-google-fonts/inter`: General text (Inter_400Regular, etc.)
    *   `@expo-google-fonts/baloo-bhai-2`: Branded elements (BalooBhai2_400Regular, etc.)
*   **Forms:** `react-hook-form`, `zod` for validation.
*   **Linting/Formatting:** ESLint, Prettier.
*   **Type Declarations:** Custom `.d.ts` files (e.g., `image.d.ts`) for asset imports.
*   **Image Handling:**
    *   `expo-image`: Display.
    *   `expo-image-picker`: Selection.
    *   `expo-file-system`: Read image file as base64.
    *   `base64-arraybuffer`: (Potentially used by Supabase client for upload).

## 2. Backend

*   **Platform:** Supabase (Cloud Hosted)
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth (JWT, phone/password, OTP)
*   **API:** Supabase Auto-generated REST API (PostgREST), Custom RPC functions.
*   **Serverless Functions:** Supabase Edge Functions (Deno, TypeScript) - Planned.
*   **Storage:** Supabase Storage (S3 compatible) is used with two main buckets:
    *   `user-uploads`: Stores user avatars and farm/field pictures.
    *   `product-images`: Stores images for agricultural products listed by farmers.
    Uploads are primarily done via base64 strings or blobs from the client. Both buckets are managed with RLS policies.

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
*   `expo-image-picker`: Image selection from device.
*   `expo-file-system`: File system access. Used for reading image files as base64, a key part of the fix for image uploads in Expo Go.
*   `base64-arraybuffer`: Library to convert base64 strings to ArrayBuffers, used in conjunction with `expo-file-system` for reliable image uploads from Expo Go.
*   `react-native-url-polyfill`: Supabase JS compatibility.
*   `@expo-google-fonts/baloo-bhai-2`: Custom typography for branding elements.
*   `@expo-google-fonts/inter`: Typography for general text.

## 7. Constraints & Considerations

*   **Offline Capability:** Limited in MVP.
*   **Network Conditions:** Requires robust error handling. Image upload network errors resolved.
*   **Dependency Conflicts:** SDK 53 upgrade required `--legacy-peer-deps` due to React 19 / RN 0.79 incompatibilities (e.g., `react-native-web`). Potential runtime instability.
*   **Scalability:** Monitor Supabase usage.
*   **Security:** RLS critical; Storage policies for `user-uploads` (profile images) and `product-images` (product listings) have been implemented and should be maintained.
*   **UI Reactivity:** Experiencing issues with immediate UI updates for images after context changes.
*   **TypeScript:** Type mismatches between DB (`null`) and frontend types (`undefined`) required workarounds (casting).
*   **Styling Inconsistency:** Mixed use of StyleSheet.create and TailwindCSS/NativeWind classes causing application issues. Potential need to standardize on one approach.

### Local Development 

## Backend Technologies

*   **Supabase Edge Functions:**
    *   Runtime: Deno
    *   Language: TypeScript
    *   Usage: For server-side logic like sending push notifications (`send-expo-push-notification`).
    *   Deployment: Via Supabase CLI (`supabase functions deploy`), requires Docker Desktop locally for bundling.
    *   Environment Variables/Secrets: Managed via `supabase secrets set` for deployed functions. Local development can use `.env` files in the function's directory or root `supabase` folder.
    *   Authentication: Can be protected by JWT (`verify_jwt = true` in `config.toml`).
*   **PostgreSQL (Supabase Database):**
    *   **Triggers and Functions:** `plpgsql` functions executed by database triggers (e.g., `AFTER INSERT ON user_alerts`).
    *   **`pg_net` Extension:** Used by `plpgsql` functions to make outbound HTTP requests (e.g., to call Edge Functions). Must be enabled in the Supabase project.
    *   **Configuration Variables (GUCs):** PostgreSQL server configuration variables (e.g., `app_settings.supabase_service_key`) can be set using `ALTER DATABASE postgres SET var_name = 'value';` and read by database functions using `current_setting('var_name', true)`. Used for storing secrets like the service role key for use by triggers.
*   **Supabase CLI:**
    *   Used for local development, database migrations (`supabase db push`), Edge Function deployment (`supabase functions deploy`), managing secrets (`supabase secrets set`), etc.
    *   Relies on a correctly formatted project root `.env` file for some configurations.
    *   Requires Docker Desktop for bundling and deploying Edge Functions locally.

## Frontend Technologies

*   **Expo Push Notifications:**
    *   Libraries: `expo-notifications`, `expo-device`, `@react-native-async-storage/async-storage`.
    *   Process: Request permissions, get Expo Push Token, send token to backend (stored in `profiles.expo_push_token`), handle foreground notifications, handle notification responses (taps for deep-linking).
*   **Supabase Realtime:**
    *   Used for live updates within the app, e.g., subscribing to `INSERT` events on the `user_alerts` table to update in-app notification lists and unread counts. Implemented in `NotificationContext.tsx`.

## Development Environment
*   **Docker Desktop:** Required for local Supabase Edge Function development and deployment via the CLI.
*   **VS Code with Deno Extension (`denoland.vscode-deno`):** Recommended for developing Edge Functions to get proper Deno type checking and language server features. May require workspace initialization for Deno support (`Deno: Initialize Workspace Configuration`). 