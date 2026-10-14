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
- **Buyer dashboard** — Separate buyer workspace for browsing, order history, payment follow-up, and saved addresses; approved sellers can use it too

### 🔐 Authentication
- **Google OAuth** — One-click sign-in with Google account
- **Email and password** — Firebase email/password registration and sign-in with verification and password reset
- **Email link** — Optional Firebase passwordless sign-in
- **Role-Based Access** — Buyer, Seller, and Admin roles with protected routes

### 🏪 Seller Dashboard
- **Seller onboarding** — Seller application and admin approval/rejection with a reason
- **Product management** — Approved sellers create/edit listings, manage inventory, publish/unpublish, and delete their own products
- **Category Tags** — Assign products to 6 categories with icon selectors
- **Seller profile and fulfillment** — Manage store information and progress orders
- **Order value** — Gross order value is calculated from actual orders; no review/rating feature is currently offered

### ℹ️ Public information
- **About, contact, FAQ, and blog** — Marketplace information, buyer/seller guides, support configuration, and frequently asked questions
- **Privacy and terms** — Product-specific draft policies that must be reviewed by the operator before launch

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
- Node.js 22.18+ (Firebase Admin SDK requirement; production start uses Node's built-in TypeScript support)
- A Firebase project with Firestore & Authentication enabled
- An optional Google Gemini API key to enable the assistant

### 1. Clone the repository
```bash
git clone https://github.com/Bilaal-Ahmed/Halal-Bazaar.git
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
GEMINI_API_KEY="your_server_only_gemini_api_key"
FIREBASE_PROJECT_ID="your-existing-firebase-project-id"
FIRESTORE_DATABASE_ID=""
GOOGLE_APPLICATION_CREDENTIALS="C:/secure/path/to/firebase-admin-service-account.json"
ADMIN_EMAILS="ba341914@gmail.com"
ORDER_CURRENCY="USD"
ORDER_TAX_RATE="0.05"
VITE_ORDER_CURRENCY="USD"
# Optional public support contact shown on the Contact and footer pages.
VITE_SUPPORT_EMAIL="support@example.com"
# BANK_TRANSFER_INSTRUCTIONS="Bank/account details for manual transfer"
```

`FIRESTORE_DATABASE_ID` may be left empty; the server then reads the existing database ID from `firebase-applet-config.json`. Use a server-only Google Application Default Credential or a service account stored outside the repository. Never prefix Admin SDK settings with `VITE_`, put service-account JSON in the client config, or commit credentials. `ADMIN_EMAILS` is checked by Express after Firebase ID-token verification; it is server-only and defaults to the original verified administrator account above. `VITE_ADMIN_EMAILS` is not an authorization control and is not used.

Manual bank transfer is disabled until `BANK_TRANSFER_INSTRUCTIONS` is set on the server; those instructions are shown to buyers, and transfers remain pending until an administrator reviews them. JazzCash and Easypaisa are deliberately unavailable until you have the official merchant integration specifications, credentials, callback configuration, and a verified signature-validation implementation. No real gateway payment is currently processed. Firebase Storage is not configured; product/store images must use externally hosted image URLs. `GEMINI_API_KEY` is read only by the server and chat requests are rate-limited through `/api/chat`; never prefix it with `VITE_`. `VITE_SUPPORT_EMAIL` is public and optional; configure a monitored address before launch.

To add another administrator, configure the verified account email in server-only `ADMIN_EMAILS` and provision that user's Firestore profile with `role: "admin"` using a trusted Firebase Admin SDK process. Do not use a browser environment variable or client write to grant the role.

The `firebase-applet-config.json` Firebase web app settings (including Firebase's web API key) are public client configuration, not Admin credentials. Firebase Authentication's authorized domains are managed in the Firebase Console and cannot be verified from this repository; add only the actual application hostnames there. `FIRESTORE_DATABASE_ID` must identify the named database configured in `firebase.json`. The server now fails closed if neither the environment nor the web app config identifies a database; it does not silently fall back to `(default)`.

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

For rules tests, use the Firebase Emulator Suite and a disposable `demo-*` project ID, never the configured production project. The Firebase CLI, Java runtime, and rules test packages are not included in this repository. On Windows, install a supported Java runtime and the local CLI/test packages:
```bash
winget install --id EclipseAdoptium.Temurin.21.JDK -e
npm install --save-dev firebase-tools @firebase/rules-unit-testing vitest
npx firebase emulators:exec --project demo-halal-bazaar --only firestore "npx vitest run firestore.rules.test.ts"
```
The `firestore.rules.test.ts` test file must be authored to cover the buyer, seller, admin, privacy, escalation, ownership, order, and payment cases. For a staging project, create the named Firestore database with the exact ID in `firebase.json`, then use `firebase deploy --only firestore:rules --project=STAGING_PROJECT_ID`; this does not target the configured production project. These tests and deployment have not been run as part of this audit.

### 7. Run the development server

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

The API needs server-side Firebase Admin credentials to perform checkout and administrative operations. If credentials are unavailable, privileged endpoints fail closed; browse-only client functionality can still load.

### Production deployment architecture

This repository's Express server is a long-running Node process (`app.listen`) that serves built frontend assets in production and mounts Vite middleware only in development; it is not packaged as a Vercel serverless function. A Vercel deployment therefore serves the Vite frontend only unless an Express service is deployed separately. For the split deployment, deploy the Express API as a Node service such as Cloud Run, set the frontend build variable `VITE_API_BASE_URL` to that service's HTTPS origin, and set the backend's `CORS_ORIGINS` to the exact frontend origin (for example, `https://halal-bazaar.vercel.app`, without a trailing slash). This routes browser API calls, including seller applications, to Express while Firebase ID tokens continue to be sent as bearer authorization. Do not set `CORS_ORIGINS` to `*`. Set `VITE_API_BASE_URL` in Vercel's production environment and rebuild/redeploy the frontend; set `CORS_ORIGINS` in the API service and redeploy it. Alternatively, serve the built frontend and API from the same Express deployment and leave both variables unset. Build the frontend with development dependencies installed, then run the API with production dependencies and `npm start` on Node.js 22.18 or newer. Do not set `TRUST_PROXY=true` unless the API is behind exactly one trusted reverse proxy. The current process-local rate limiter is bounded and opportunistically cleans expired entries, but it is not shared across instances; use a distributed rate-limit store for production scaling.

#### Connecting Vercel to the Express API

1. Deploy `server.ts` as a long-running Node.js 22.18+ service and configure its Firebase Admin identity, `FIREBASE_PROJECT_ID`, and `FIRESTORE_DATABASE_ID` as described below. The service must be reachable over HTTPS.
2. Set the API service's `CORS_ORIGINS` to the exact deployed frontend origin, such as `https://halal-bazaar.vercel.app`. Do not include a path or trailing slash.
3. In the Vercel project's **Production** environment, set the public build-time variable `VITE_API_BASE_URL` to the API service's HTTPS origin only (for example, `https://your-api-service.example.com`; no `/api` suffix). Trigger a new deployment so Vite embeds the value in the frontend bundle.
4. Confirm `https://<api-service-origin>/api/health` returns `{"status":"ok"}` and submit a seller application from the deployed site. The API returns `201` with `{"status":"pending"}`; administrator approval remains a separate authenticated operation.

Without step 1, Vercel has no Express API to receive these calls and `/api/...` requests return 404. Do not treat a successful Vite build as evidence the API was deployed.

#### Disposable Cloud Run staging

The root [Dockerfile](./Dockerfile) builds the Vite frontend with development dependencies, then creates a production image containing only production Node dependencies, the Express server, and the built assets. Use a separate Firebase staging project and create the disposable Firestore database with the same database ID configured in `firebase.json`; the distinct project isolates its data. Register that project's web app, enable only the needed Auth providers, deploy the rules to staging, and add the staging Cloud Run hostname to Firebase Auth's authorized domains. Never use the checked-in production Firebase project for staging.

The Firebase web settings are public build-time values. Supply staging values as `VITE_FIREBASE_*`/`VITE_FIRESTORE_DATABASE_ID` build args; unset values fall back to `firebase-applet-config.json`, so explicitly pass the staging project and database settings. Example (replace every placeholder; use a staging-only project and database):
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=STAGING_PROJECT_ID
gcloud artifacts repositories create halal-bazaar --repository-format=docker --location=REGION --project=STAGING_PROJECT_ID
gcloud auth configure-docker REGION-docker.pkg.dev
docker build \
  --build-arg VITE_FIREBASE_API_KEY=STAGING_WEB_API_KEY \
  --build-arg VITE_FIREBASE_APP_ID=STAGING_WEB_APP_ID \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=STAGING_AUTH_DOMAIN \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=STAGING_SENDER_ID \
  --build-arg VITE_FIREBASE_PROJECT_ID=STAGING_PROJECT_ID \
  --build-arg VITE_FIRESTORE_DATABASE_ID=STAGING_DATABASE_ID \
  -t REGION-docker.pkg.dev/STAGING_PROJECT_ID/halal-bazaar/web:staging .
docker push REGION-docker.pkg.dev/STAGING_PROJECT_ID/halal-bazaar/web:staging
gcloud run deploy halal-bazaar-staging \
  --image=REGION-docker.pkg.dev/STAGING_PROJECT_ID/halal-bazaar/web:staging \
  --project=STAGING_PROJECT_ID --region=REGION \
  --service-account=STAGING_RUNTIME_SERVICE_ACCOUNT \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,FIREBASE_PROJECT_ID=STAGING_PROJECT_ID,FIRESTORE_DATABASE_ID=STAGING_DATABASE_ID,ORDER_CURRENCY=USD,ORDER_TAX_RATE=0.05
```

Grant the dedicated runtime identity only the Firestore access needed for the staging database and Firebase Auth user lookup/revocation checks; do not upload a service-account key. Add optional `GEMINI_API_KEY` through Secret Manager using Cloud Run's `--set-secrets` option. Keep `BANK_TRANSFER_INSTRUCTIONS` unset unless a staging-only payment-review test is required. Smoke-test health, sign-in, buyer/seller flows, and rules against staging; never import production data. The Dockerfile/commands prepare staging but have not been deployed or run here.

Server environment variables actually read by the application:

| Variable | Purpose | Required/notes |
|---|---|---|
| `PORT` | Express listen port | Optional; defaults to `3000` |
| `NODE_ENV` | Enables production static serving instead of Vite middleware | Set to `production` on backend deployment |
| `FIREBASE_PROJECT_ID` or `GCLOUD_PROJECT` | Firebase Admin project selection | Configure to the same project as the web app |
| `FIRESTORE_DATABASE_ID` | Admin SDK named Firestore database | Strongly recommended explicitly; must match `firebase.json` |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC service-account file path | Optional credential mechanism; prefer platform workload identity |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server-side service-account JSON | Alternative only; store as a secret, never as a Vercel frontend variable |
| `ADMIN_EMAILS` | Comma-separated verified admin-email allowlist for additional admins | Optional; the retained legacy admin is always included and cannot be removed by this variable |
| `ORDER_CURRENCY` | Server order currency | Optional; defaults to `USD`; match frontend display currency |
| `ORDER_TAX_RATE` | Server tax fraction, from 0 through 1 | Optional; defaults to `0.05` |
| `BANK_TRANSFER_INSTRUCTIONS` | Enables manual transfer checkout and displays instructions | Optional; only set with real operator instructions |
| `GEMINI_API_KEY` | Enables the server-side chat proxy | Optional; server only |
| `TRUST_PROXY` | Trust exactly one upstream proxy when deriving client IP | Optional; leave unset unless topology is verified |
| `CORS_ORIGINS` | Comma-separated exact frontend origins permitted for browser API requests | Required for split-origin frontend/API deployments; omit when same-origin |
| `DISABLE_HMR` | Vite dev-server HMR control | Development-only; not needed by production API |

Frontend-public build configuration: `VITE_API_BASE_URL` is the HTTPS origin of the separately deployed Express API; leave it unset for same-origin hosting. `VITE_ORDER_CURRENCY` controls display formatting and must match the server; `VITE_SUPPORT_EMAIL` is an optional public contact address. `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, and `VITE_FIRESTORE_DATABASE_ID` optionally override the checked-in public Firebase web configuration for staging builds. All `VITE_*` values are public and become part of the frontend; never put Admin credentials, Gemini keys, or payment credentials in them. `VITE_ORDER_TAX_RATE` is not used; tax is returned by the server checkout configuration.

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
npm start        # Start the production Express API/static server (Node.js 22.18+)
npm run preview  # Preview production build
npm run lint     # TypeScript type checking
```

---

## 🔒 Security

- Firebase ID tokens are verified by Firebase Admin SDK for protected API endpoints.
- Server operations enforce active-account, verified-email, approved-seller, and administrator checks.
- Browser configuration and all `VITE_*` variables are public; never use them for secrets or authorization.
- Gemini assistant requests are proxied through a rate-limited Express endpoint; the API key remains server-side.
- Firestore rules prevent client-side role promotion, payment-success writes, order forgery, and access to another buyer's private profile/orders.
- Order prices, tax, and stock are recalculated/reserved transactionally from Firestore by the server.
- Seller application decisions and payment/user moderation writes create audit records.
- Service-account credential files and `.env` files are excluded from version control.
- JazzCash/Easypaisa do not accept or process payment callbacks yet. No provider-specific request format or signature scheme is assumed without official merchant documentation and credentials.

## 🧪 Manual smoke tests

Run `npm run lint` and `npm run build` first, then use two browser accounts (buyer and seller) plus the configured administrator. A seller account should also visit `/dashboard` and use buyer functions to verify the roles do not exclude one another:

1. Create a buyer account with email/password, confirm the verification email, sign in, edit the profile, add an address, and request a password reset.
2. As a buyer, submit a seller application. Confirm the dashboard remains unavailable and application status is pending.
3. As the administrator, open Admin Console, reject the application with a reason, confirm that status/reason appear to the buyer, then approve a new/re-submitted application.
4. As the approved seller, save store details, create and edit a listing, adjust inventory, hide/publish it, and delete an owned listing. Confirm buyers cannot see hidden listings.
5. As a verified buyer, add a currently published item to cart and place a COD order. Confirm the server-created order amount and remaining stock; try submitting a forged price or marking the order paid directly in Firestore and confirm the rules reject it.
6. As the seller, process and ship the order, then confirm the buyer sees fulfillment updates in order history/details.
7. Place a manual bank-transfer order with a reference. Confirm it remains pending review until admin approves/rejects it; an unverified buyer cannot submit an order.
8. Suspend the buyer from Admin Console and confirm new checkout/API operations are denied; reactivate to restore access.
9. Call `/api/payments/jazzcash/initiate` or `/api/payments/easypaisa/initiate` for an order and confirm the API responds unavailable until an official provider integration is configured. No payment should show as paid from a client-side request.
10. Visit `/about`, `/blog`, `/contact`, `/faq`, `/privacy`, and `/terms`; configure and verify the support email and obtain legal review of the draft policies before public launch.

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
  <a href="https://github.com/Bilaal-Ahmed">GitHub @Bilaal-Ahmed</a>
</div>

---

<div align="center">
  Made with ❤️ for the Muslim community worldwide
  <br/>
  <sub>Halal-Bazaar © 2026 — All rights reserved</sub>
</div>
