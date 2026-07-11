import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function findProductId(pgClient, description) {
  if (!description) return null;
  const skuMatch = description.match(/SKU-[A-Za-z0-9-]+/i) || description.match(/GT[0-9]+/i) || description.match(/HT[A-Z0-9]+/i);
  if (skuMatch) {
    const sku = skuMatch[0].toUpperCase();
    const res = await pgClient.query('SELECT id FROM products WHERE UPPER(sku) = $1', [sku]);
    if (res.rows.length > 0) return res.rows[0].id;
  }
  const namePart = description.split('-')[0].trim();
  if (namePart) {
    const res = await pgClient.query('SELECT id FROM products WHERE LOWER(model_name) = LOWER($1)', [namePart]);
    if (res.rows.length > 0) return res.rows[0].id;
  }
  const fallbackRes = await pgClient.query('SELECT id FROM products LIMIT 1');
  return fallbackRes.rows[0]?.id || null;
}

async function main() {
  console.log("Connecting to PostgreSQL...");
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  await pgClient.connect();
  console.log("✔ Connected to Postgres.");

  console.log("Initializing Firebase...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log("Signing up user dynamically for Firestore access...");
  const email = `receipts_sync_${Date.now()}@example.com`;
  const password = "SyncPassword123!";
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  console.log("✔ Authenticated. UID:", userCredential.user.uid);

  console.log("Fetching receipts from Firestore...");
  const snapshot = await getDocs(collection(db, 'receipts'));
  console.log(`Found ${snapshot.size} receipts in Firestore.`);

  let updatedOrdersCount = 0;
  let createdOrdersCount = 0;
  let skippedOrdersCount = 0;
  const details = [];

  for (const fbDoc of snapshot.docs) {
    const receipt = fbDoc.data();
    const receiptNumber = (receipt.receiptNumber || `RT-MIG-${fbDoc.id}`).trim();

    const formatType = receipt.formatType || 'standard';
    const rawTotalAmount = Number(receipt.totalAmount || 0);
    const pendingBalance = Number(receipt.pendingBalance || 0);
    
    let advancePaid = 0;
    let totalAmount = 0;

    if (formatType === 'prebooking' || formatType === 'pre_order') {
      advancePaid = rawTotalAmount;
      totalAmount = advancePaid + pendingBalance;
    } else {
      totalAmount = rawTotalAmount;
      advancePaid = totalAmount - pendingBalance;
    }

    // Check if backing order already exists in Postgres
    const orderRes = await pgClient.query(
      "SELECT id, total_price, advance_amount, remaining_amount FROM orders WHERE idempotency_key = $1 AND deleted_at IS NULL",
      [receiptNumber]
    );

    if (orderRes.rows.length > 0) {
      const order = orderRes.rows[0];
      
      // Update pricing information
      await pgClient.query(`
        UPDATE orders 
        SET total_price = $1, advance_amount = $2, remaining_amount = $3, updated_at = NOW()
        WHERE id = $4
      `, [totalAmount, advancePaid, pendingBalance, order.id]);

      // Check if postgres receipt exists, if not insert it
      const receiptCheck = await pgClient.query("SELECT id FROM receipts WHERE receipt_number = $1", [receiptNumber]);
      if (receiptCheck.rows.length === 0) {
        const customerName = receipt.customerName || 'Unknown Customer';
        const rawPhone = receipt.customerPhone || '';
        const phone = rawPhone.trim() && rawPhone.trim() !== 'NA' ? rawPhone.trim() : `unknown_${fbDoc.id}`;
        const emailClean = `${phone.replace(/[^0-9]/g, '') || fbDoc.id}@guest.garagekings.in`.toLowerCase();
        
        let customerId;
        const custCheck = await pgClient.query('SELECT id FROM customers WHERE email = $1', [emailClean]);
        if (custCheck.rows.length > 0) {
          customerId = custCheck.rows[0].id;
        } else {
          const insertCust = await pgClient.query(`
            INSERT INTO customers (full_name, phone, instagram, address, email, city)
            VALUES ($1, $2, $3, $4, $5, 'Unknown')
            RETURNING id;
          `, [customerName, phone, receipt.customerInstagram || null, receipt.customerAddress || null, emailClean]);
          customerId = insertCust.rows[0].id;
        }

        const pdfUrl = receipt.pdfUrl || `https://gk-public-assets.s3.ap-south-1.amazonaws.com/receipts/${receiptNumber}.pdf`;
        const createdAt = receipt.createdAt ? new Date(receipt.createdAt) : new Date();

        const receiptInsertRes = await pgClient.query(`
          INSERT INTO receipts (
            receipt_number, customer_id, format_type, tax_percent, tax_amount, 
            shipping_charges, total_amount, advance_paid, pending_balance, footer_note, 
            customer_name, customer_phone, customer_instagram, customer_address, 
            created_at, order_id, pdf_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING id;
        `, [
          receiptNumber, customerId, formatType, Number(receipt.taxPercent || 0), Number(receipt.taxAmount || 0),
          Number(receipt.shippingCharges || 0), totalAmount, advancePaid, pendingBalance, receipt.footerNote || null,
          customerName, phone, receipt.customerInstagram || null, receipt.customerAddress || null,
          createdAt, order.id, pdfUrl
        ]);
        const receiptId = receiptInsertRes.rows[0].id;

        // Insert items
        const items = receipt.items || [];
        for (const item of items) {
          await pgClient.query(`
            INSERT INTO receipt_items (receipt_id, description, qty, amount)
            VALUES ($1, $2, $3, $4);
          `, [receiptId, (item.description || 'Line Item').trim(), parseInt(item.qty || item.quantity || 1, 10), Number(item.amount || 0)]);
        }

        await pgClient.query(`
          INSERT INTO receipt_generation_jobs (receipt_id, status, pdf_s3_url)
          VALUES ($1, 'Completed', $2);
        `, [receiptId, pdfUrl]);
      }

      updatedOrdersCount++;
      details.push(`Updated ${receiptNumber}: Total: ₹${totalAmount} (Paid: ₹${advancePaid}, Pending: ₹${pendingBalance})`);
    } else {
      // Order does not exist in Postgres, import it cleanly from Firebase receipt
      await pgClient.query('BEGIN');
      try {
        const customerName = receipt.customerName || 'Unknown Customer';
        const rawPhone = receipt.customerPhone || '';
        const phone = rawPhone.trim() && rawPhone.trim() !== 'NA' ? rawPhone.trim() : `unknown_${fbDoc.id}`;
        const instagram = receipt.customerInstagram || null;
        const address = receipt.customerAddress || null;
        const emailClean = `${phone.replace(/[^0-9]/g, '') || fbDoc.id}@guest.garagekings.in`.toLowerCase();

        let customerId;
        const custCheck = await pgClient.query('SELECT id FROM customers WHERE email = $1', [emailClean]);
        if (custCheck.rows.length > 0) {
          customerId = custCheck.rows[0].id;
        } else {
          const insertCust = await pgClient.query(`
            INSERT INTO customers (full_name, phone, instagram, address, email, city)
            VALUES ($1, $2, $3, $4, $5, 'Unknown')
            RETURNING id;
          `, [customerName, phone, instagram, address, emailClean]);
          customerId = insertCust.rows[0].id;
        }

        let userId;
        const userCheck = await pgClient.query('SELECT id FROM users WHERE email = $1', [emailClean]);
        if (userCheck.rows.length > 0) {
          userId = userCheck.rows[0].id;
        } else {
          const userRes = await pgClient.query(`
            INSERT INTO users (email, role, cognito_sub)
            VALUES ($1, 'Viewer', $2)
            RETURNING id;
          `, [emailClean, `guest_${customerId}`]);
          userId = userRes.rows[0].id;
        }

        const createdAt = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
        const bookingType = (formatType === 'prebooking' || formatType === 'pre_order') ? 'pre_order' : 'standard';
        
        let dbStatus = 'Confirmed';
        if (pendingBalance === 0) {
          dbStatus = 'Delivered';
        }

        const orderInsertQuery = `
          INSERT INTO orders (user_id, total_price, shipping_address, status, booking_type, advance_amount, remaining_amount, idempotency_key, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
          RETURNING id;
        `;
        const orderInsertRes = await pgClient.query(orderInsertQuery, [
          userId, totalAmount, `${address || 'No Address'} | Phone: ${phone}`, dbStatus, bookingType, advancePaid, pendingBalance, receiptNumber, createdAt
        ]);
        const orderId = orderInsertRes.rows[0].id;

        const items = receipt.items || [];
        for (const item of items) {
          const productId = await findProductId(pgClient, item.description);
          if (productId) {
            await pgClient.query(`
              INSERT INTO order_items (order_id, product_id, qty, price_at_purchase)
              VALUES ($1, $2, $3, $4);
            `, [orderId, productId, parseInt(item.qty || item.quantity || 1, 10), Number(item.amount || 0)]);
          }
        }

        const pdfUrl = receipt.pdfUrl || `https://gk-public-assets.s3.ap-south-1.amazonaws.com/receipts/${receiptNumber}.pdf`;

        const receiptInsertQuery = `
          INSERT INTO receipts (
            receipt_number, customer_id, format_type, tax_percent, tax_amount, 
            shipping_charges, total_amount, advance_paid, pending_balance, footer_note, 
            customer_name, customer_phone, customer_instagram, customer_address, 
            created_at, order_id, pdf_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING id;
        `;
        const receiptRes = await pgClient.query(receiptInsertQuery, [
          receiptNumber, customerId, formatType, Number(receipt.taxPercent || 0), Number(receipt.taxAmount || 0),
          Number(receipt.shippingCharges || 0), totalAmount, advancePaid, pendingBalance, receipt.footerNote || null,
          customerName, phone, instagram, address, createdAt, orderId, pdfUrl
        ]);
        const receiptId = receiptRes.rows[0].id;

        for (const item of items) {
          await pgClient.query(`
            INSERT INTO receipt_items (receipt_id, description, qty, amount)
            VALUES ($1, $2, $3, $4);
          `, [receiptId, (item.description || 'Line Item').trim(), parseInt(item.qty || item.quantity || 1, 10), Number(item.amount || 0)]);
        }

        await pgClient.query(`
          INSERT INTO receipt_generation_jobs (receipt_id, status, pdf_s3_url)
          VALUES ($1, 'Completed', $2);
        `, [receiptId, pdfUrl]);

        await pgClient.query('COMMIT');
        createdOrdersCount++;
        details.push(`Created ${receiptNumber}: Total: ₹${totalAmount} (Paid: ₹${advancePaid}, Pending: ₹${pendingBalance})`);
      } catch (err) {
        await pgClient.query('ROLLBACK');
        console.error(`Error importing order ${receiptNumber}:`, err);
        skippedOrdersCount++;
      }
    }
  }

  await pgClient.end();

  console.log("\n==========================================");
  console.log("  ORDER RECONCILIATION & SYNC COMPLETE");
  console.log("==========================================");
  console.log(`Orders Updated:  ${updatedOrdersCount}`);
  console.log(`Orders Created:  ${createdOrdersCount}`);
  console.log(`Orders Skipped:  ${skippedOrdersCount}`);
  console.log("==========================================");
}

main().catch(console.error);
