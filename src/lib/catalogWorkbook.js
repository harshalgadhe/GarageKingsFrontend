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
  { header: 'Cover image URL', key: 'image', width: 52 },
  { header: 'All image URLs', key: 'images', width: 72 },
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
  'cover image url': 'image', 'primary image url': 'image', 'image url': 'image', image: 'image',
  'all image urls': 'images', 'image urls': 'images', images: 'images', 'gallery image urls': 'images',
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
  const coverImage = text(raw.image);
  const imageReferences = Array.from(new Set([coverImage, ...listValue(raw.images)].filter(Boolean)));
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
    image: imageReferences[0] || null,
    images: imageReferences,
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
  imageReferences.forEach((url, index) => {
    if (/^(data:|blob:)/i.test(url)) errors.push(`${index === 0 ? 'Cover image' : `Image ${index + 1}`} must be a persistent S3, CDN or API URL`);
  });
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
  const lookupSheet = workbook.worksheets.find(candidate => candidate.name.toLowerCase() === 'catalog options');
  const lookupHeaderKeys = {
    brands: 'brands', scales: 'scales', packaging: 'casingTypes', categories: 'categories',
    series: 'series', rarity: 'tags', suppliers: 'suppliers',
  };
  const embeddedLookups = {};
  if (lookupSheet) {
    lookupSheet.getRow(1).eachCell((cell, columnNumber) => {
      const key = lookupHeaderKeys[text(cell.value).toLowerCase()];
      if (!key) return;
      const values = [];
      for (let row = 2; row <= lookupSheet.rowCount; row += 1) {
        const value = text(lookupSheet.getCell(row, columnNumber).value);
        if (value) values.push(value);
      }
      embeddedLookups[key] = Array.from(new Set(values));
    });
    const rowLookupFields = {
      brands: 'brand', scales: 'scale', casingTypes: 'casingType', categories: 'category',
      series: 'series', tags: 'tag', suppliers: 'supplier',
    };
    Object.entries(rowLookupFields).forEach(([lookupKey, productKey]) => {
      const values = [...(embeddedLookups[lookupKey] || []), ...rows.map(row => text(row.product?.[productKey])).filter(Boolean)];
      embeddedLookups[lookupKey] = Array.from(new Map(values.map(value => [value.toLocaleLowerCase(), value])).values());
    });
    const usedTags = rows.flatMap(row => Array.isArray(row.product?.tags) ? row.product.tags : []).map(text).filter(Boolean);
    embeddedLookups.tags = Array.from(new Map([...(embeddedLookups.tags || []), ...usedTags]
      .map(value => [value.toLocaleLowerCase(), value])).values());
  }
  rows.embeddedLookups = embeddedLookups;
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
  sheet.getColumn('description').alignment = { vertical: 'top', wrapText: true };
  sheet.getColumn('image').alignment = { vertical: 'top', wrapText: true };
  sheet.getColumn('images').alignment = { vertical: 'top', wrapText: true };
}

function imageReference(image) {
  if (typeof image === 'string') return text(image);
  if (!image || typeof image !== 'object') return '';
  return text(image.fullUrl || image.url || image.src || image.mediumUrl || image.thumbnailUrl);
}

function productImageReferences(product) {
  const references = [product.image];
  if (Array.isArray(product.images)) references.push(...product.images);
  const variants = [
    ...(Array.isArray(product.variants) ? product.variants : []),
    ...(Array.isArray(product.caseVariants) ? product.caseVariants : []),
  ];
  variants.forEach(variant => {
    references.push(variant?.image);
    if (Array.isArray(variant?.images)) references.push(...variant.images);
  });
  return Array.from(new Set(references.map(imageReference).filter(Boolean)));
}

function addCatalogOptions(workbook, sheet, lookups = {}, validationEndRow = 1000) {
  const lookupSheet = workbook.addWorksheet('Catalog options', { state: 'veryHidden' });
  const lookupColumns = [
    ['Brands', lookups.brands],
    ['Scales', lookups.scales],
    ['Packaging', lookups.casingTypes],
    ['Categories', lookups.categories],
    ['Series', lookups.series],
    ['Rarity', lookups.tags],
    ['Suppliers', lookups.suppliers],
    ['Yes or No', ['Yes', 'No']],
  ];

  const normalizedColumns = lookupColumns.map(([header, values]) => [
    header,
    Array.from(new Set((Array.isArray(values) ? values : [])
      .map(value => text(value))
      .filter(Boolean)))
      .sort((left, right) => left.localeCompare(right)),
  ]);

  normalizedColumns.forEach(([header, values], index) => {
    const column = index + 1;
    lookupSheet.getCell(1, column).value = header;
    values.forEach((value, rowIndex) => { lookupSheet.getCell(rowIndex + 2, column).value = value; });
  });

  const validationColumns = [
    ['brand', 1, lookups.brands, false],
    ['scale', 2, lookups.scales, true],
    ['casingType', 3, lookups.casingTypes, true],
    ['category', 4, lookups.categories, true],
    ['series', 5, lookups.series, true],
    ['tag', 6, lookups.tags, true],
    ['supplier', 7, lookups.suppliers, true],
    ['isPrebook', 8, ['Yes', 'No'], false],
    ['showOnHomepage', 8, ['Yes', 'No'], false],
    ['isFeatured', 8, ['Yes', 'No'], false],
  ];

  validationColumns.forEach(([key, lookupColumn, sourceValues, allowBlank]) => {
    const values = normalizedColumns[lookupColumn - 1]?.[1] || [];
    if (!Array.isArray(sourceValues) || values.length === 0) return;
    const targetColumn = COLUMNS.findIndex(column => column.key === key) + 1;
    const letter = String.fromCharCode(64 + lookupColumn);
    const optionRange = `'Catalog options'!$${letter}$2:$${letter}$${values.length + 1}`;
    for (let row = 2; row <= validationEndRow; row += 1) {
      sheet.getCell(row, targetColumn).dataValidation = {
        type: 'list',
        allowBlank,
        formulae: [optionRange],
        showInputMessage: true,
        promptTitle: COLUMNS[targetColumn - 1].header,
        prompt: 'Choose a value from the dropdown.',
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Choose an available option',
        error: `Select ${COLUMNS[targetColumn - 1].header.toLowerCase()} from the dropdown list.`,
      };
    }
  });
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
    category: lookups.categories?.[0] || '', tags: '', image: '', images: '', showOnHomepage: 'Yes', isFeatured: 'No'
  });
  addCatalogOptions(workbook, sheet, lookups);
  const notes = workbook.addWorksheet('Instructions');
  notes.columns = [{ width: 26 }, { width: 90 }];
  notes.addRows([
    ['Rule', 'Details'],
    ['Required fields', 'Model ID, Brand and Model name.'],
    ['Model ID', 'Must be unique. Existing products are skipped during import.'],
    ['Boolean fields', 'Use Yes or No for Pre-booking and Show on homepage.'],
    ['Images', 'Cover image URL is the first image shown. Put every persistent S3, CDN or /api/v1/images reference in All image URLs, separated by semicolons or new lines. Binary image files are not embedded.'],
    ['Backup restore', 'A full catalog export includes image references. Import it in Add new and update existing mode to restore products and reconnect their existing S3 images.'],
    ['Safety', 'The import preview must be confirmed before products are created.'],
  ]);
  notes.getRow(1).font = { bold: true };
  await downloadWorkbook(workbook, 'GarageKings-catalog-import-template.xlsx');
}

export async function buildCatalogWorkbook(products, lookups = {}) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Catalog');
  styleSheet(sheet);
  products.forEach(product => {
    const imageReferences = productImageReferences(product);
    const row = sheet.addRow({
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
      image: imageReferences[0] || '',
      images: imageReferences.join('; '),
      showOnHomepage: product.showOnHomepage ? 'Yes' : 'No',
      isFeatured: product.isFeatured ? 'Yes' : 'No',
    });
    if (imageReferences.length > 1 || product.description) row.height = 44;
  });
  const productLookupFields = {
    brands: 'brand', scales: 'scale', casingTypes: 'casing', categories: 'category',
    series: 'series', tags: 'tag', suppliers: 'supplier',
  };
  const backupLookups = Object.fromEntries(Object.entries(productLookupFields).map(([lookupKey, productKey]) => {
    const configured = lookups[lookupKey] || [];
    const used = products.map(product => product[productKey] || (productKey === 'casing' ? product.casingType : '')).filter(Boolean);
    const values = [...configured, ...used];
    return [lookupKey, Array.from(new Map(values.map(value => [String(value).trim().toLocaleLowerCase(), String(value).trim()])).values())];
  }));
  const productTags = products.flatMap(product => Array.isArray(product.tags) ? product.tags : [])
    .map(value => String(value || '').trim())
    .filter(Boolean);
  backupLookups.tags = Array.from(new Map([...(backupLookups.tags || []), ...productTags]
    .map(value => [value.toLocaleLowerCase(), value])).values());
  addCatalogOptions(workbook, sheet, backupLookups, Math.max(1000, products.length + 250));
  return workbook;
}

export async function exportCatalogWorkbook(products, lookups = {}) {
  const workbook = await buildCatalogWorkbook(products, lookups);
  await downloadWorkbook(workbook, `GarageKings-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
