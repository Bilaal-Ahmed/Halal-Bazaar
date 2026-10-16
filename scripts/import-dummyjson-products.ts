import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SourceProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  brand?: string;
  images?: string[];
  thumbnail?: string;
  reviews?: unknown[];
};

const categoryMap: Record<string, string> = {
  groceries: "food",
  beauty: "beauty",
  fragrances: "beauty",
  "skin-care": "beauty",
  smartphones: "electronics",
  "mobile-accessories": "electronics",
  laptops: "electronics",
  tablets: "electronics",
  "mens-watches": "fashion",
  "womens-watches": "fashion",
  sunglasses: "fashion",
  "womens-dresses": "fashion",
  "womens-shoes": "fashion",
  "womens-bags": "fashion",
  tops: "fashion",
  "mens-shirts": "fashion",
  "mens-shoes": "fashion",
  "womens-jewellery": "fashion",
  "home-decoration": "home",
  furniture: "home",
  "kitchen-accessories": "home",
};

async function main() {
  const apply = process.argv.includes("--apply");
  const config = JSON.parse(
    readFileSync(resolve("firebase-applet-config.json"), "utf8"),
  ) as { projectId?: string; firestoreDatabaseId?: string; databaseId?: string };

  const projectId = config.projectId;
  const databaseId = config.firestoreDatabaseId ?? config.databaseId;

  if (projectId !== "gen-lang-client-0793173009" || !databaseId) {
    throw new Error("Firebase project/database configuration mismatch.");
  }

  const raw = readFileSync(resolve("data/dummyjson-products.json"), "utf8")
    .replace(/^\uFEFF/, "")
    .trim();

  const parsed = JSON.parse(raw) as SourceProduct[] | { products: SourceProduct[] };

  // Support both a raw product array and the full API response.
  const products = Array.isArray(parsed) ? parsed : parsed.products;

  const selected = products.filter(
    (p) => categoryMap[p.category] && (p.images?.[0] || p.thumbnail),
  );

  console.log(`Mode: ${apply ? "WRITE TO FIRESTORE" : "DRY RUN ONLY"}`);
  console.log(`Source products: ${products.length}`);
  console.log(`Products selected: ${selected.length}`);
  console.log("Category counts:");

  for (const [category, count] of Object.entries(
    selected.reduce<Record<string, number>>((counts, p) => {
      const category = categoryMap[p.category];
      counts[category] = (counts[category] ?? 0) + 1;
      return counts;
    }, {}),
  )) {
    console.log(`  ${category}: ${count}`);
  }

  if (!apply) {
    console.log("Dry run complete. No Firestore data was changed.");
    console.log("Review the counts, then rerun with --apply to import.");
    return;
  }

  const app = initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore(app, databaseId);
  let batch = db.batch();
  let pending = 0;
  let written = 0;

  for (const p of selected) {
    const category = categoryMap[p.category];
    const image = p.images?.length ? p.images : [p.thumbnail!];
    const pricePKR = Math.round(p.price * 280);

    const product = {
      id: `demo-dummyjson-${p.id}`,
      name: `DEMO — ${p.title}`,
      description:
        `${p.description}\n\nDEMO LISTING ONLY. Sample product and price; ` +
        "not a real seller offer. Halal certification has not been verified.",
      category,
      price: pricePKR,
      pricePKR,
      priceUSD: p.price,
      stock: 0,
      sellerId: `demo-seller-dummyjson-${category}`,
      sellerName: `Demo Catalogue — ${category}`,
      images: image,
      rating: p.rating ?? 0,
      numReviews: p.reviews?.length ?? 0,
      isHalalCertified: false,
      isDemo: true,
      tags: [...new Set(["demo", "sample", ...(p.tags ?? []), ...(p.brand ? [p.brand] : [])])],
      published: true,
      createdAt: FieldValue.serverTimestamp(),
    };

    batch.set(db.collection("products").doc(product.id), product, { merge: true });
    pending++;
    written++;

    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  console.log(`Imported/updated ${written} demo products.`);
  console.log("Existing demo product IDs were not targeted.");
}

main().catch((error: unknown) => {
  console.error("Import failed:", error);
  process.exitCode = 1;
});

