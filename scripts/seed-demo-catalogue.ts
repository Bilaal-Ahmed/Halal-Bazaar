
import { applicationDefault, initializeApp } from "firebase-admin/app";
import {
    FieldValue,
    getFirestore,
} from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const catalog = [
    {
        category: "food",
        sellers: ["Demo Fresh Mart", "Demo Organic Store", "Demo Grocery Hub"],
        products: [
            "Basmati Rice 5kg", "Premium Dates 1kg", "Mixed Dry Fruits 500g",
            "Organic Honey 500g", "Green Tea Pack", "Red Lentils 1kg",
            "Extra Virgin Olive Oil", "Wheat Flour 5kg", "Premium Black Tea",
            "Roasted Almonds 250g", "Chickpeas 1kg", "Coconut Oil 500ml",
            "Breakfast Oats 1kg", "Dried Figs 250g", "Mixed Spice Pack",
        ],
    },
    {
        category: "fashion",
        sellers: ["Demo Style Studio", "Demo Fashion House", "Demo Clothing Corner"],
        products: [
            "Classic Cotton T-Shirt", "Casual Kurta", "Everyday Denim Jeans",
            "Cotton Scarf", "Classic Polo Shirt", "Summer Lawn Suit",
            "Casual Hoodie", "Formal Dress Shirt", "Comfortable Joggers",
            "Everyday Abaya", "Cotton Sweatshirt", "Basic White Sneakers",
            "Canvas Tote Bag", "Classic Waistcoat", "Winter Knit Sweater",
        ],
    },
    {
        category: "beauty",
        sellers: ["Demo Beauty Store", "Demo Care Essentials", "Demo Glow Shop"],
        products: [
            "Gentle Face Cleanser", "Moisturizing Face Cream", "Aloe Vera Gel",
            "Rose Water Toner", "Vitamin C Serum", "Daily Sunscreen",
            "Coconut Hair Oil", "Nourishing Shampoo", "Herbal Conditioner",
            "Lip Balm", "Hand Cream", "Body Lotion",
            "Face Mask Pack", "Gentle Body Wash", "Beard Care Oil",
        ],
    },
    {
        category: "electronics",
        sellers: ["Demo Tech Store", "Demo Gadget World", "Demo Digital Shop"],
        products: [
            "Wireless Mouse", "USB-C Charging Cable", "Bluetooth Headphones",
            "Portable Power Bank", "Laptop Stand", "USB Flash Drive 64GB",
            "Wireless Keyboard", "Phone Holder", "LED Desk Lamp",
            "USB-C Adapter", "Portable Bluetooth Speaker", "Webcam Cover",
            "Laptop Sleeve", "Wired Earphones", "Multiport USB Hub",
        ],
    },
    {
        category: "home",
        sellers: ["Demo Home Living", "Demo Comfort Store", "Demo Decor House"],
        products: [
            "Cotton Bedsheet Set", "Ceramic Tea Mug", "Decorative Cushion Cover",
            "Kitchen Storage Containers", "Table Lamp", "Cotton Bath Towels",
            "Wall Clock", "Laundry Basket", "Reusable Water Bottle",
            "Serving Tray", "Door Mat", "Storage Organizer",
            "Decorative Vase", "Kitchen Apron", "Soft Throw Blanket",
        ],
    },
    {
        category: "books",
        sellers: ["Demo Book Corner", "Demo Learning Hub", "Demo Reading House"],
        products: [
            "Beginner English Workbook", "Programming Basics Guide",
            "Mathematics Practice Book", "Science Learning Workbook",
            "Computer Fundamentals Guide", "Creative Writing Journal",
            "General Knowledge Quiz Book", "Study Planner",
            "Introduction to Web Development", "Basic Accounting Workbook",
            "Vocabulary Builder", "Children's Story Collection",
            "Problem Solving Exercises", "Digital Skills Handbook",
            "Productivity and Study Notes",
        ],
    },
];

async function main() {
    const apply = process.argv.includes("--apply");

    const config = JSON.parse(
        readFileSync(
            resolve(process.cwd(), "firebase-applet-config.json"),
            "utf8",
        ),
    ) as {
        projectId?: string;
        firestoreDatabaseId?: string;
        databaseId?: string;
    };

    const projectId = config.projectId;
    const databaseId = config.firestoreDatabaseId ?? config.databaseId;

    if (projectId !== "gen-lang-client-0793173009" || !databaseId) {
        throw new Error("Firebase project/database configuration mismatch.");
    }

    const app = initializeApp({
        credential: applicationDefault(),
        projectId,
    });

    const db = getFirestore(app, databaseId);
    const batchLimit = 400;
    let batch = db.batch();
    let pending = 0;
    let written = 0;

    console.log(`Mode: ${apply ? "WRITE TO FIRESTORE" : "DRY RUN ONLY"}`);
    console.log(`Project: ${projectId}`);
    console.log(`Database: ${databaseId}`);

    for (const group of catalog) {
        console.log(`${group.category}: ${group.products.length} products`);

        for (let i = 0; i < group.products.length; i++) {
            const sellerIndex = Math.floor(i / 5);
            const number = String(i + 1).padStart(2, "0");
            const sellerNumber = String(sellerIndex + 1).padStart(2, "0");
            const productId = `demo-product-${group.category}-${number}`;

            // Clearly marked sample data, never real inventory.
            const pricePKR = 500 + ((i + 1) * 375);

            const product = {
                id: productId,
                name: `DEMO — ${group.products[i]}`,
                description:
                    "SAMPLE LISTING FOR CATALOGUE AND CHATBOT TESTING ONLY. " +
                    "This is not a real offer and is not for sale. " +
                    "No real inventory or halal certification is claimed.",
                category: group.category,
                price: pricePKR,
                pricePKR,
                stock: 0,
                sellerId: `demo-seller-${group.category}-${sellerNumber}`,
                sellerName: group.sellers[sellerIndex],
                images: [],
                rating: 0,
                numReviews: 0,
                isHalalCertified: false,
                isDemo: true,
                tags: ["demo", "sample", "chatbot-testing"],
                published: true,
                createdAt: FieldValue.serverTimestamp(),
            };

            if (apply) {
                batch.set(db.collection("products").doc(productId), product, {
                    merge: true,
                });
                pending++;
                written++;

                if (pending >= batchLimit) {
                    await batch.commit();
                    batch = db.batch();
                    pending = 0;
                }
            }
        }
    }

    if (apply && pending > 0) {
        await batch.commit();
    }

    console.log(`Total demo products: ${catalog.reduce(
        (sum, group) => sum + group.products.length,
        0,
    )}`);

    if (apply) {
        console.log(`Demo product documents written: ${written}`);
        console.log("Seed completed successfully.");
    } else {
        console.log("Nothing was written. To insert, run with --apply.");
    }
}

main().catch((error: unknown) => {
    const err = error as { code?: string; message?: string };
    console.error("Demo catalogue seed failed.");
    console.error("Error code:", err.code ?? "unknown");
    console.error("Message:", err.message ?? "No details available");
    process.exitCode = 1;
});
