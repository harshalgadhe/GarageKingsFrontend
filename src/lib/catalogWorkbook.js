const COLUMNS = [
  { header: 'Model ID', key: 'sku', width: 18 },
  { header: 'Brand', key: 'brand', width: 22 },
  { header: 'Model name', key: 'name', width: 42 },
  { header: 'Series', key: 'series', width: 24 },
  { header: 'Scale', key: 'scale', width: 12 },
  { header: 'Packaging', key: 'casingType', width: 16 },
  { header: 'Price', key: 'price', width: 14 },
  { header: 'Purchase price', key: 'purchasePrice', width: 16 },
  { header: 'Stock', key: 'availableStock', width: 12 },
  { header: 'Pre-booking', key: 'isPrebook', width: 14 },
  { header: 'Deposit', key: 'prebookDepositAmount', width: 14 },
  { header: 'Arrival date', key: 'arrivalDate', width: 18 },
  { header: 'Release date', key: 'releaseDate', width: 18 },
  { header: 'Expected arrival', key: 'customerEta', width: 20 },
  { header: 'Category', key: 'category', width: 18 },
  { header: 'Rarity', key: 'tag', width: 18 },
  { header: 'Tags', key: 'tags', width: 32 },
  { header: 'Supplier', key: 'supplier', width: 24 },
  { header: 'Maximum per customer', key: 'maxQtyPerCustomer', width: 22 },
  { header: 'Description', key: 'description', width: 48 },
  { header: 'Show on homepage', key: 'showOnHomepage', width: 20 },
  { header: 'Featured', key: 'isFeatured', width: 14 },
];

const HEADER_ALIASES = {
  'model id': 'sku', 'model id (sku)': 'sku', 'sku id': 'sku', sku: 'sku', 'product code': 'sku', 'reference number': 'sku',
  brand: 'brand', 'model name': 'name', name: 'name', product: 'name',
  series: 'series', scale: 'scale', packaging: 'casingType', casing: 'casingType',
  price: 'price', 'selling price': 'price', 'purchase price': 'purchasePrice', 'cost price': 'purchasePrice', stock: 'availableStock', quantity: 'availableStock',
  'pre-booking': 'isPrebook', prebooking: 'isPrebook', 'pre booking': 'isPrebook',
  deposit: 'prebookDepositAmount', 'po deposit': 'prebookDepositAmount',
  'arrival date': 'arrivalDate', 'release date': 'releaseDate', 'expected arrival': 'customerEta', eta: 'customerEta',
  category: 'category', rarity: 'tag', tag: 'tag', tags: 'tags', supplier: 'supplier',
  'maximum per customer': 'maxQtyPerCustomer', 'max per customer': 'maxQtyPerCustomer', description: 'description',
  'show on homepage': 'showOnHomepage', featured: 'isFeatured',
};

function text(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (typeof value.hyperlink === 'string') return value.hyperlink.trim();
    if (value.result !== undefined) return text(value.result);
    if (Array.isArray(value.richText)) return value.richText.map(part => part?.text || '').join('').trim();
    if (typeof value.text === 'string') return value.text.trim();
  }
  return String(value).trim();
}

function listValue(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return text(value).split(/[;\n,]+/).map(item => item.trim()).filter(Boolean);
}

function booleanValue(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const normalized = text(value).toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0'].includes(normalized)) return false;
  return fallback;
}

function dateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? text(value) : parsed.toISOString().slice(0, 10);
}

function normalizeRow(raw, rowNumber) {
  const providedFields = Object.keys(raw).filter(key => text(raw[key]) !== '');
  const price = Number(raw.price ?? 0);
  const purchasePrice = Number(raw.purchasePrice ?? 0);
  const stock = Number(raw.availableStock ?? 0);
  const deposit = Number(raw.prebookDepositAmount ?? 0);
  const isPrebook = booleanValue(raw.isPrebook);
  const tags = listValue(raw.tags);
  const maxQty = text(raw.maxQtyPerCustomer) ? Number(raw.maxQtyPerCustomer) : null;
  const product = {
    sku: text(raw.sku).toUpperCase(),
    brand: text(raw.brand),
    name: text(raw.name),
    series: text(raw.series),
    scale: text(raw.scale) || '1:64',
    casingType: text(raw.casingType) || 'Box',
    price,
    sellingPrice: price,
    purchasePrice,
    availableStock: stock,
    totalStock: stock,
    isPrebook,
    prebookDepositAmount: deposit,
    arrivalDate: dateValue(raw.arrivalDate),
    releaseDate: dateValue(raw.releaseDate),
    customerEta: dateValue(raw.customerEta) || text(raw.customerEta) || null,
    category: text(raw.category) || 'Die-cast',
    tag: text(raw.tag) || null,
    tags,
    subtags: tags,
    supplier: text(raw.supplier),
    maxQtyPerCustomer: maxQty,
    description: text(raw.description),
    image: null,
    images: [],
    showOnHomepage: booleanValue(raw.showOnHomepage, true),
    isFeatured: booleanValue(raw.isFeatured, false),
    status: isPrebook ? 'Pre-Order' : 'Published',
  };
  const errors = [];
  if (!product.sku) errors.push('Model ID is required');
  if (!product.brand) errors.push('Brand is required');
  if (!product.name) errors.push('Model name is required');
  if (!Number.isFinite(price) || price < 0) errors.push('Price must be zero or greater');
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) errors.push('Purchase price must be zero or greater');
  if (!Number.isInteger(stock) || stock < 0) errors.push('Stock must be a whole number zero or greater');
  if (!Number.isFinite(deposit) || deposit < 0) errors.push('Deposit must be zero or greater');
  if (isPrebook && deposit > price) errors.push('Deposit cannot exceed price');
  if (maxQty !== null && (!Number.isInteger(maxQty) || maxQty < 1)) errors.push('Maximum per customer must be a positive whole number');
  return { rowNumber, product, errors, providedFields };
}

export async function readCatalogWorkbook(file) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The workbook does not contain a worksheet.');
  const headers = {};
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    const key = HEADER_ALIASES[text(cell.value).toLowerCase()];
    if (key) headers[columnNumber] = key;
  });
  for (const required of ['sku', 'brand', 'name']) {
    if (!Object.values(headers).includes(required)) throw new Error(`Missing required column: ${COLUMNS.find(c => c.key === required)?.header}`);
  }
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = {};
    Object.entries(headers).forEach(([columnNumber, key]) => { raw[key] = row.getCell(Number(columnNumber)).value; });
    if (Object.values(raw).every(value => text(value) === '')) return;
    rows.push(normalizeRow(raw, rowNumber));
  });
  return rows;
}

function styleSheet(sheet) {
  sheet.columns = COLUMNS;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + COLUMNS.length)}1` };
  const header = sheet.getRow(1);
  header.height = 28;
  header.font = { bold: true, color: { argb: 'FFF4F1EC' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171512' } };
  header.alignment = { vertical: 'middle' };
  sheet.getColumn('price').numFmt = '₹#,##0.00';
  sheet.getColumn('purchasePrice').numFmt = '₹#,##0.00';
  sheet.getColumn('prebookDepositAmount').numFmt = '₹#,##0.00';
  sheet.getColumn('availableStock').numFmt = '0';
}

async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadCatalogTemplate(lookups = {}) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Catalog import');
  styleSheet(sheet);
  sheet.addRow({
    sku: 'GT1143', brand: lookups.brands?.[0] || '', name: 'Porsche 911 GT3 R',
    series: lookups.series?.[0] || '', scale: lookups.scales?.[0] || '',
    casingType: lookups.casingTypes?.[0] || '', price: 2200, purchasePrice: 1800,
    availableStock: 1, isPrebook: 'No', prebookDepositAmount: 0,
    category: lookups.categories?.[0] || '', tags: '', showOnHomepage: 'Yes', isFeatured: 'No'
  });
  const lookupSheet = workbook.addWorksheet('Catalog options', { state: 'veryHidden' });
  const lookupColumns = [
    ['Brands', lookups.brands], ['Scales', lookups.scales], ['Packaging', lookups.casingTypes],
    ['Categories', lookups.categories], ['Series', lookups.series], ['Tags', lookups.tags],
  ];
  lookupColumns.forEach(([header, values], index) => {
    const column = index + 1;
    lookupSheet.getCell(1, column).value = header;
    (Array.isArray(values) ? values : []).forEach((value, rowIndex) => { lookupSheet.getCell(rowIndex + 2, column).value = value; });
  });
  const validationColumns = [
    ['brand', 1, lookups.brands], ['scale', 2, lookups.scales], ['casingType', 3, lookups.casingTypes],
    ['category', 4, lookups.categories], ['series', 5, lookups.series], ['tag', 6, lookups.tags],
  ];
  validationColumns.forEach(([key, lookupColumn, values]) => {
    if (!Array.isArray(values) || values.length === 0) return;
    const targetColumn = COLUMNS.findIndex(column => column.key === key) + 1;
    const letter = String.fromCharCode(64 + lookupColumn);
    for (let row = 2; row <= 1000; row += 1) {
      sheet.getCell(row, targetColumn).dataValidation = {
        type: 'list', allowBlank: key !== 'brand',
        formulae: [`'Catalog options'!$${letter}$2:$${letter}$${values.length + 1}`],
        showErrorMessage: true, errorTitle: 'Choose a catalog option', error: `Select ${key} from the dropdown list.`,
      };
    }
  });
  const notes = workbook.addWorksheet('Instructions');
  notes.columns = [{ width: 26 }, { width: 90 }];
  notes.addRows([
    ['Rule', 'Details'],
    ['Required fields', 'Model ID, Brand and Model name.'],
    ['Model ID', 'Must be unique. Existing products are skipped during import.'],
    ['Boolean fields', 'Use Yes or No for Pre-booking and Show on homepage.'],
    ['Images', 'Images are intentionally not imported from Excel. Create the product first, then upload one or more images from its Admin edit screen.'],
    ['Safety', 'The import preview must be confirmed before products are created.'],
  ]);
  notes.getRow(1).font = { bold: true };
  await downloadWorkbook(workbook, 'GarageKings-catalog-import-template.xlsx');
}

export async function exportCatalogWorkbook(products) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Catalog');
  styleSheet(sheet);
  products.forEach(product => {
    sheet.addRow({
    sku: product.sku,
    brand: product.brand,
    name: product.name,
    series: product.series,
    scale: product.scale,
    casingType: product.casing || product.casingType,
    price: Number(product.price ?? product.sellingPrice ?? 0),
    purchasePrice: Number(product.purchasePrice ?? product.purchase_price ?? 0),
    availableStock: Number(product.availableStock ?? product.totalStock ?? 0),
    isPrebook: product.isPrebook ? 'Yes' : 'No',
    prebookDepositAmount: Number(product.prebookDepositAmount ?? product.poAmount ?? 0),
    arrivalDate: dateValue(product.arrivalDate),
    releaseDate: dateValue(product.releaseDate),
    customerEta: product.customerEta,
    category: product.category,
    tag: product.tag || product.grade || product.lane,
    tags: Array.isArray(product.tags) ? product.tags.join('; ') : product.tags,
    supplier: product.supplier,
    maxQtyPerCustomer: product.maxQtyPerCustomer,
    description: product.description,
    showOnHomepage: product.showOnHomepage ? 'Yes' : 'No',
    isFeatured: product.isFeatured ? 'Yes' : 'No',
  });
  });
  await downloadWorkbook(workbook, `GarageKings-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
