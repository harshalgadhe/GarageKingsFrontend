import { formatReceiptDate, parseReceiptDate } from './receiptDates.js';

export const RECEIPT_COLUMNS = [
  ['Receipt Number', 'receiptNumber', 20], ['Receipt Date', 'receiptDate', 20],
  ['Customer Name', 'customerName', 28], ['Phone', 'customerPhone', 18],
  ['Email', 'customerEmail', 28], ['Instagram', 'customerInsta', 20],
  ['Address', 'customerAddress', 34], ['Format', 'formatType', 16],
  ['Item Description', 'itemDescription', 42], ['Quantity', 'quantity', 12],
  ['Unit Amount', 'unitAmount', 16], ['Include Shipping', 'includeShipping', 18],
  ['Shipping Charges', 'shippingCharges', 18], ['Tax %', 'taxPercent', 11],
  ['Balance Due', 'pendingBalance', 16], ['Total Paid', 'totalAmount', 16],
  ['Footer Note', 'footerNote', 48],
].map(([header, key, width]) => ({ header, key, width }));

const normalizeHeader = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
const asText = value => value === null || value === undefined ? '' : String(value).trim();
const asNumber = value => {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(/[₹,]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : NaN;
};
const HEADER_ALIASES = new Map(RECEIPT_COLUMNS.flatMap(column => [
  [normalizeHeader(column.header), column.key], [normalizeHeader(column.key), column.key],
]));
[
  ['Receipt #', 'receiptNumber'],
  ['Items Summary', 'itemsSummary'],
  ['Item Count', 'itemCount'],
  ['Subtotal (₹)', 'subtotal'],
  ['Shipping (₹)', 'shippingCharges'],
  ['Total Amount Paid (₹)', 'totalAmount'],
  ['Pending Balance Due (₹)', 'pendingBalance'],
  ['Shipping Address', 'customerAddress'],
  ['Receipt Type', 'formatType'],
  ['Sale Type', 'formatType'],
].forEach(([header, key]) => HEADER_ALIASES.set(normalizeHeader(header), key));

const formatLabel = value => String(value || '').toLowerCase() === 'prebooking' ? 'Pre-Order' : 'Standard';
const normalizeFormat = value => {
  const normalized = asText(value).toLowerCase().replace(/[\s_-]+/g, '');
  return normalized.includes('prebooking') || normalized.includes('preorder') || /(^|\/)po($|\/)/.test(normalized)
    ? 'prebooking'
    : 'standard';
};
const inferFormat = (explicitValue, receiptNumber, pendingBalance) => {
  const normalizedNumber = asText(receiptNumber).toUpperCase();
  if (/(?:^|[-_])(PB|PO)(?:[-_]|$)/.test(normalizedNumber)) return 'prebooking';
  if (asText(explicitValue)) return normalizeFormat(explicitValue);
  return Number(pendingBalance) > 0 ? 'prebooking' : 'standard';
};
const asBoolean = value => typeof value === 'boolean' ? value : ['yes', 'true', '1', 'included'].includes(asText(value).toLowerCase());
const safeSheetName = value => String(value).replace(/[\\/*?:[\]]/g, ' ').slice(0, 31) || 'Receipts';

function parseLegacyItemsSummary(value) {
  const summary = asText(value);
  if (!summary) return { items: [], errors: ['Items Summary is empty.'] };
  const parts = summary.split(/\s+\|\s+/).map(part => part.trim()).filter(Boolean);
  const items = [];
  const errors = [];
  parts.forEach(part => {
    const match = part.match(/^\s*(\d+)\s*x\s+(.+?)\s*\(\s*₹?\s*(-?[\d,]+(?:\.\d+)?)\s*\)\s*$/i);
    if (!match) {
      errors.push(`Could not read item summary "${part}". Expected: 1x Item description (₹500).`);
      return;
    }
    const qty = Number(match[1]);
    const amount = asNumber(match[3]);
    const description = asText(match[2]);
    const isAdjustment = /\b(refund|adjustment|credit)\b/i.test(description);
    if (!Number.isInteger(qty) || qty <= 0 || !description || !Number.isFinite(amount) || (amount < 0 && !isAdjustment)) {
      errors.push(`Item summary "${part}" contains an invalid quantity, description or amount.`);
      return;
    }
    items.push({ qty, description, amount });
  });
  return { items, errors };
}

function parseImportedDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
  }
  const text = asText(value);
  if (!text) return new Date(NaN);
  const normalized = text.replace(/^[A-Za-z]+,\s*/, '').replace(/\s+-\s+/, ' ');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const indianDate = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i);
  if (!indianDate) return new Date(NaN);
  let hours = Number(indianDate[4] || 0);
  const meridiem = String(indianDate[6] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return new Date(Number(indianDate[3]), Number(indianDate[2]) - 1, Number(indianDate[1]), hours, Number(indianDate[5] || 0));
}

function groupReceipts(receipts, groupBy) {
  const keyFor = groupBy === 'format'
    ? receipt => formatLabel(receipt.formatType)
    : groupBy === 'month'
      ? receipt => parseReceiptDate(receipt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : null;
  if (!keyFor) return { Receipts: receipts };
  return receipts.reduce((groups, receipt) => {
    const key = keyFor(receipt);
    (groups[key] ||= []).push(receipt);
    return groups;
  }, {});
}

function receiptRows(receipt) {
  const items = Array.isArray(receipt.items) && receipt.items.length ? receipt.items : [{ description: '', qty: 1, amount: 0 }];
  return items.map(item => ({
    receiptNumber: receipt.receiptNumber || '', receiptDate: parseReceiptDate(receipt),
    customerName: receipt.customerName || '', customerPhone: receipt.customerPhone || '',
    customerEmail: receipt.customerEmail || '', customerInsta: receipt.customerInsta || receipt.customerInstagram || '',
    customerAddress: receipt.customerAddress || '', formatType: formatLabel(receipt.formatType),
    itemDescription: item.description || '', quantity: Number(item.qty || 1), unitAmount: Number(item.amount || 0),
    includeShipping: receipt.includeShipping ? 'Yes' : 'No', shippingCharges: Number(receipt.shippingCharges || 0),
    taxPercent: Number(receipt.taxPercent || 0), pendingBalance: Number(receipt.pendingBalance || 0),
    totalAmount: Number(receipt.totalAmount || 0), footerNote: receipt.footerNote || '',
  }));
}

function styleSheet(sheet) {
  sheet.columns = RECEIPT_COLUMNS;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(RECEIPT_COLUMNS.length).letter}1` };
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } };
    cell.alignment = { vertical: 'middle' };
  });
  ['unitAmount', 'shippingCharges', 'pendingBalance', 'totalAmount'].forEach(key => { sheet.getColumn(key).numFmt = '₹#,##0.00'; });
  sheet.getColumn('receiptDate').numFmt = 'dd mmm yyyy hh:mm';
  sheet.getColumn('quantity').numFmt = '0';
  sheet.getColumn('taxPercent').numFmt = '0.00';
  sheet.eachRow((row, index) => { if (index > 1) row.alignment = { vertical: 'top', wrapText: true }; });
}

function addOptionsSheet(workbook) {
  const sheet = workbook.addWorksheet('Receipt options');
  sheet.state = 'veryHidden';
  ['Standard', 'Pre-Order'].forEach((value, index) => { sheet.getCell(`A${index + 1}`).value = value; });
  ['Yes', 'No'].forEach((value, index) => { sheet.getCell(`B${index + 1}`).value = value; });
}

function addValidations(sheet, rowCount = 1000) {
  for (let row = 2; row <= rowCount; row += 1) {
    sheet.getCell(`H${row}`).dataValidation = { type: 'list', allowBlank: false, formulae: ["'Receipt options'!$A$1:$A$2"] };
    sheet.getCell(`L${row}`).dataValidation = { type: 'list', allowBlank: false, formulae: ["'Receipt options'!$B$1:$B$2"] };
  }
}

async function createWorkbook() {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GarageKings';
  workbook.created = new Date();
  return workbook;
}

async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function buildReceiptsWorkbook(receipts, { groupBy = 'none', format = 'all' } = {}) {
  const eligible = receipts.filter(receipt => receipt.status !== 'Voided' && (format === 'all' || receipt.formatType === format));
  if (!eligible.length) throw new Error('There are no matching receipts to export.');
  const workbook = await createWorkbook();
  for (const [label, records] of Object.entries(groupReceipts(eligible, groupBy))) {
    const sheet = workbook.addWorksheet(safeSheetName(label));
    sheet.columns = RECEIPT_COLUMNS;
    records.flatMap(receiptRows).forEach(row => sheet.addRow(row));
    styleSheet(sheet);
    addValidations(sheet, Math.max(1000, sheet.rowCount + 100));
  }
  addOptionsSheet(workbook);
  workbook.views = [{ activeTab: 0 }];
  return workbook;
}

export async function exportReceiptsWorkbook(receipts, options = {}) {
  const workbook = await buildReceiptsWorkbook(receipts, options);
  await downloadWorkbook(workbook, `garagekings_receipts_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function downloadReceiptImportTemplate() {
  const workbook = await createWorkbook();
  const sheet = workbook.addWorksheet('Receipt import');
  sheet.columns = RECEIPT_COLUMNS;
  const instructions = workbook.addWorksheet('Instructions');
  instructions.columns = [{ header: 'GarageKings receipt import', key: 'instruction', width: 110 }];
  [
    'Use one row per receipt item. Repeat the same Receipt Number and customer details for every item belonging to a receipt.',
    'Receipt Number, Receipt Date, Customer Name, Phone, Item Description, Quantity and Unit Amount are required. Legacy rows with a blank phone are restored as Not provided.',
    'Format accepts Standard or Pre-Order. Include Shipping accepts Yes or No.',
    'Amounts are numbers in INR. Total Paid is recalculated during import and is included only for review.',
    'Nothing is saved until you review the import and confirm in the Admin screen.',
  ].forEach(instruction => instructions.addRow({ instruction }));
  instructions.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instructions.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } };
  const common = {
    receiptNumber: 'RT-10001', receiptDate: new Date(), customerName: 'Sample Collector', customerPhone: '9876543210',
    customerEmail: 'collector@example.com', customerInsta: '@collector', customerAddress: 'Delhi', formatType: 'Standard',
    includeShipping: 'Yes', shippingCharges: 100, taxPercent: 0, pendingBalance: 0, totalAmount: 2300,
    footerNote: 'Thank you for choosing Garage Kings!',
  };
  sheet.addRow({ ...common, itemDescription: 'Mini GT sample model', quantity: 1, unitAmount: 1200 });
  sheet.addRow({ ...common, itemDescription: 'Collector protector', quantity: 2, unitAmount: 500 });
  styleSheet(sheet);
  addValidations(sheet);
  addOptionsSheet(workbook);
  workbook.views = [{ activeTab: 0 }];
  await downloadWorkbook(workbook, 'garagekings_receipt_import_template.xlsx');
}

function cellValue(cell) {
  const value = cell?.value;
  if (value && typeof value === 'object') {
    if (value.result !== undefined) return value.result;
    if (value.text !== undefined) return value.text;
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text).join('');
  }
  return value;
}

export async function readReceiptImportWorkbook(file) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets.find(candidate => !['receipt options', 'instructions'].includes(candidate.name.toLowerCase()));
  if (!sheet) throw new Error('No receipt data sheet was found.');
  const keys = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => { keys[column] = HEADER_ALIASES.get(normalizeHeader(cellValue(cell))) || ''; });
  const legacyGroupedFormat = keys.includes('itemsSummary');
  const required = ['receiptNumber', 'receiptDate', 'customerName', 'customerPhone', ...(legacyGroupedFormat ? ['itemsSummary'] : ['itemDescription', 'quantity', 'unitAmount'])];
  const missing = required.filter(key => !keys.includes(key));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}.`);

  const groups = new Map();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = {};
    keys.forEach((key, column) => { if (key) values[key] = cellValue(row.getCell(column)); });
    if (!Object.values(values).some(value => asText(value))) return;
    const receiptNumber = asText(values.receiptNumber);
    const key = receiptNumber.toLowerCase() || `missing-${rowNumber}`;
    const group = groups.get(key) || { firstRow: rowNumber, values, items: [], errors: [] };
    if (legacyGroupedFormat) {
      const parsed = parseLegacyItemsSummary(values.itemsSummary);
      group.errors.push(...parsed.errors.map(error => `Row ${rowNumber}: ${error}`));
      group.items.push(...parsed.items);
    } else {
      const qty = asNumber(values.quantity);
      const amount = asNumber(values.unitAmount);
      const description = asText(values.itemDescription);
      if (!description) group.errors.push(`Row ${rowNumber}: Item Description is required.`);
      if (!Number.isInteger(qty) || qty <= 0) group.errors.push(`Row ${rowNumber}: Quantity must be a positive whole number.`);
      if (!Number.isFinite(amount) || amount < 0) group.errors.push(`Row ${rowNumber}: Unit Amount must be zero or greater.`);
      group.items.push({ qty: Number.isFinite(qty) ? qty : 0, amount: Number.isFinite(amount) ? amount : 0, description });
    }
    groups.set(key, group);
  });

  return Array.from(groups.values()).map(group => {
    const values = group.values;
    const errors = [...new Set(group.errors)];
    const receiptNumber = asText(values.receiptNumber);
    const customerName = asText(values.customerName);
    const customerPhone = asText(values.customerPhone) || 'Not provided';
    const date = parseImportedDate(values.receiptDate);
    if (!receiptNumber) errors.push(`Row ${group.firstRow}: Receipt Number is required.`);
    if (!customerName) errors.push(`Row ${group.firstRow}: Customer Name is required.`);
    if (Number.isNaN(date.getTime())) errors.push(`Row ${group.firstRow}: Receipt Date is invalid.`);
    const includeShipping = asBoolean(values.includeShipping);
    const shippingCharges = includeShipping ? asNumber(values.shippingCharges) : 0;
    const taxPercent = asNumber(values.taxPercent);
    const pendingBalance = asNumber(values.pendingBalance);
    if (![shippingCharges, taxPercent, pendingBalance].every(Number.isFinite)) errors.push(`Row ${group.firstRow}: One or more amounts are invalid.`);
    const itemsSubtotal = group.items.reduce((sum, item) => sum + item.qty * item.amount, 0);
    const subtotal = itemsSubtotal + (Number.isFinite(shippingCharges) ? shippingCharges : 0);
    const totalAmount = subtotal + subtotal * ((Number.isFinite(taxPercent) ? taxPercent : 0) / 100);
    const formatType = inferFormat(values.formatType, receiptNumber, pendingBalance);
    const receipt = {
      receiptNumber, receiptDate: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
      dateString: Number.isNaN(date.getTime()) ? '' : formatReceiptDate(date), companyName: 'Garage Kings India', companyLocation: 'Delhi',
      customerName, customerPhone, customerEmail: asText(values.customerEmail), customerInsta: asText(values.customerInsta),
      customerInstagram: asText(values.customerInsta), customerAddress: asText(values.customerAddress), items: group.items,
      includeShipping, shippingCharges: Number.isFinite(shippingCharges) ? shippingCharges : 0,
      taxPercent: Number.isFinite(taxPercent) ? taxPercent : 0, taxAmount: totalAmount - subtotal, totalAmount,
      formatType, advancePaid: totalAmount, pendingBalance: formatType === 'prebooking' && Number.isFinite(pendingBalance) ? pendingBalance : 0,
      footerNote: asText(values.footerNote) || 'Thank you for choosing Garage Kings!',
    };
    return { rowNumber: group.firstRow, receipt, errors };
  });
}
