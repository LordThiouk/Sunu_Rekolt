# Product Context: Sunu Rekolt

## 1. Problem Solved

Sunu Rekolt addresses key challenges in the Senegalese agricultural market:

*   **Market Access:** Farmers struggle to connect directly with buyers, leading to reliance on intermediaries and lower prices.
*   **Post-Harvest Loss:** Lack of efficient sales channels contributes to significant food waste.
*   **Price Transparency:** Buyers lack visibility into fair market prices.
*   **Trust & Reliability:** Difficulty in verifying seller reliability and product quality.
*   **Payment Friction:** Cash-based transactions can be inconvenient and less secure.

## 2. User Goals

*   **Farmers:** Easily list products, reach a wider buyer base, manage orders efficiently, build reputation (reliability score), receive timely payments, access agricultural inputs information.
*   **Buyers:** Discover local products easily, compare prices, order securely, pay conveniently (mobile money), track orders, communicate directly with farmers post-order, confirm receipt.
*   **Admin:** Ensure platform integrity (product validation), monitor activity, manage disputes/refunds, maintain system health.

## 3. How It Should Work (User Experience)

*   **Simple Onboarding:** Quick registration via phone number and password.
*   **Intuitive Navigation:** Mobile-first design with clear tabs/sections (Dashboard/Catalogue, Orders, Profile, etc.).
*   **Direct Connection:** Facilitate direct communication (via phone call outside the app) between buyer and farmer *after* a confirmed order to streamline logistics/delivery.
*   **Trust Building:** Reliability scores visible to buyers.
*   **Seamless Payments:** Integrated mobile money (PayDunya) for checkout.
*   **Clear Order Tracking:** Status updates visible to both parties.
*   **Farmer Empowerment:** Dashboard provides insights into sales and orders.

## 4. Key Value Proposition

Sunu Rekolt aims to be the go-to digital marketplace for agriculture in Senegal, fostering direct trade, reducing waste, improving livelihoods through transparent, reliable, and convenient mobile commerce.

## Main Dashboard or Home Page

### Agriculteur

- Après connexion, l'agriculteur arrive sur un **tableau de bord (`app/(tabs)/farmer-dashboard.tsx`) simplifié** affichant (actuellement avec des placeholders) :

* Un résumé de ses ventes
* Le nombre de commandes reçues
* Son score de fiabilité
* Un bouton "Ajouter un produit"

- Un **menu inférieur à 4 onglets (`app/(tabs)/_layout.tsx`)** permet de naviguer vers :

* Tableau de bord
* Mes Produits (liste, ajout, statut)
* Catalogue (produits d'autres agriculteurs)
* Profil
* *Note: L'accès aux Commandes (livraison, détails) se fait via le Tableau de bord et non plus comme onglet direct.*

⚠️ **Remarque** : 

## User Personas and Flows

### Agriculteur (Farmer)

*   **Onboarding:** Signs up with phone number, selects "Agriculteur" role, sets password, verifies via SMS. Accepts CGU. Lands on personal dashboard.
*   **Dashboard (`app/(tabs)/farmer-dashboard.tsx`):** Post-login, sees a simplified dashboard with (currently placeholders for):
    *   Sales summary
    *   Number of orders received
    *   Reliability score
    *   "Ajouter un produit" button
*   **Navigation (`app/(tabs)/_layout.tsx`):** A bottom tab bar with 4 tabs:
    *   Tableau de bord (Dashboard)
    *   Mes Produits (My Products - for listing, adding, managing status)
    *   Catalogue (to see products from other farmers)
    *   Profil (Profile)
    *   *Note: Access to specific order details is planned to be via the Dashboard rather than a direct "Commandes" tab.*
*   **Product Management:** Adds products (name, type, photo, price, unit, quantity). Product status becomes `pending` for admin validation. Once approved, visible in the global catalogue.
*   **Order Management:** Accesses order list (New / In delivery / Delivered) likely via the dashboard. Can mark orders as "En livraison" then "Marquer comme livré". Receives SMS notification for new orders with buyer's phone number.
*   **Purchasing from Catalogue:** Can browse the main catalogue and purchase products from other farmers, following a similar flow to a buyer.
*   **Input Shop (Boutique d'intrants):** This is a secondary feature, possibly in "Profil" or a sub-section of the dashboard. Initially informational, not a priority for MVP transactions.

### Acheteur (Buyer)

*   **Onboarding:** Signs up with phone number, selects "Acheteur" role, sets password, verifies via SMS. Accepts CGU. Lands on personal dashboard.
*   **Dashboard:** Post-login, sees a dashboard with options to:
    *   Discover local products
    *   View order history
    *   Communicate with farmers
    *   Access profile settings
*   **Product Discovery:** Can browse products from various farmers and add them to a cart.
*   **Order Placement:** Completes the order process, including payment.
*   **Post-Purchase Experience:** Receives product, can leave a review and communicate with the farmer.

## 5. Admin Features

*   **Product Validation:** Approves or rejects new products.
*   **Activity Monitoring:** Views platform activity and user interactions.
*   **Dispute Resolution:** Manages and resolves disputes between farmers and buyers.
*   **System Health:** Monitors platform performance and user experience.

## 6. Future Directions

*   **Expand to Other Markets:** Potential expansion to other African countries.
*   **Add More Product Categories:** Expansion to include more agricultural products.
*   **Enhance User Experience:** Implementation of advanced search and filtering options.
*   **Integrate AI:** Use of AI for personalized product recommendations.

## 7. Conclusion

Sunu Rekolt is committed to revolutionizing the agricultural market in Senegal by providing a platform that fosters direct trade, reduces waste, and improves livelihoods through transparent, reliable, and convenient mobile commerce.
