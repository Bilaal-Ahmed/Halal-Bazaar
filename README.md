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

> **Pakistan's #1 Halal Multi-Vendor E-Commerce Platform** — Connecting conscious shoppers with verified halal sellers. Built with React 19, Firebase, TypeScript, and an AI-powered chatbot.

---

## ✨ Features

### 🛍️ Shopping Experience
- **Premium Homepage** — Animated hero, stats strip, category grid, featured products, testimonials, newsletter
- **Product Catalog** — Advanced filtering (category, price range, search), multiple sort options
- **Smart Cart System** — Persistent cart with localStorage, quantity controls, real-time total calculation
- **Sample Products** — 6 beautifully curated sample products with Unsplash photography
- **Halal Certification Badge** — Every certified product is clearly marked

### 🔐 Authentication
- **Google OAuth** — One-click sign-in with Google account
- **Email OTP (Passwordless)** — Firebase Email Link authentication — enter your Gmail, click the magic link, signed in!
- **Role-Based Access** — Buyer, Seller, and Admin roles with protected routes

### 🏪 Seller Dashboard
- **Product Management** — Add, view, and remove product listings in real-time
- **Category Tags** — Assign products to 6 categories with icon selectors
- **Halal Certification Toggle** — Mark products as halal-certified
- **Live Sales Stats** — Track product count, revenue estimates, and ratings

### 🛡️ Admin Panel
- **User Management** — View all registered users with stats overview
- **Role Promotion** — Promote users to seller/admin via dropdown
- **Approval Workflow** — Approve or reject user accounts with one click
- **Filter Tabs** — Filter users by role (all/buyer/seller/admin)

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
│   ├── components/
│   │   ├── AuthModal.tsx       # Google + Email OTP login modal
│   │   ├── ChatBot.tsx         # AI-powered Gemini chatbot
│   │   ├── ErrorBoundary.tsx   # Global error handler
│   │   ├── Footer.tsx          # Dark premium footer
│   │   ├── Navbar.tsx          # Sticky nav with cart badge & mobile menu
│   │   └── ProductCard.tsx     # Enhanced product card with halal badge
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Firebase auth + Email OTP context
│   │   └── CartContext.tsx     # Cart state with localStorage persistence
│   ├── lib/
│   │   └── gemini.ts           # Google Gemini AI integration
│   ├── pages/
│   │   ├── Home.tsx            # Full landing page with 7 sections
│   │   ├── Products.tsx        # Product catalog with filters
│   │   ├── Cart.tsx            # Shopping cart with order summary
│   │   ├── SellerDashboard.tsx # Seller product management
│   │   └── AdminPanel.tsx      # Admin user management
│   ├── App.tsx                 # Root app with all routes & providers
│   ├── firebase.ts             # Firebase initialization
│   ├── index.css               # Design system (Tailwind v4 + custom)
│   ├── main.tsx                # React entry point
│   └── types.ts                # TypeScript types + sample data
├── components/ui/              # shadcn/ui base-nova components
├── lib/utils.ts                # cn() utility helper
├── server.ts                   # Express server with Vite middleware
├── firebase-applet-config.json # Firebase project config
├── firebase-blueprint.json     # Firestore security rules blueprint
├── firestore.rules             # Firestore security rules
├── vite.config.ts              # Vite configuration
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
```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

### 4. Configure Firebase

Edit `firebase-applet-config.json` with your Firebase project credentials:
```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

### 5. Enable Firebase Services

In [Firebase Console](https://console.firebase.google.com/):
1. **Authentication** → Sign-in methods → Enable:
   - ✅ Google
   - ✅ Email/Password → Email link (passwordless sign-in)
2. **Firestore Database** → Create database in production mode
3. **Authorized Domains** → Add `localhost`

### 6. Run the development server
```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 🔑 Email OTP Login

Halal-Bazaar supports passwordless sign-in via Gmail:

1. Click **Sign In** in the navbar
2. Select **"Sign in with Email OTP"**
3. Enter your Gmail address
4. Firebase sends a magic link to your inbox
5. Click the link — you're signed in automatically!

> **Note:** Firebase must have Email Link authentication enabled AND your domain must be in the authorized domains list.

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

- Firestore rules restrict read/write based on user authentication
- Email link tokens expire after 10 minutes
- Role-based access: Admin and Seller pages are protected
- All Firebase credentials excluded from version control via `.gitignore`

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
