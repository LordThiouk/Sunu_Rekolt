# Project Progress: Sunu Rekolt

## What Works

1. **Authentication & Authorization**
   - Basic authentication with phone & password ✅
   - User role selection (farmer, buyer) during registration ✅
   - Role-based redirects after login (Farmer to Dashboard, Buyer to Catalogue) ✅
   - Different UX flows based on user role (e.g., farmer-specific tabs) ✅

2. **Database**
   - Basic schema with `profiles`, `products`, `orders`, `order_items` ✅
   - `is_archived` column added to `products` table (migration `20250512234143_add_is_archived_to_products.sql`). ✅
   - RLS policies for basic data security ✅
   - Database triggers for `updated_at` timestamps ✅
   - Refunds table for payment processing ✅
   - Reviews table for farmer feedback ✅
   - User alerts table for notifications ✅
   - Triggers for automatic notification creation ✅

3. **UI & Navigation**
   - Welcome/login/register screens ✅
   - Tab-based navigation with role-specific tabs (Farmer: Dashboard, Produits, Catalogue, Profil; Buyer: Catalogue, Panier, Commandes, Profil) ✅
   - Farmer Dashboard (`app/(tabs)/farmer-dashboard.tsx`) UI now connected to live data (Reliability Score, New Orders, Sales via RPC, Activity via ActivityDashboard component) ✅
   - "Mes Produits" screen (`app/(tabs)/my-products.tsx`):
      *   View products ✅
      *   Navigate to Add Product screen ✅
      *   Navigate to Edit Product screen ✅
      *   Delete products (with image removal) ✅
      *   Archive/Unlist products ✅
      *   Filter products by status (All non-archived, Pending, Approved, Archived) ✅
   - "Edit Product" screen (`app/product/edit/[id].tsx`):
      *   Fetch and display existing product data ✅
      *   Edit product details ✅
      *   Edit product image (upload working in Expo Go via base64/ArrayBuffer) ✅
   - Consistent header with app name, logo, and notification bell ✅
   - Basic profile viewing and editing ✅
   - Basic form validation ✅
   - Product cards in catalog ✅

4. **Backend Services**
   - Supabase authentication ✅
   - Database migrations via Supabase CLI ✅
   - Custom RPC function for order details ✅
   - Function for calculating reliability scores ✅
   - Supabase Storage for product images (`product-images` bucket) with RLS allowing farmer-specific uploads/management and public reads ✅
   - Image upload for new products (`app/(tabs)/product/add.tsx`) working. ✅
   - Image upload for editing products (`app/product/edit/[id].tsx`) working via base64/ArrayBuffer in Expo Go. ✅
   - RPC function `get_farmer_sales_summary` for Farmer Dashboard sales metrics ✅

## In Progress

1. **Frontend**
   - Farmer Dashboard: Live data integration complete. Minor UI tweaks or additional metrics if needed. ✅
   - Farmer Sections: Develop "Mes Produits" (`my-products.tsx`) and "Commandes" (`farmer-orders.tsx`) screens 🔄
   - Notification list screen 🔄
   - Review submission flow 🔄
   - Reliability score display 🔄
   - Cart functionality 🔄
   - Checkout process 🔄
   - Order status management UI 🔄

2. **Backend**
   - Edge function for SMS notifications (Twilio) 🔄
   - Payment integration (PayDunya) 🔄
   - Implement RLS for new tables (reviews, user_alerts) 🔄
   - Process refund functions 🔄
   - Testing notification triggers 🔄

3. **Feature Development**
   - Product CRUD process: Add, View, Edit, Delete, Archive/Unlist are largely complete and functional. Image uploads for add/edit working. **Admin approval flow for new/edited products is the main remaining aspect.** 🔄
   - Order lifecycle management 🔄
   - Admin panel (general, beyond product approval) 🔄
   - SMS notifications system 🔄

1. **Complete Farmer Dashboard & Core Loop**
   - Connect Farmer Dashboard metrics to live data.
   - Implement "Ajouter un produit" flow for farmers.
   - Develop "Mes Produits" and "Commandes" screens for farmers.

2. **Complete Notification System**
   - Implement notification list screen

## Not Started

1. **Features**
   - Push notifications (Backend server-side trigger implementation on hold pending Supabase paid plan for Vault) 🟡
   - Reporting tools for admins ❌
   - Analytics dashboard ❌
   - Offline functionality ❌
   - Intégration boutique d'intrants (read-only in MVP) ❌
   - Admin management interface ❌

2. **Performance & Infrastructure**
   - Image compression & optimization ❌
   - Full test suite ❌
   - CI/CD pipeline ❌
   - App Store / Play Store submission ❌

## Known Issues

1. **Technical Debt**
   - Some TypeScript type inconsistencies between database nulls and frontend undefined values
   - Need to standardize styling approach (mix of StyleSheet and inline styles)
   - Form validation needs improvement
   - Error handling needs standardization
   - Loading states not consistently implemented

2. **UX Issues**
   - Limited error feedback to users
   - No loading indicators in some places
   - Missing confirmation dialogs for critical actions
   - Limited accessibility features

3. **Backend Concerns**
   - Need to implement more comprehensive RLS policies for new tables
   - Need to test notification triggers thoroughly 
   - Edge function deployment and testing needed

## Next Milestone: Core Features

Complete the following to reach the next project milestone:

1. **Complete Notification System**
   - Implement notification list screen
   - Add unread count indicator
   - Test notification triggers with sample data
   - Connect to real order events

2. **Implement Review System**
   - Create review submission form
   - Display past reviews
   - Show reliability score on farmer profiles
   - Test automatic score calculation

3. **Finalize Order Lifecycle**
   - Complete order status tracking
   - Implement status change notifications
   - Add payment integration

This milestone represents the core marketplace functionality to enable farmers and buyers to effectively use the platform.

## Bug Fixes & Improvements

### Recent Fixes (May 2025)

1. **Payment Flow RLS Error** (FIXED)
   - Issue: Payment processing was failing with error `new row violates row-level security policy for table "user_alerts"`
   - Fix: Created proper RLS policies for the `user_alerts` table via migration
   - Migration file: `20250508184309_fix_user_alerts_rls.sql`
   - Status: ✅ Fixed and deployed

2. **Product Image Upload "Bucket Not Found" Error** (FIXED)
   - Issue: Adding a new product failed with "Bucket not found" when trying to upload the product image.
   - Fix: 
     - Created a new dedicated Supabase Storage bucket named `product-images`.
     - Updated `app/(tabs)/product/add.tsx` to use this bucket and to structure image paths as `products/<FARMER_ID>/<FILENAME>`.
     - Implemented RLS policies for the `product-images` bucket via migration `20250510232515_create_rls_for_product_images_bucket.sql` to allow public reads and farmer-specific management of their images.
   - Status: ✅ Fixed and deployed

3. **Product Image Upload (0-byte file) in Edit Screen with Expo Go** (FIXED)
   - Issue: Editing a product and uploading a new image via Expo Go resulted in a 0-byte file in Supabase Storage, despite client logs showing success with `Blob` upload.
   - Fix: Modified `uploadImage` function in `app/product/edit/[id].tsx` to use `FileSystem.readAsStringAsync` (to get base64) and then `decode` (from `base64-arraybuffer`) to create an `ArrayBuffer`. This `ArrayBuffer` is then uploaded to Supabase Storage, which resolved the issue in Expo Go.
   - Status: ✅ Fixed

## Progress - Push Notifications Feature

**Overall Status: On Hold / Partially Implemented**

**What Works:**
*   **Client Push Token Registration:** App successfully registers for Expo push notifications, and the token is saved to the `profiles` table.
*   **Database Setup:** `user_alerts` table created.
*   **Initial DB Trigger:** `on_new_user_alert_send_push_row` trigger and `trigger_send_push_notification_for_row` function created (migration `20250509131604_create_trigger_send_push_notification.sql`).
*   **Edge Function Stub:** `send-expo-push-notification` Edge Function code exists.
*   **FCM Server Key:** The FCM Server Key has been configured in EAS credentials.
*   **Foreground Notification Handling:** App's notification handler processes notifications when the app is in the foreground.

**What's Left to Build/Fix (On Hold):**
1.  **Secure Service Role Key Access for DB Trigger (Production Viability):**
    *   **Decision:** This will be addressed by implementing **Supabase Vault** once the project is on a Supabase paid plan. Vault will be used to securely store and provide the necessary credentials (e.g., Service Role Key or a specific API key for the Edge Function) to the PL/pgSQL trigger.
    *   The current trigger function (`trigger_send_push_notification_for_row`) and the Edge Function (`send-expo-push-notification`) will need to be updated to integrate with Vault.
2.  **Edge Function Deployment & Configuration:** Final deployment and configuration of the `send-expo-push-notification` Edge Function once Vault integration is ready.
3.  **End-to-End Push Notification Delivery Test:** Full testing once the backend is securely configured.
4.  **EAS Build Configuration:** Fix the `slug` vs `extra.eas.projectId` mismatch warning.
5.  **Refinement & Testing:** Test background/killed states, ensure robust error handling.

**Current Status & Blocker:**
*   Client-side setup for receiving push notifications is largely in place.
*   Backend implementation for server-triggered push notifications (DB trigger -> Edge Function) is **ON HOLD**.
*   **Primary Blocker:** Securely providing credentials from the database trigger to the Edge Function. Supabase Vault (unavailable on free tier) is the planned solution. Attempts to use GUCs or a pre-shared key workaround faced limitations with user permissions on the free tier.

**Known Issues (Related to Push Notifications):**
*   **Supabase Vault Unavailability on Free Tier:** Prevents the currently preferred method for secure secret management for the DB trigger.
*   **EAS Build Warning:** `Project config: Slug for project identified by "extra.eas.projectId" (bolt-expo-nativewind) does not match the "slug" field (sunurekolt)`. 