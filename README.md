# 🌙 Halal-Bazaar

<div align="center">
  <img src="https://img.shields.io/badge/Developed%20by-Bilal%20Ahmed-brightgreen?style=for-the-badge" alt="Developer" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<br/>

> **Halal-Bazaar** — A multi-vendor marketplace for buyers and seller-submitted halal product listings. Built with React 19, Firebase, TypeScript, and an AI-powered chatbot.

---

## ✨ Features

### 🛍️ Shopping Experience
- **Product Catalog** — Search, category and price filters, sorting, published listings, and product details
- **Cart and Checkout** — localStorage cart, server-validated pricing/stock, idempotent order creation, COD, and configured manual bank transfer
- **Listing claims** — Sellers may mark listings as halal certified; this application does not independently verify certificates
- **Order tracking** — Buyer order history/details and seller fulfillment status updates

### 🔐 Authentication
- **Google OAuth** — One-click sign-in with Google account
- **Email and password** — Firebase email/password registration and sign-in with verification and password reset
- **Email link** — Optional Firebase passwordless sign-in
- **Role-Based Access** — Buyer, Seller, and Admin roles with protected routes

### 🏪 Seller Dashboard
- **Seller onboarding** — Seller application and admin approval/rejection with a reason
- **Product management** — Approved sellers manage published listings and inventory
- **Category Tags** — Assign products to 6 categories with icon selectors
- **Seller profile and fulfillment** — Manage store information and progress orders
- **Order value** — Gross order value is calculated from actual orders; no review/rating feature is currently offered

### 🛡️ Admin Panel
- **User Management** — View all registered users with stats overview
- **Seller application review** — Approve/reject requests, requiring a rejection reason
- **Moderation** — Suspend/reactivate users, publish/unpublish listings, and review bank-transfer payments
- **Audit trail** — Sensitive admin changes are recorded server-side

### 🤖 AI ChatBot
- **Gemini-Powered** — Built with Google Gemini AI
- **Context-Aware** — Acts as a halal shopping assistant
- **Floating UI** — Elegant slide-in chat window with message history

---

## 🚀 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6.2 | Build tool & dev server |
| Tailwind CSS | v4 | Utility-first styling |
| Firebase | 12 | Auth, Firestore DB |
| shadcn/ui (base-nova) | — | UI component library |
| @base-ui/react | 1.3 | Accessible base components |
| Motion (Framer) | 12 | Animations |
| React Router | 7 | Client-side routing |
| Sonner | 2 | Toast notifications |
| Google Gemini AI | 1.x | AI chatbot |
| Express | 4 | Dev/prod server |
| Zod | 4 | Schema validation |

---

## 📂 Project Structure

```
Halal-Bazaar/
├── src/
│   ├── components/              # Shared UI, auth, navigation, product cards
│   ├── contexts/                # Firebase auth and cart state
│   ├── lib/                     # API client, currency, Firebase and utilities
│   ├── pages/                   # Buyer, seller and administrator screens
│   ├── App.tsx                  # Routes and providers
│   └── types.ts                 # Marketplace data types
├── components/ui/               # Shared UI primitives
├── server.ts                    # Express API and Vite middleware
├── firebase.json                # Rules deployment configuration
├── firestore.rules              # Client Firestore access policy
└── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 20+
- A Firebase project with Firestore & Authentication enabled
- A Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/Ahmiii281/Halal-Bazaar.git
cd Halal-Bazaar/Halal-Bazaar
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`; macOS/Linux: `cp .env.example .env`).

Edit `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
FIREBASE_PROJECT_ID="your-existing-firebase-project-id"
FIRESTORE_DATABASE_ID=""
GOOGLE_APPLICATION_CREDENTIALS="C:/secure/path/to/firebase-admin-service-account.json"
ADMIN_EMAILS="ba341914@gmail.com"
ORDER_CURRENCY="USD"
ORDER_TAX_RATE="0.05"
VITE_ORDER_CURRENCY="USD"
# BANK_TRANSFER_INSTRUCTIONS="Bank/account details for manual transfer"
```

`FIRESTORE_DATABASE_ID` may be left empty; the server then reads the existing database ID from `firebase-applet-config.json`. Use a server-only Google Application Default Credential or a service account stored outside the repository. Never prefix Admin SDK settings with `VITE_`, put service-account JSON in the client config, or commit credentials. `ADMIN_EMAILS` is checked by Express after Firebase ID-token verification; it is server-only and defaults to the original verified administrator account above. `VITE_ADMIN_EMAILS` is not an authorization control and is not used.

Manual bank transfer is disabled until `BANK_TRANSFER_INSTRUCTIONS` is set on the server; those instructions are shown to buyers, and transfers remain pending until an administrator reviews them. JazzCash and Easypaisa are deliberately unavailable until you have the official merchant integration specifications, credentials, callback configuration, and a verified signature-validation implementation. No real gateway payment is currently processed. Firebase Storage is not configured; product/store images must use externally hosted image URLs.

To add another administrator, configure the verified account email in server-only `ADMIN_EMAILS` and provision that user's Firestore profile with `role: "admin"` using a trusted Firebase Admin SDK process. Do not use a browser environment variable or client write to grant the role.

### 4. Configure Firebase

Keep the checked-in `firebase-applet-config.json` pointed at the existing Firebase project and named Firestore database. Do not replace its project or database with the `(default)` database. The client config identifies a Firebase app and is public; access control is provided by the rules below, and privileged operations use the Admin SDK on the server. Keep `ORDER_CURRENCY` and `VITE_ORDER_CURRENCY` equal to the currency used by the catalog.

### 5. Enable Firebase Services

In [Firebase Console](https://console.firebase.google.com/):
1. **Authentication** → Sign-in methods → Enable:
   - Google
   - Email/Password
   - Email link only if you intend to use the optional passwordless sign-in
2. **Firestore Database** → Keep the currently configured database and its data
3. **Authorized Domains** → Add `localhost`

### 6. Deploy Firestore security rules

The rules deny direct client order creation/updates and prevent changes to user role, account status, and seller application status. Order creation, seller onboarding decisions, payment review, and admin operations run through authenticated API routes using Firebase Admin SDK.

Install/configure the Firebase CLI for the existing project and deploy only the rules:
```bash
firebase login
firebase use YOUR_EXISTING_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

Verify the selected project and database before deployment. The repository does not auto-deploy rules or mutate production data.

### 7. Run the development server

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

The API needs server-side Firebase Admin credentials to perform checkout and administrative operations. If credentials are unavailable, privileged endpoints fail closed; browse-only client functionality can still load.

---

## 🔑 Email Link Login

Halal-Bazaar supports optional passwordless sign-in via Firebase email link:

1. Click **Sign In** in the navbar
2. Select **"Sign in with Email Link"**
3. Enter your email address
4. Firebase sends a sign-in link to your inbox
5. Click the link — you're signed in automatically!

> **Note:** Firebase must have Email Link authentication enabled and your domain must be in the authorized domains list.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Primary | `hsl(142 71% 28%)` | Forest green buttons, badges, links |
| Accent | `hsl(38 95% 50%)` | Amber highlights, CTA contrast |
| Background | `hsl(0 0% 100%)` | Page background |
| Foreground | `hsl(222 47% 11%)` | Body text (dark navy) |
| Muted | `hsl(210 40% 96%)` | Subtle backgrounds |
| Border | `hsl(214 32% 91%)` | Card borders |

Custom CSS classes: `.hero-gradient`, `.halal-badge`, `.card-hover`, `.btn-primary-glow`, `.gradient-text`, `.section-badge`

---

## 📦 Available Scripts

```bash
npm run dev      # Start development server (Express + Vite)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # TypeScript type checking
```

---

## 🔒 Security

- Firebase ID tokens are verified by Firebase Admin SDK for protected API endpoints.
- Server operations enforce active-account, verified-email, approved-seller, and administrator checks.
- Browser configuration and all `VITE_*` variables are public; never use them for secrets or authorization.
- Firestore rules prevent client-side role promotion, payment-success writes, order forgery, and access to another buyer's private profile/orders.
- Order prices, tax, and stock are recalculated/reserved transactionally from Firestore by the server.
- Seller application decisions and payment/user moderation writes create audit records.
- Service-account credential files and `.env` files are excluded from version control.
- JazzCash/Easypaisa do not accept or process payment callbacks yet. No provider-specific request format or signature scheme is assumed without official merchant documentation and credentials.

## 🧪 Manual smoke tests

Run `npm run lint` and `npm run build` first, then use two browser accounts (buyer and seller) plus the configured administrator:

1. Create a buyer account with email/password, confirm the verification email, sign in, edit the profile, add an address, and request a password reset.
2. As a buyer, submit a seller application. Confirm the dashboard remains unavailable and application status is pending.
3. As the administrator, open Admin Console, reject the application with a reason, confirm that status/reason appear to the buyer, then approve a new/re-submitted application.
4. As the approved seller, save store details, create and edit a listing, adjust inventory, hide/publish it, and delete an owned listing. Confirm buyers cannot see hidden listings.
5. As a verified buyer, add a currently published item to cart and place a COD order. Confirm the server-created order amount and remaining stock; try submitting a forged price or marking the order paid directly in Firestore and confirm the rules reject it.
6. As the seller, process and ship the order, then confirm the buyer sees fulfillment updates in order history/details.
7. Place a manual bank-transfer order with a reference. Confirm it remains pending review until admin approves/rejects it; an unverified buyer cannot submit an order.
8. Suspend the buyer from Admin Console and confirm new checkout/API operations are denied; reactivate to restore access.
9. Call `/api/payments/jazzcash/initiate` or `/api/payments/easypaisa/initiate` for an order and confirm the API responds unavailable until an official provider integration is configured. No payment should show as paid from a client-side request.

For rules validation, use the Firebase Emulator Suite or a non-production Firebase project before deploying to the existing production database. The smoke-test deployment assumes that the target project and the named Firestore database in `firebase.json` are the intended ones; verify both before running any deployment command.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Developer

<div align="center">
  <strong>Bilal Ahmed</strong><br/>
  Full-Stack Developer | Pakistan<br/>
  <a href="https://github.com/Ahmiii281">GitHub @Ahmiii281</a>
</div>

---

<div align="center">
  Made with ❤️ for the Muslim community worldwide
  <br/>
  <sub>Halal-Bazaar © 2026 — All rights reserved</sub>
</div>
