# Future Product Roadmap

This document outlines planned improvements, architectural scaling steps, and future feature integrations for GarageKings.

---

## 1. Inventory & Physical Audits (Next Up)
- **Cycle Count Audits**: Building interactive interfaces to perform physical cycle count validation against catalog batch values, calculating variances and recording ledger adjustments.
- **Barcoding & Labeling**: Interfacing with mobile barcode scanners to scan received models directly on the shelf and receive inventory batches automatically.

---

## 2. Multi-Warehouse Logistics
- **Warehouse Routing**: Expanding the inventory schema to support multiple physical warehouse hub locations.
- **Inter-Warehouse Transfers**: Logging ledger transfer entries to track stocks moving between locations.

---

## 3. Automation Pipeline
- **Auto PO Reordering**: Setting min-stock thresholds in global settings to automatically generate draft Purchase Orders for distributors.
- **AWS SQS Integration**: Moving PDF invoice creation and email generation to SQS queues with dedicated Lambda workers.
