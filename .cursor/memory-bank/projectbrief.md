# Project Brief: Sunu Rekolt

## 1. Core Goal

Develop a mobile application (React Native + Supabase) connecting Senegalese farmers and buyers for agricultural products. Aims to reduce post-harvest loss, improve market access, and increase transparency.

## 2. Target Users

*   **Farmers:** List products, manage orders, track reliability.
*   **Buyers:** Browse catalogue, order products, pay via mobile money, confirm receipt.
*   **Admin:** Validate products, manage users, oversee platform health via a separate web interface.

## 3. Key Features (MVP v1.0)

*   Phone number authentication (OTP via Twilio).
*   Role-based access (Farmer, Buyer, Admin).
*   Product listing (Farmer) & Admin validation.
*   Order placement & history (Buyer).
*   Mobile money payment integration (PayDunya).
*   Post-order phone number visibility between buyer/farmer (securely managed via RLS).
*   SMS notifications for farmers on new orders.
*   Farmer dashboard (orders, reliability score).
*   Read-only agricultural inputs catalogue.
*   Admin back-office for validation, stats, refunds.

## 4. Out-of-Scope (MVP v1.0)

*   Micro-credit features.
*   Farmer cooperatives/groupings.
*   Automated payouts to farmers (manual confirmation first).
*   Third-party delivery integration.
*   Multi-language support (French only for MVP).

## 5. Core Principles

*   Mobile-first, simple UX.
*   Reliability and trust mechanisms (scoring).
*   Direct communication facilitated post-order (phone).
*   Secure transactions and data handling. 