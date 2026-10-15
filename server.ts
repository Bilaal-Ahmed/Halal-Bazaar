import express from "express";
import type { NextFunction, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import dotenv from "dotenv";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { DocumentData, Transaction } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";
import {
  calculateTaxCents,
  getProductPrice,
  isCashOnDeliveryAllowed,
  marketCurrencyForCountry,
} from "./src/lib/currency.ts";
import {
  allocateSellerTaxCents,
  applySellerPaymentReview,
  assertSellerPaymentEntriesMatchSellers,
  createPendingSellerPayment,
  findEnabledPaymentAccount,
  isApprovedSellerProfile,
  PaymentValidationError,
  validateSellerPaymentAccounts,
  validateSellerPaymentEntries,
} from "./src/lib/sellerPayments.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const LEGACY_ADMIN_EMAIL = "ba341914@gmail.com";
const ADMIN_EMAILS = new Set(
  [LEGACY_ADMIN_EMAIL, ...(process.env.ADMIN_EMAILS || "").split(",")]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
function configuredTaxRate(value: string, variable: string) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`${variable} must be a number between 0 and 1.`);
  }
  return rate;
}
const PKR_TAX_RATE = configuredTaxRate(
  process.env.PKR_ORDER_TAX_RATE?.trim() || process.env.ORDER_TAX_RATE?.trim() || "0.05",
  process.env.PKR_ORDER_TAX_RATE?.trim() ? "PKR_ORDER_TAX_RATE" : "ORDER_TAX_RATE",
);
const USD_TAX_RATE = process.env.USD_ORDER_TAX_RATE?.trim()
  ? configuredTaxRate(process.env.USD_ORDER_TAX_RATE, "USD_ORDER_TAX_RATE")
  : null;
const legacyPriceCurrencyValue = process.env.LEGACY_PRODUCT_PRICE_CURRENCY?.trim().toUpperCase();
if (legacyPriceCurrencyValue && !["PKR", "USD"].includes(legacyPriceCurrencyValue)) {
  throw new Error("LEGACY_PRODUCT_PRICE_CURRENCY must be PKR or USD.");
}
const LEGACY_PRODUCT_PRICE_CURRENCY: "PKR" | "USD" | undefined =
  legacyPriceCurrencyValue === "PKR" || legacyPriceCurrencyValue === "USD"
    ? legacyPriceCurrencyValue
    : undefined;
const COD_ALLOWED_COUNTRIES = new Set(
  (process.env.COD_ALLOWED_COUNTRIES || "PK")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean),
);
if ([...COD_ALLOWED_COUNTRIES].some((country) => !/^[A-Z]{2}$/.test(country))) {
  throw new Error("COD_ALLOWED_COUNTRIES must contain comma-separated ISO 3166-1 alpha-2 codes.");
}
const DOMESTIC_BANK_TRANSFER_INSTRUCTIONS = process.env.DOMESTIC_BANK_TRANSFER_INSTRUCTIONS?.trim() || "";
const INTERNATIONAL_BANK_TRANSFER_INSTRUCTIONS = process.env.INTERNATIONAL_BANK_TRANSFER_INSTRUCTIONS?.trim() || "";
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const corsOrigins = new Set(
  (process.env.CORS_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
);
const requestCounts = new Map<string, { count: number; expiresAt: number }>();
const MAX_RATE_LIMIT_KEYS = 20_000;
let rateLimitRequestCount = 0;

interface AuthenticatedRequest extends Request {
  identity?: DecodedIdToken;
  account?: DocumentData;
}

interface OrderLineInput {
  productId: string;
  quantity: number;
}

function normalizeShippingCountry(value: unknown) {
  if (typeof value !== "string") {
    throw apiError(400, "invalid_country", "Enter a valid two-letter ISO country code.");
  }
  const trimmed = value.trim();
  const code = /^pakistan$/i.test(trimmed)
    ? "PK"
    : /^[A-Za-z]{2}$/.test(trimmed)
      ? trimmed.toUpperCase()
      : "";
  const name = code ? regionNames.of(code) : undefined;
  if (!code || !name || name === "Unknown Region" || name === code) {
    throw apiError(400, "invalid_country", "Enter a valid two-letter ISO country code, such as PK or US.");
  }
  return { code, name };
}

function databaseName() {
  if (process.env.FIRESTORE_DATABASE_ID?.trim()) return process.env.FIRESTORE_DATABASE_ID.trim();
  const configPath = path.join(__dirname, "firebase-applet-config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as { firestoreDatabaseId?: unknown };
  if (typeof config.firestoreDatabaseId !== "string" || !config.firestoreDatabaseId.trim()) {
    throw new Error("FIRESTORE_DATABASE_ID is unset and firebase-applet-config.json has no named database ID.");
  }
  return config.firestoreDatabaseId.trim();
}

function getAdminDb() {
  let app = getApps()[0];
  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credential = serviceAccount
      ? cert(JSON.parse(serviceAccount))
      : applicationDefault();
    app = initializeApp({ credential, ...(projectId ? { projectId } : {}) });
  }
  return getFirestore(app, databaseName());
}

function apiError(status: number, code: string, message: string) {
  const error = new Error(message) as Error & { status?: number; code?: string };
  error.status = status;
  error.code = code;
  return error;
}

function asyncRoute(handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

function validText(value: unknown, maxLength: number, required = true): value is string {
  return typeof value === "string"
    && value.trim().length <= maxLength
    && (!required || value.trim().length > 0);
}

function limitRequests(windowMs: number, maxRequests: number, scope: "path" | "ip" = "path") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = scope === "ip" ? (req.ip || "unknown") : `${req.ip || "unknown"}:${req.path}`;
    const current = requestCounts.get(key);
    if ((rateLimitRequestCount++ % 256) === 0) {
      for (const [entryKey, entry] of requestCounts) {
        if (entry.expiresAt <= now) requestCounts.delete(entryKey);
      }
    }
    if (!current || current.expiresAt <= now) {
      if (!current && requestCounts.size >= MAX_RATE_LIMIT_KEYS) {
        next(apiError(503, "rate_limiter_capacity", "Request protection is temporarily at capacity. Try again shortly."));
        return;
      }
      requestCounts.set(key, { count: 1, expiresAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > maxRequests) {
      next(apiError(429, "rate_limited", "Too many requests. Try again shortly."));
      return;
    }
    next();
  };
}


function allowConfiguredOrigins(req: Request, res: Response, next: NextFunction) {
  const origin = req.header("origin");

  if (origin && corsOrigins.size > 0) {
    if (!corsOrigins.has(origin)) {
      next(apiError(403, "origin_not_allowed", "This application origin is not allowed."));
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.vary("Origin");
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.status(204).end();
    return;
  }

  next();
}


const authenticate = asyncRoute(async (req, _res, next) => {
  const authorization = req.header("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw apiError(401, "missing_token", "A Firebase ID token is required.");

  let identity: DecodedIdToken;
  try {
    const app = getApps()[0] || initializeApp({
      credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
        : applicationDefault(),
      ...(process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
        ? { projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT }
        : {}),
    });
    const { getAuth } = await import("firebase-admin/auth");
    identity = await getAuth(app).verifyIdToken(token, true);
  } catch {
    console.error("Firebase ID token verification failed.");
    throw apiError(401, "invalid_token", "The Firebase ID token is invalid or expired.");
  }

  req.identity = identity;
  next();
});

const requireActiveAccount = asyncRoute(async (req, _res, next) => {
  if (!req.identity) throw apiError(401, "unauthenticated", "Sign in is required.");
  const snapshot = await getAdminDb().doc(`users/${req.identity.uid}`).get();
  if (!snapshot.exists) throw apiError(403, "profile_missing", "Complete account setup before continuing.");
  const account = snapshot.data() || {};
  if (account.status !== "approved") {
    throw apiError(403, "account_inactive", "This account is not active.");
  }
  req.account = account;
  next();
});

const requireSeller = asyncRoute(async (req, _res, next) => {
  if (!isApprovedSellerProfile(req.account)) {
    throw apiError(403, "seller_not_approved", "An approved seller account is required.");
  }
  next();
});

const requireVerifiedEmail = asyncRoute(async (req, _res, next) => {
  if (!req.identity?.email_verified) {
    throw apiError(403, "email_not_verified", "Verify your email before performing this action.");
  }
  next();
});

const requireAdmin = asyncRoute(async (req, _res, next) => {
  const email = (req.identity?.email || "").toLowerCase();
  if (!req.identity?.email_verified || !ADMIN_EMAILS.has(email)) {
    throw apiError(403, "admin_required", "Administrator access is required.");
  }
  const profile = await getAdminDb().doc(`users/${req.identity.uid}`).get();
  if (profile.exists && profile.data()?.status !== "approved") {
    throw apiError(403, "account_inactive", "This administrator account is not active.");
  }
  next();
});

function auditRef(db: ReturnType<typeof getAdminDb>) {
  return db.collection("auditLogs").doc();
}

function writeAudit(
  transaction: Transaction,
  ref: ReturnType<typeof auditRef>,
  actor: AuthenticatedRequest["identity"],
  action: string,
  target: string,
  details: Record<string, unknown> = {},
) {
  transaction.set(ref, {
    actorUid: actor?.uid || "",
    actorEmail: actor?.email || "",
    action,
    target,
    details,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
  app.use(express.json({ limit: "256kb" }));
  app.use("/api", allowConfiguredOrigins);
  app.use("/api", limitRequests(60_000, 300, "ip"));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/chat", limitRequests(60_000, 12), asyncRoute(async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw apiError(503, "chat_not_configured", "The assistant is temporarily unavailable.");
    const message = req.body?.message;
    const history = req.body?.history;
    if (!validText(message, 2000) || !Array.isArray(history) || history.length > 20) {
      throw apiError(400, "invalid_chat_request", "Provide a message up to 2,000 characters and no more than 20 prior messages.");
    }
    const safeHistory = history.map((entry: unknown) => {
      if (!entry || typeof entry !== "object") throw apiError(400, "invalid_chat_history", "Chat history contains an invalid message.");
      const item = entry as { role?: unknown; parts?: unknown };
      const text = Array.isArray(item.parts) && item.parts.length === 1
        ? (item.parts[0] as { text?: unknown } | null)?.text
        : null;
      if ((item.role !== "user" && item.role !== "model") || !validText(text, 2000)) {
        throw apiError(400, "invalid_chat_history", "Chat history contains an invalid message.");
      }
      return { role: item.role, parts: [{ text }] };
    });
    try {
      const client = new GoogleGenAI({ apiKey });
      const chat = client.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a helpful shopping assistant for Halal-Bazaar, a multi-vendor marketplace. Do not claim that products, sellers, or certificates have been independently verified. Do not request personal, payment, or account credentials.",
        },
        history: safeHistory,
      });
      const response = await chat.sendMessage({ message: message.trim() });
      if (typeof response.text !== "string" || !response.text.trim()) {
        throw apiError(502, "chat_empty_response", "The assistant returned no response.");
      }
      res.json({ text: response.text });
    } catch (error) {
      if ((error as { status?: number }).status) throw error;
      console.error("Gemini assistant request failed.");
      throw apiError(502, "chat_provider_error", "The assistant could not complete this request.");
    }
  }));
  app.get("/api/checkout/config", (_req, res) => {
    res.json({
      taxRates: { PKR: PKR_TAX_RATE, USD: USD_TAX_RATE },
      legacyPriceCurrency: LEGACY_PRODUCT_PRICE_CURRENCY || null,
      cashOnDeliveryCountries: [...COD_ALLOWED_COUNTRIES],
      bankTransferEnabled: {
        PKR: Boolean(DOMESTIC_BANK_TRANSFER_INSTRUCTIONS),
        USD: Boolean(INTERNATIONAL_BANK_TRANSFER_INSTRUCTIONS),
      },
    });
  });

  app.post("/api/orders", authenticate, requireActiveAccount, requireVerifiedEmail, limitRequests(60_000, 8), asyncRoute(async (req, res) => {
    const input = req.body as {
      items?: OrderLineInput[];
      shippingAddress?: Record<string, unknown>;
      paymentMethod?: string;
      transferReference?: string;
      sellerPayments?: Array<{
        sellerId?: unknown;
        paymentAccountId?: unknown;
        transferReference?: unknown;
      }>;
      idempotencyKey?: string;
    };
    if (!input || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
      throw apiError(400, "invalid_items", "Provide between 1 and 50 order items.");
    }
    if (!input.shippingAddress
      || !validText(input.shippingAddress.name, 100)
      || !validText(input.shippingAddress.address, 300)
      || !validText(input.shippingAddress.city, 100)
      || !validText(input.shippingAddress.zip, 30)
      || !validText(input.shippingAddress.country, 80)) {
      throw apiError(400, "invalid_address", "Complete all required delivery address fields.");
    }
    const shippingAddress = input.shippingAddress;
    const destination = normalizeShippingCountry(shippingAddress.country);
    const validatedShippingAddress = {
      name: (shippingAddress.name as string).trim(),
      address: (shippingAddress.address as string).trim(),
      city: (shippingAddress.city as string).trim(),
      zip: (shippingAddress.zip as string).trim(),
      country: destination.name,
    };
    const currency = marketCurrencyForCountry(destination.code);
    const taxRate = currency === "PKR" ? PKR_TAX_RATE : USD_TAX_RATE;
    if (taxRate === null) {
      throw apiError(503, "market_tax_not_configured", "International checkout is unavailable until the business configures its USD tax policy.");
    }
    const paymentMethod = input.paymentMethod;
    if (!["cash_on_delivery", "bank_transfer", "manual_payment"].includes(paymentMethod || "")) {
      throw apiError(400, "invalid_payment_method", "Select cash on delivery or manual payment.");
    }
    if (paymentMethod === "cash_on_delivery"
      && !isCashOnDeliveryAllowed(destination.code, COD_ALLOWED_COUNTRIES)) {
      throw apiError(400, "cod_unavailable", "Cash on delivery is not available for this delivery destination.");
    }
    const bankTransferInstructions = currency === "PKR"
      ? DOMESTIC_BANK_TRANSFER_INSTRUCTIONS
      : INTERNATIONAL_BANK_TRANSFER_INSTRUCTIONS;
    if (paymentMethod === "bank_transfer" && !bankTransferInstructions) {
      throw apiError(503, "bank_transfer_not_configured", "Manual bank transfer is unavailable for this market because its payment instructions are not configured.");
    }
    if (paymentMethod === "bank_transfer" && !validText(input.transferReference, 120)) {
      throw apiError(400, "invalid_transfer_reference", "Enter a transfer reference no longer than 120 characters.");
    }
    let normalizedSellerPayments: ReturnType<typeof validateSellerPaymentEntries> = [];
    if (paymentMethod === "manual_payment") {
      try {
        normalizedSellerPayments = validateSellerPaymentEntries(input.sellerPayments);
      } catch (error) {
        if (error instanceof PaymentValidationError) {
          throw apiError(400, error.code, error.message);
        }
        throw error;
      }
    } else if (Array.isArray(input.sellerPayments) && input.sellerPayments.length > 0) {
      throw apiError(400, "unexpected_seller_payments", "Seller payment entries are only valid for manual payment.");
    } else if (input.sellerPayments != null && !Array.isArray(input.sellerPayments)) {
      throw apiError(400, "invalid_seller_payments", "Seller payment entries must be an array.");
    }

    const normalizedItems = new Map<string, number>();
    for (const item of input.items) {
      if (!item || typeof item.productId !== "string" || item.productId.length < 1
        || item.productId.length > 150 || item.productId.includes("/")
        || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        throw apiError(400, "invalid_item", "Each item requires a valid product ID and quantity.");
      }
      normalizedItems.set(item.productId, (normalizedItems.get(item.productId) || 0) + item.quantity);
    }
    if ([...normalizedItems.values()].some((quantity) => quantity > 100)) {
      throw apiError(400, "invalid_quantity", "Requested quantity exceeds the maximum.");
    }

    const idempotencyKey = input.idempotencyKey;
    if (typeof idempotencyKey !== "string" || !/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey)) {
      throw apiError(400, "idempotency_required", "A valid idempotency key is required.");
    }

    const db = getAdminDb();
    const buyerId = req.identity!.uid;
    const idempotencyRef = db.collection("orderIdempotency").doc(idempotencyKey);
    const orderRef = db.collection("orders").doc();
    const fingerprint = createHash("sha256").update(JSON.stringify({
      items: [...normalizedItems.entries()].sort(([left], [right]) => left.localeCompare(right)),
      paymentMethod,
      transferReference: paymentMethod === "bank_transfer" ? (input.transferReference || "").trim() : "",
      sellerPayments: normalizedSellerPayments
        .map((entry) => ({ ...entry }))
        .sort((left, right) => left.sellerId.localeCompare(right.sellerId)),
      shippingAddress: validatedShippingAddress,
    })).digest("hex");
    const result = await db.runTransaction(async (transaction) => {
      const previous = await transaction.get(idempotencyRef);
      if (previous.exists) {
        const prior = previous.data() || {};
        if (prior.buyerId !== buyerId) throw apiError(409, "idempotency_conflict", "This request key has already been used.");
        if (prior.fingerprint !== fingerprint) {
          throw apiError(409, "idempotency_payload_conflict", "The request differs from the original order attempt.");
        }
        const priorOrder = await transaction.get(db.doc(`orders/${prior.orderId}`));
        if (!priorOrder.exists) throw apiError(409, "order_missing", "The original order is unavailable.");
        return { id: priorOrder.id, ...priorOrder.data(), reused: true };
      }

      const productRefs = [...normalizedItems.keys()].map((id) => db.doc(`products/${id}`));
      const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
      const sellerIdsForProducts = [...new Set(productSnapshots
        .map((snapshot) => snapshot.data()?.sellerId)
        .filter((sellerId): sellerId is string => typeof sellerId === "string"))].sort();
      if (sellerIdsForProducts.some((sellerId) => !/^[A-Za-z0-9_-]{1,128}$/.test(sellerId))) {
        throw apiError(409, "invalid_product_seller", "A product is not linked to a valid seller.");
      }
      const sellerSnapshots = await Promise.all(sellerIdsForProducts.map((uid) => transaction.get(db.doc(`users/${uid}`))));
      const sellerAccountSnapshots = paymentMethod === "manual_payment"
        ? await Promise.all(sellerIdsForProducts.map((uid) =>
          transaction.get(db.doc(`sellerPaymentAccounts/${uid}`)),
        ))
        : [];
      const activeSellerIds = new Set(sellerSnapshots
        .filter((snapshot) => snapshot.exists
          && isApprovedSellerProfile(snapshot.data()))
        .map((snapshot) => snapshot.id));
      const selectedPaymentAccounts = new Map<string, {
        paymentAccountId: string;
        transferReference: string;
        account: ReturnType<typeof validateSellerPaymentAccounts>[number];
      }>();
      if (paymentMethod === "manual_payment") {
        const actualSellerIds = [...sellerIdsForProducts].sort();
        try {
          assertSellerPaymentEntriesMatchSellers(normalizedSellerPayments, actualSellerIds);
        } catch (error) {
          if (error instanceof PaymentValidationError) {
            throw apiError(400, error.code, error.message);
          }
          throw error;
        }

        const paymentEntries = new Map(
          normalizedSellerPayments.map((entry) => [entry.sellerId, entry]),
        );
        for (let index = 0; index < actualSellerIds.length; index += 1) {
          const sellerId = actualSellerIds[index];
          const entry = paymentEntries.get(sellerId)!;
          const accountSnapshot = sellerAccountSnapshots[index];
          const savedAccounts = accountSnapshot.data()?.accounts;
          if (
            !accountSnapshot.exists
            || accountSnapshot.data()?.sellerId !== sellerId
            || !Array.isArray(savedAccounts)
          ) {
            throw apiError(409, "seller_payment_account_unavailable", "A selected seller has no saved payment accounts.");
          }

          let validatedAccounts: ReturnType<typeof validateSellerPaymentAccounts>;
          try {
            validatedAccounts = validateSellerPaymentAccounts(savedAccounts);
          } catch (error) {
            if (error instanceof PaymentValidationError) {
              throw apiError(409, "seller_payment_account_invalid", "A seller's saved payment account is unavailable.");
            }
            throw error;
          }
          const account = findEnabledPaymentAccount(validatedAccounts, entry.paymentAccountId);
          if (!account) {
            throw apiError(409, "seller_payment_account_unavailable", "A selected payment account is no longer enabled for its seller.");
          }
          selectedPaymentAccounts.set(sellerId, {
            paymentAccountId: entry.paymentAccountId,
            transferReference: entry.transferReference,
            account,
          });
        }
      }
      const orderLines: Array<Record<string, unknown>> = [];
      let subtotalCents = 0;
      const sellerIds = new Set<string>();
      const sellerSubtotalsCents = Object.create(null) as Record<string, number>;

      productSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) throw apiError(400, "product_unavailable", "A product in this cart is no longer available.");
        const product = snapshot.data() || {};
        const quantity = normalizedItems.get(snapshot.id)!;
        if (product.published !== true || !Number.isSafeInteger(product.stock) || product.stock < quantity) {
          throw apiError(409, "stock_unavailable", `${product.name || "A product"} is no longer available in the requested quantity.`);
        }
        const marketPrice = getProductPrice(product, currency, LEGACY_PRODUCT_PRICE_CURRENCY);
        if (marketPrice === null) {
          throw apiError(409, "market_price_unavailable", `A product has no valid ${currency} price and cannot be ordered.`);
        }
        if (typeof product.sellerId !== "string") {
          throw apiError(409, "invalid_product_seller", "A product is not linked to a valid seller.");
        }
        if (!activeSellerIds.has(product.sellerId)) {
          throw apiError(409, "seller_unavailable", "A product's seller is not currently approved.");
        }
        const priceCents = Math.round(marketPrice * 100);
        if (!Number.isSafeInteger(priceCents) || priceCents <= 0) {
          throw apiError(409, "invalid_product_price", "A product price is outside the supported range.");
        }
        subtotalCents += priceCents * quantity;
        if (!Number.isSafeInteger(subtotalCents)) {
          throw apiError(400, "order_total_overflow", "The order total exceeds the supported range.");
        }
        const lineTotalCents = priceCents * quantity;
        sellerSubtotalsCents[product.sellerId] =
          (sellerSubtotalsCents[product.sellerId] || 0) + lineTotalCents;
        if (!Number.isSafeInteger(sellerSubtotalsCents[product.sellerId])) {
          throw apiError(400, "order_total_overflow", "The seller subtotal exceeds the supported range.");
        }
        sellerIds.add(product.sellerId);
        orderLines.push({
          product: {
            id: snapshot.id,
            name: product.name,
            price: priceCents / 100,
            priceCurrency: currency,
            category: product.category || "",
            images: Array.isArray(product.images) ? product.images.slice(0, 8) : [],
            sellerId: product.sellerId,
            sellerName: product.sellerName || "",
          },
          quantity,
          lineTotal: lineTotalCents / 100,
        });
        transaction.update(productRefs[index], { stock: product.stock - quantity });
      });

      const taxCents = calculateTaxCents(subtotalCents, taxRate);
      const totalCents = subtotalCents + taxCents;
      if (!Number.isSafeInteger(taxCents) || !Number.isSafeInteger(totalCents)) {
        throw apiError(400, "order_total_overflow", "The order total exceeds the supported range.");
      }
      let sellerPaymentRecords: Record<
        string,
        ReturnType<typeof createPendingSellerPayment>
      > | undefined;
      if (paymentMethod === "manual_payment") {
        const sellerTaxCents = allocateSellerTaxCents(sellerSubtotalsCents, taxCents);
        sellerPaymentRecords = Object.fromEntries(
          [...sellerIds].map((sellerId) => {
            const selected = selectedPaymentAccounts.get(sellerId)!;
            return [sellerId, createPendingSellerPayment(
              {
                sellerId,
                paymentAccountId: selected.paymentAccountId,
                transferReference: selected.transferReference,
              },
              selected.account,
              sellerSubtotalsCents[sellerId],
              sellerTaxCents[sellerId],
            )];
          }),
        );
        const sellerAmountsCents = Object.values(sellerPaymentRecords)
          .reduce((total, payment) => total + Math.round(Number(payment.amount) * 100), 0);
        if (sellerAmountsCents !== totalCents) {
          throw apiError(500, "seller_payment_total_mismatch", "Seller payment amounts do not reconcile with the order total.");
        }
      }
      const order = {
        buyerId,
        buyerEmail: req.identity?.email || "",
        items: orderLines,
        sellerIds: [...sellerIds],
        subtotal: subtotalCents / 100,
        taxAmount: taxCents / 100,
        taxRate,
        totalAmount: totalCents / 100,
        currency,
        status: "pending",
        paymentMethod,
        paymentStatus: paymentMethod === "bank_transfer" || paymentMethod === "manual_payment"
          ? "pending_review"
          : "unpaid",
        transferReference: paymentMethod === "bank_transfer" ? (input.transferReference || "").trim() : "",
        ...(sellerPaymentRecords ? { sellerPayments: sellerPaymentRecords } : {}),
        shippingAddress: validatedShippingAddress,
        fulfillmentBySeller: {},
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      transaction.create(orderRef, order);
      transaction.create(idempotencyRef, {
        buyerId,
        orderId: orderRef.id,
        fingerprint,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { id: orderRef.id, ...order, reused: false };
    });
    res.status(result.reused ? 200 : 201).json({
      order: result,
      bankTransferInstructions: paymentMethod === "bank_transfer"
        ? bankTransferInstructions
        : null,
    });
  }));

  app.get("/api/orders", authenticate, requireActiveAccount, requireVerifiedEmail, asyncRoute(async (req, res) => {
    const snapshot = await getAdminDb().collection("orders")
      .where("buyerId", "==", req.identity!.uid)
      .limit(100)
      .get();
    res.json({ orders: snapshot.docs.map((order) => ({ id: order.id, ...order.data() })) });
  }));

  app.get("/api/orders/:orderId", authenticate, requireActiveAccount, requireVerifiedEmail, asyncRoute(async (req, res) => {
    const snapshot = await getAdminDb().doc(`orders/${req.params.orderId}`).get();
    if (!snapshot.exists) throw apiError(404, "order_not_found", "Order not found.");
    if (snapshot.data()?.buyerId !== req.identity!.uid) throw apiError(403, "order_forbidden", "You cannot view this order.");
    res.json({ order: { id: snapshot.id, ...snapshot.data() } });
  }));

  app.post("/api/seller/applications", authenticate, requireActiveAccount, requireVerifiedEmail, limitRequests(60_000, 3), asyncRoute(async (req, res) => {
    const input = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : {};
    if (!validText(input.storeName, 100) || !validText(input.description, 2000)
      || !validText(input.contactPhone, 40) || !validText(input.businessAddress, 300)
      || !validText(input.city, 100)) {
      throw apiError(400, "invalid_application", "Store name, description, phone, business address, and city are required.");
    }
    const db = getAdminDb();
    const uid = req.identity!.uid;
    const userRef = db.doc(`users/${uid}`);
    const applicationRef = db.doc(`sellerApplications/${uid}`);
    const now = FieldValue.serverTimestamp();
    await db.runTransaction(async (transaction) => {
      const [userSnapshot, applicationSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(applicationRef),
      ]);
      if (!userSnapshot.exists) throw apiError(403, "profile_missing", "Complete account setup before applying.");
      if (userSnapshot.data()?.role === "seller" && userSnapshot.data()?.status === "approved") {
        throw apiError(409, "already_seller", "This account already has approved seller access.");
      }
      if (applicationSnapshot.exists && applicationSnapshot.data()?.status === "pending") {
        throw apiError(409, "application_pending", "A seller application is already awaiting review.");
      }
      const application = {
        uid,
        email: req.identity?.email || "",
        storeName: (input.storeName as string).trim(),
        description: (input.description as string).trim(),
        contactPhone: (input.contactPhone as string).trim(),
        businessAddress: (input.businessAddress as string).trim(),
        city: (input.city as string).trim(),
        status: "pending",
        submittedAt: now,
        reason: "",
      };
      transaction.set(applicationRef, application);
      transaction.set(userRef, {
        storeName: application.storeName,
        storeDescription: application.description,
        sellerContactPhone: application.contactPhone,
        businessAddress: application.businessAddress,
        businessCity: application.city,
        sellerApplication: { status: "pending", submittedAt: now, reason: "" },
        updatedAt: now,
      }, { merge: true });
    });
    res.status(201).json({ status: "pending" });
  }));

  app.put("/api/seller/store", authenticate, requireActiveAccount, requireVerifiedEmail, requireSeller, asyncRoute(async (req, res) => {
    const input = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : {};
    if (!validText(input.storeName, 100) || !validText(input.description, 2000)
      || !validText(input.contactPhone, 40, false) || !validText(input.businessAddress, 300, false)
      || !validText(input.city, 100, false)) {
      throw apiError(400, "invalid_store_profile", "Store name and description are required; other fields have invalid lengths.");
    }
    await getAdminDb().doc(`users/${req.identity!.uid}`).set({
      storeName: (input.storeName as string).trim(),
      storeDescription: (input.description as string).trim(),
      sellerContactPhone: (input.contactPhone as string).trim(),
      businessAddress: (input.businessAddress as string).trim(),
      businessCity: (input.city as string).trim(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ ok: true });
  }));

  app.get(
    "/api/seller/payment-accounts",
    authenticate,
    requireActiveAccount,
    requireVerifiedEmail,
    requireSeller,
    asyncRoute(async (req, res) => {
      const snapshot = await getAdminDb()
        .doc(`sellerPaymentAccounts/${req.identity!.uid}`)
        .get();

      res.json({
        accounts: snapshot.exists ? snapshot.data()?.accounts || [] : [],
      });
    }),
  );

  app.put(
    "/api/seller/payment-accounts",
    authenticate,
    requireActiveAccount,
    requireVerifiedEmail,
    requireSeller,
    asyncRoute(async (req, res) => {
      let accounts: ReturnType<typeof validateSellerPaymentAccounts>;
      try {
        accounts = validateSellerPaymentAccounts(req.body?.accounts);
      } catch (error) {
        if (error instanceof PaymentValidationError) {
          throw apiError(400, error.code, error.message);
        }
        throw error;
      }

      await getAdminDb()
        .doc(`sellerPaymentAccounts/${req.identity!.uid}`)
        .set({
          sellerId: req.identity!.uid,
          accounts,
          updatedAt: FieldValue.serverTimestamp(),
        });

      res.json({ ok: true, accounts });
    }),
  );

  app.get(
    "/api/checkout/payment-accounts",
    authenticate,
    requireActiveAccount,
    requireVerifiedEmail,
    asyncRoute(async (req, res) => {
      const rawSellerIds = req.query.sellerIds;

      if (typeof rawSellerIds !== "string") {
        throw apiError(400, "seller_ids_required", "Seller IDs are required.");
      }

      const sellerIds = [...new Set(rawSellerIds.split(","))];

      if (
        sellerIds.length < 1 ||
        sellerIds.length > 20 ||
        sellerIds.length !== rawSellerIds.split(",").length ||
        sellerIds.some((id) => !/^[A-Za-z0-9_-]{1,128}$/.test(id))
      ) {
        throw apiError(400, "invalid_seller_ids", "Invalid seller IDs.");
      }

      const db = getAdminDb();
      const snapshots = await Promise.all(
        sellerIds.map((uid) =>
          Promise.all([
            db.doc(`users/${uid}`).get(),
            db.doc(`sellerPaymentAccounts/${uid}`).get(),
          ]),
        ),
      );

      const sellers = snapshots.map(([userSnapshot, accountSnapshot], index) => {
        const user = userSnapshot.data() || {};
        const accountData = accountSnapshot.data() || {};
        const accountList = accountData.accounts;
        if (!userSnapshot.exists || !isApprovedSellerProfile(user)) {
          return { sellerId: sellerIds[index], sellerName: "", accounts: [] };
        }
        if (
          accountSnapshot.exists
          && accountData.sellerId !== sellerIds[index]
        ) {
          throw apiError(409, "seller_payment_account_invalid", "A seller's saved payment account is unavailable.");
        }
        let accounts: ReturnType<typeof validateSellerPaymentAccounts> = [];
        if (Array.isArray(accountList)) {
          try {
            accounts = validateSellerPaymentAccounts(accountList);
          } catch (error) {
            if (error instanceof PaymentValidationError) {
              throw apiError(409, "seller_payment_account_invalid", "A seller's saved payment account is unavailable.");
            }
            throw error;
          }
        }

        return {
          sellerId: sellerIds[index],
          sellerName: user.storeName || "",
          accounts: accounts
            .filter((account) => account.enabled)
            .map(({ id, method, accountTitle, accountNumber, iban, instructions }) => ({
              id,
              method,
              accountTitle,
              accountNumber,
              iban,
              instructions,
              enabled: true,
            })),
        };
      });

      res.json({ sellers });
    }),
  );


  app.get("/api/seller/orders", authenticate, requireActiveAccount, requireVerifiedEmail, requireSeller, asyncRoute(async (req, res) => {
    const snapshot = await getAdminDb().collection("orders")
      .where("sellerIds", "array-contains", req.identity!.uid)
      .limit(100)
      .get();
    res.json({
      orders: snapshot.docs.map((document) => {
        const order = document.data();
        const items = Array.isArray(order.items)
          ? order.items.filter((line) => line?.product?.sellerId === req.identity!.uid)
          : [];
        const subtotal = items.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0);
        return {
          id: document.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          currency: order.currency,
          items,
          subtotal: order.sellerPayments?.[req.identity!.uid]?.subtotal ?? subtotal,
          shippingAddress: order.shippingAddress,
          sellerPayment: order.sellerPayments?.[req.identity!.uid] || null,
          fulfillmentStatus: order.fulfillmentBySeller?.[req.identity!.uid]?.status || "pending",
        };
      }),
    });
  }));

  app.post("/api/seller/orders/:orderId/payment-review", authenticate, requireActiveAccount, requireVerifiedEmail, requireSeller, asyncRoute(async (req, res) => {
    const decision = req.body?.decision;
    if (decision !== "approve" && decision !== "reject") {
      throw apiError(400, "invalid_seller_payment_decision", "Choose approve or reject.");
    }
    const db = getAdminDb();
    const sellerId = req.identity!.uid;
    const orderRef = db.doc(`orders/${req.params.orderId}`);
    const reviewRef = db.collection("paymentReviews").doc();
    const audit = auditRef(db);
    let resultingStatus = "";

    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) {
        throw apiError(404, "order_not_found", "Order not found.");
      }
      const order = orderSnapshot.data()!;
      if (
        order.paymentMethod !== "manual_payment"
        || !Array.isArray(order.sellerIds)
        || !order.sellerIds.includes(sellerId)
      ) {
        throw apiError(404, "seller_order_not_found", "This order has no payment assigned to your store.");
      }
      if (order.status === "cancelled") {
        throw apiError(409, "order_cancelled", "Payments cannot be reviewed for a cancelled order.");
      }

      const payments = order.sellerPayments;
      if (!payments || typeof payments !== "object" || Array.isArray(payments)) {
        throw apiError(404, "seller_payment_not_found", "Your seller payment record is unavailable.");
      }
      let review: ReturnType<typeof applySellerPaymentReview>;
      try {
        review = applySellerPaymentReview(
          payments as Record<string, Record<string, unknown>>,
          sellerId,
          decision,
          sellerId,
          FieldValue.serverTimestamp(),
        );
      } catch (error) {
        if (error instanceof PaymentValidationError) {
          const status = error.code === "seller_payment_not_found" ? 404 : 409;
          throw apiError(status, error.code, error.message);
        }
        throw error;
      }
      resultingStatus = review.paymentStatus;

      transaction.update(orderRef, {
        sellerPayments: review.sellerPayments,
        paymentStatus: resultingStatus,
        ...(resultingStatus === "paid"
          ? {
            paymentReviewedAt: FieldValue.serverTimestamp(),
            paymentReviewedBy: sellerId,
          }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(reviewRef, {
        orderId: orderRef.id,
        buyerId: order.buyerId,
        sellerId,
        decision,
        actorUid: sellerId,
        createdAt: FieldValue.serverTimestamp(),
      });
      writeAudit(transaction, audit, req.identity, "seller_order_payment_reviewed", orderRef.id, {
        sellerId,
        decision,
      });
    });

    res.json({ ok: true, decision, paymentStatus: resultingStatus });
  }));

  app.patch("/api/seller/orders/:orderId/fulfillment", authenticate, requireActiveAccount, requireVerifiedEmail, requireSeller, asyncRoute(async (req, res) => {
    const status = req.body?.status;
    if (!["processing", "shipped", "delivered"].includes(status)) {
      throw apiError(400, "invalid_fulfillment_status", "Use processing, shipped, or delivered.");
    }
    const db = getAdminDb();
    const orderRef = db.doc(`orders/${req.params.orderId}`);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      const order = snapshot.data();
      if (!snapshot.exists || !Array.isArray(order?.sellerIds) || !order.sellerIds.includes(req.identity!.uid)) {
        throw apiError(404, "seller_order_not_found", "This order is not assigned to your store.");
      }
      if (order.paymentMethod === "manual_payment") {
        if (order.sellerPayments?.[req.identity!.uid]?.status !== "paid") {
          throw apiError(409, "payment_review_required", "Your seller payment must be verified before fulfillment begins.");
        }
      } else if (order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid") {
        throw apiError(409, "payment_review_required", "Bank-transfer orders must be verified before fulfillment begins.");
      }
      const currentStatus = order.fulfillmentBySeller?.[req.identity!.uid]?.status || "pending";
      const allowed: Record<string, string[]> = {
        pending: ["processing"],
        processing: ["shipped"],
        shipped: ["delivered"],
        delivered: [],
      };
      if (!allowed[currentStatus]?.includes(status)) {
        throw apiError(409, "invalid_status_transition", `Cannot move fulfillment from ${currentStatus} to ${status}.`);
      }
      transaction.update(orderRef, {
        fulfillmentBySeller: {
          ...(order.fulfillmentBySeller || {}),
          [req.identity!.uid]: {
            status,
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    res.json({ ok: true, status });
  }));

  app.get("/api/admin/data", authenticate, requireAdmin, asyncRoute(async (_req, res) => {
    const db = getAdminDb();
    const [users, applications, products, orders, reviews] = await Promise.all([
      db.collection("users").limit(500).get(),
      db.collection("sellerApplications").limit(200).get(),
      db.collection("products").limit(500).get(),
      db.collection("orders").limit(500).get(),
      db.collection("paymentReviews").limit(200).get(),
    ]);
    res.json({
      users: users.docs.map((item) => ({ id: item.id, ...item.data() })),
      applications: applications.docs.map((item) => ({ id: item.id, ...item.data() })),
      products: products.docs.map((item) => ({ id: item.id, ...item.data() })),
      orders: orders.docs.map((item) => ({ id: item.id, ...item.data() })),
      paymentReviews: reviews.docs.map((item) => ({ id: item.id, ...item.data() })),
    });
  }));

  app.post("/api/admin/seller-applications/:uid/decision", authenticate, requireAdmin, asyncRoute(async (req, res) => {
    const decision = req.body?.decision;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!["approved", "rejected"].includes(decision) || (decision === "rejected" && !validText(reason, 1000))) {
      throw apiError(400, "invalid_application_decision", "Choose approve, or reject with a reason.");
    }
    const db = getAdminDb();
    const uid = req.params.uid;
    if (uid === req.identity!.uid) {
      throw apiError(403, "self_application_review", "Administrators cannot review their own seller application.");
    }
    const applicationRef = db.doc(`sellerApplications/${uid}`);
    const userRef = db.doc(`users/${uid}`);
    const audit = auditRef(db);
    await db.runTransaction(async (transaction) => {
      const [applicationSnapshot, userSnapshot] = await Promise.all([
        transaction.get(applicationRef),
        transaction.get(userRef),
      ]);
      if (!applicationSnapshot.exists || !userSnapshot.exists) throw apiError(404, "application_not_found", "Seller application not found.");
      if (applicationSnapshot.data()?.status !== "pending") throw apiError(409, "application_not_pending", "This application has already been reviewed.");
      transaction.update(applicationRef, {
        status: decision,
        reason: decision === "rejected" ? reason : "",
        reviewedBy: req.identity!.uid,
        reviewedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(userRef, {
        ...(decision === "approved" ? { role: "seller", status: "approved" } : {}),
        sellerApplication: {
          status: decision,
          submittedAt: applicationSnapshot.data()?.submittedAt || null,
          reason: decision === "rejected" ? reason : "",
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
      writeAudit(transaction, audit, req.identity, `seller_application_${decision}`, uid, { reason });
    });
    res.json({ ok: true, decision });
  }));

  app.post("/api/admin/users/:uid/status", authenticate, requireAdmin, asyncRoute(async (req, res) => {
    const status = req.body?.status;
    if (!["approved", "suspended", "restricted"].includes(status)) {
      throw apiError(400, "invalid_account_status", "Choose approved, suspended, or restricted.");
    }
    const db = getAdminDb();
    const userRef = db.doc(`users/${req.params.uid}`);
    const audit = auditRef(db);
    await db.runTransaction(async (transaction) => {
      const target = await transaction.get(userRef);
      if (!target.exists) throw apiError(404, "user_not_found", "User not found.");
      if (target.id === req.identity!.uid && status !== "approved") {
        throw apiError(400, "self_suspension", "Administrators cannot suspend their own account.");
      }
      if (ADMIN_EMAILS.has((target.data()?.email || "").toLowerCase())) {
        throw apiError(400, "admin_status_protected", "Configured administrator accounts cannot be modified through account moderation.");
      }
      transaction.update(userRef, { status, updatedAt: FieldValue.serverTimestamp() });
      writeAudit(transaction, audit, req.identity, "user_status_changed", target.id, { status });
    });
    res.json({ ok: true, status });
  }));

  app.patch("/api/admin/products/:productId", authenticate, requireAdmin, asyncRoute(async (req, res) => {
    if (typeof req.body?.published !== "boolean") {
      throw apiError(400, "invalid_product_action", "A boolean published value is required.");
    }
    const db = getAdminDb();
    const productRef = db.doc(`products/${req.params.productId}`);
    const audit = auditRef(db);
    await db.runTransaction(async (transaction) => {
      const product = await transaction.get(productRef);
      if (!product.exists) throw apiError(404, "product_not_found", "Product not found.");
      transaction.update(productRef, { published: req.body.published, updatedAt: FieldValue.serverTimestamp() });
      writeAudit(transaction, audit, req.identity, "product_publication_changed", product.id, { published: req.body.published });
    });
    res.json({ ok: true });
  }));

  app.post("/api/admin/orders/:orderId/payment-review", authenticate, requireAdmin, asyncRoute(async (req, res) => {
    const decision = req.body?.decision;
    if (!["approve_transfer", "reject_transfer", "cash_received"].includes(decision)) {
      throw apiError(400, "invalid_payment_decision", "Choose approve_transfer, reject_transfer, or cash_received.");
    }
    const db = getAdminDb();
    const orderRef = db.doc(`orders/${req.params.orderId}`);
    const reviewRef = db.collection("paymentReviews").doc();
    const audit = auditRef(db);
    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) throw apiError(404, "order_not_found", "Order not found.");
      const order = orderSnapshot.data()!;
      if (order.buyerId === req.identity!.uid) {
        throw apiError(403, "self_payment_review", "Administrators cannot review payment for their own order.");
      }
      if (order.paymentMethod === "manual_payment" || order.sellerPayments) {
        throw apiError(409, "seller_payment_review_required", "Manual seller payments must be reviewed by their assigned sellers.");
      }
      const expectedMethod = decision === "cash_received" ? "cash_on_delivery" : "bank_transfer";
      const expectedPaymentStatus = decision === "cash_received" ? "unpaid" : "pending_review";
      if (order.paymentMethod !== expectedMethod || order.paymentStatus !== expectedPaymentStatus
        || order.status === "cancelled") {
        throw apiError(409, "payment_transition_invalid", "This payment cannot be reviewed in its current state.");
      }
      const paymentStatus = decision === "reject_transfer" ? "rejected" : "paid";
      transaction.update(orderRef, {
        paymentStatus,
        paymentReviewedAt: FieldValue.serverTimestamp(),
        paymentReviewedBy: req.identity!.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(reviewRef, {
        orderId: orderRef.id,
        buyerId: order.buyerId,
        paymentMethod: order.paymentMethod,
        decision,
        actorUid: req.identity!.uid,
        transferReference: order.transferReference || "",
        createdAt: FieldValue.serverTimestamp(),
      });
      writeAudit(transaction, audit, req.identity, "order_payment_reviewed", orderRef.id, { decision });
    });
    res.json({ ok: true, decision });
  }));

  app.post("/api/payments/:provider/initiate", authenticate, requireActiveAccount, asyncRoute(async (req, _res) => {
    const provider = req.params.provider;
    if (!["jazzcash", "easypaisa"].includes(provider)) throw apiError(404, "unknown_provider", "Unsupported payment provider.");
    if (typeof req.body?.orderId !== "string") throw apiError(400, "order_required", "An order ID is required.");
    const order = await getAdminDb().doc(`orders/${req.body.orderId}`).get();
    if (!order.exists || order.data()?.buyerId !== req.identity!.uid) throw apiError(404, "order_not_found", "Order not found.");
    throw apiError(503, "provider_not_configured", `${provider} is disabled until its official merchant integration, credentials, and callback signature verification are configured.`);
  }));

  app.post("/api/payments/:provider/callback", asyncRoute(async (req, res) => {
    const provider = req.params.provider;
    if (!["jazzcash", "easypaisa"].includes(provider)) throw apiError(404, "unknown_provider", "Unsupported payment provider.");
    res.status(503).json({
      error: {
        code: "provider_not_configured",
        message: "No provider callback is accepted until the official merchant signature specification and credentials are configured.",
      },
    });
  }));

  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use((error: Error & { status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
    const status = error.status || 500;
    if (status >= 500) console.error("API request failed:", error);
    res.status(status).json({
      error: {
        code: error.code || "internal_error",
        message: status >= 500 ? "The server could not complete this request." : error.message,
      },
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exitCode = 1;
});
