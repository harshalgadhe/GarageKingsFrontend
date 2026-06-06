import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, startAfter, orderBy } from 'firebase/firestore';
import pkg from 'pg';
const { Pool } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize reporting metrics
const report = {
  productsImported: 0,
  failedImports: 0,
  duplicatesDetected: 0,
  inventoryCreated: 0,
  imagesCreated: 0,
  startedAt: new Date().toISOString(),
  details: [] // Mapped records for CSV output
};

async function runProductionMigration() {
  console.log("==================================================");
  console.log("GARAGEKINGS PRODUCTION RELATIONAL MIGRATION PIPELINE");
  console.log(`Started at: ${report.startedAt}`);
  console.log("==================================================");

  // 1. Initialize Firestore & PG Client Pool
  const fbApp = initializeApp(firebaseConfig);
  const firestore = getFirestore(fbApp);
  
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  const pgClient = await pgPool.connect();
  console.log("✔ Connected to PostgreSQL Client Pool successfully.");

  // Image deduplication map: tracking image URLs to prevent duplicates
  const processedImages = new Set();

  try {
    let lastVisibleDoc = null;
    let hasMore = true;
    const batchSize = 100;
    let batchIndex = 1;

    // Outer batch processing loop
    while (hasMore) {
      console.log(`\nProcessing Batch #${batchIndex}...`);
      
      // Query Firestore collection using pagination limits
      let fbQuery = query(
        collection(firestore, 'cars'),
        orderBy('createdAt'),
        limit(batchSize)
      );

      if (lastVisibleDoc) {
        fbQuery = query(
          collection(firestore, 'cars'),
          orderBy('createdAt'),
          startAfter(lastVisibleDoc),
          limit(batchSize)
        );
      }

      const snapshot = await getDocs(fbQuery);
      if (snapshot.empty) {
        console.log("✔ No more items found in Firestore.");
        hasMore = false;
        break;
      }

      console.log(`Loaded ${snapshot.size} records from Firestore. Processing transaction blocks...`);
      lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

      // Process each record inside a transaction-safe block
      for (const fbDoc of snapshot.docs) {
        const car = fbDoc.data();
        const sku = car.sku || `SKU-FS-${fbDoc.id}`;

        // START TRANSACTION FOR THIS SPECIFIC CASTING ROW
        await pgClient.query('BEGIN');

        try {
          // A. Check for duplicate products using SKU conflict filters
          const dupCheck = await pgClient.query(
            'SELECT id FROM products WHERE sku = $1',
            [sku]
          );

          if (dupCheck.rows.length > 0) {
            report.duplicatesDetected++;
            report.details.push({
              id: fbDoc.id,
              sku,
              status: 'DUPLICATE',
              error: 'SKU conflict detected'
            });
            await pgClient.query('ROLLBACK');
            continue;
          }

          // B. Insert Product Core metadata
          const productInsertQuery = `
            INSERT INTO products (brand, model_name, series, scale, rarity_level, base_price, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
          `;
          const productValues = [
            car.brand || 'MINI GT',
            car.modelName || car.name || 'Unknown Casting',
            car.series || 'Collector Series',
            car.scale || '1:64',
            car.rarity || 'Standard Edition',
            Number(car.price || 0),
            car.description || 'Premium collector die-cast model.'
          ];

          const productResult = await pgClient.query(productInsertQuery, productValues);
          const productId = productResult.rows[0].id;

          // C. Image Deduplication & Relational Mapping
          if (car.image) {
            const imageUrl = car.image.trim();
            if (!processedImages.has(imageUrl)) {
              const imageInsertQuery = `
                INSERT INTO product_images (product_id, thumbnail_url, medium_url, full_url, is_primary)
                VALUES ($1, $2, $3, $4, $5);
              `;
              // Map primary and medium variants to the uploaded source URL for V1
              await pgClient.query(imageInsertQuery, [productId, imageUrl, imageUrl, imageUrl, true]);
              processedImages.add(imageUrl);
              report.imagesCreated++;
            } else {
              console.log(`[Dedupe Alert] Image URL already exists in database. Mapping skipped.`);
            }
          }

          // D. Initialize Inventory tracking quantities
          const inventoryInsertQuery = `
            INSERT INTO inventory (product_id, quantity_available, quantity_reserved, warehouse_shelf_location)
            VALUES ($1, $2, $3, $4);
          `;
          await pgClient.query(inventoryInsertQuery, [
            productId,
            Number(car.quantity || car.stock || 10),
            0,
            car.shelfLocation || 'Shelf-A1'
          ]);

          // E. Record initial Inventory Transaction log
          const inventoryTxQuery = `
            INSERT INTO inventory_transactions (product_id, type, quantity_changed, reason, admin_user_id)
            VALUES ($1, $2, $3, $4, $5);
          `;
          await pgClient.query(inventoryTxQuery, [
            productId,
            'Added',
            Number(car.quantity || car.stock || 10),
            'Automated Firebase to PostgreSQL RDS migrationRestock',
            null
          ]);

          // COMMIT TRANSACTION IF ALL COMMITTED
          await pgClient.query('COMMIT');
          report.productsImported++;
          report.inventoryCreated++;

          report.details.push({
            id: fbDoc.id,
            sku,
            status: 'SUCCESS',
            error: ''
          });

        } catch (innerError) {
          // ROLLBACK TRANSACTION ON EXCEPTION TO KEEP STATE IMMUTABLE
          await pgClient.query('ROLLBACK');
          report.failedImports++;
          console.error(`❌ Transaction failed for Document ID: ${fbDoc.id}. Rollback executed.`, innerError);
          report.details.push({
            id: fbDoc.id,
            sku,
            status: 'FAILED',
            error: innerError.message
          });
        }
      }

      if (snapshot.size < batchSize) {
        hasMore = false;
        break;
      }
      batchIndex++;
    }

    console.log("\n✔ Firestore processing completed. Generating CSV report...");
    generateReportCSV();

  } catch (error) {
    console.error("Critical error in migration pipeline:", error);
  } finally {
    pgClient.release();
    await pgPool.end();
    console.log("\nMigration script complete.");
  }
}

function generateReportCSV() {
  const headers = ['document_id', 'sku', 'import_status', 'error_log'];
  const csvRows = [headers.join(',')];

  for (const record of report.details) {
    const row = [
      record.id,
      record.sku,
      record.status,
      `"${record.error.replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const reportPath = path.join(process.cwd(), 'migration_report.csv');
  fs.writeFileSync(reportPath, csvContent, 'utf-8');

  console.log("==================================================");
  console.log("MIGRATION SUMMARY REPORT");
  console.log("==================================================");
  console.log(`Products Imported Successfully: ${report.productsImported}`);
  console.log(`Inventory Records Created:      ${report.inventoryCreated}`);
  console.log(`Images Created/Mapped:          ${report.imagesCreated}`);
  console.log(`Failed Imports Rolled Back:    ${report.failedImports}`);
  console.log(`Duplicate SKU Skips:           ${report.duplicatesDetected}`);
  console.log(`Report CSV File Exported:       ${reportPath}`);
  console.log("==================================================");
}

runProductionMigration().catch(console.error);
