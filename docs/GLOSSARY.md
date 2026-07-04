# GarageKings Domain Glossary

This glossary defines standard business and technical terminology used across the GarageKings codebase and documentation.

---

- **Casting**: A specific die-cast model car design (e.g. `Nissan Skyline GT-R R34`). In the database, this maps to a unique catalog product.
- **SKU (Stock Keeping Unit)**: The unique canonical identifier for a casting model.
- **Inventory Batch**: A single shipment of physical stock received from a distributor. Tracks specific purchase costs, dates, and available counts.
- **FIFO (First-In, First-Out)**: The accounting rule where stock is depleted from the oldest batch first, securing historical cost accuracy.
- **Pre-order / Pre-booking**: A purchase order placed for a model not yet in stock, requiring a deposit advance and remaining balance.
- **Inventory Ledger**: The append-only, immutable record tracking every stock receive, reserve, sale, and adjustment.
- **Founder Split**: The division of net profits and expenses among the GarageKings founders.
