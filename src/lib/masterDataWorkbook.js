const MASTER_DATA_SHEETS = {
  brands: {
    sheetName: 'Brands',
    columns: [
      ['Record ID', 'id', 38], ['Name', 'name', 24], ['Slug', 'slug', 24],
      ['Logo URL', 'logoUrl', 52], ['Cover image URL', 'coverImageUrl', 52], ['Website', 'website', 34],
      ['Display order', 'displayOrder', 16], ['Visible', 'isVisible', 12], ['Status', 'status', 14],
      ['Accent color', 'accentColor', 16], ['Secondary color', 'secondaryColor', 18], ['Background color', 'backgroundColor', 18],
      ['Theme', 'themeVariant', 16], ['Logo treatment', 'logoTreatment', 18], ['Short label', 'kicker', 28],
      ['Headline', 'headline', 42], ['Description', 'description', 58], ['Origin', 'originLabel', 24],
      ['Collector focus', 'styleLabel', 28],
    ],
  },
  scales: {
    sheetName: 'Scales',
    columns: [['Record ID', 'id', 38], ['Name', 'name', 24], ['Display order', 'displayOrder', 16], ['Status', 'status', 14]],
  },
  series: {
    sheetName: 'Series',
    columns: [['Record ID', 'id', 38], ['Name', 'name', 36], ['Display order', 'displayOrder', 16], ['Status', 'status', 14]],
  },
};

const SNAKE_KEYS = {
  logoUrl: 'logo_url', coverImageUrl: 'cover_image_url', displayOrder: 'display_order', isVisible: 'is_visible',
  accentColor: 'accent_color', secondaryColor: 'secondary_color', backgroundColor: 'background_color',
  themeVariant: 'theme_variant', logoTreatment: 'logo_treatment', originLabel: 'origin_label', styleLabel: 'style_label',
};

const HEADER_ALIASES = {
  'record id': 'id', id: 'id', name: 'name', slug: 'slug', 'logo url': 'logoUrl',
  'cover image url': 'coverImageUrl', 'cover url': 'coverImageUrl', website: 'website',
  'display order': 'displayOrder', order: 'displayOrder', visible: 'isVisible', status: 'status',
  'accent color': 'accentColor', 'secondary color': 'secondaryColor', 'background color': 'backgroundColor',
  theme: 'themeVariant', 'theme variant': 'themeVariant', 'logo treatment': 'logoTreatment',
  'short label': 'kicker', kicker: 'kicker', headline: 'headline', description: 'description',
  origin: 'originLabel', 'origin label': 'originLabel', 'collector focus': 'styleLabel', 'style label': 'styleLabel',
};

function text(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (typeof value.hyperlink === 'string') return value.hyperlink.trim();
    if (value.result !== undefined) return text(value.result);
    if (Array.isArray(value.richText)) return value.richText.map(part => part?.text || '').join('').trim();
    if (typeof value.text === 'string') return value.text.trim();
  }
  return String(value).trim();
}

function booleanValue(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  const normalized = text(value).toLowerCase();
  if (['yes', 'y', 'true', '1', 'visible'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0', 'hidden'].includes(normalized)) return false;
  return fallback;
}

function recordValue(record, key) {
  if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
  const snake = SNAKE_KEYS[key];
  return snake ? record?.[snake] : undefined;
}

function normalizedRecord(type, record = {}) {
  const base = {
    id: text(recordValue(record, 'id')),
    name: text(recordValue(record, 'name')),
    displayOrder: Number(recordValue(record, 'displayOrder') ?? 0) || 0,
    status: text(recordValue(record, 'status')) || 'Active',
  };
  if (type !== 'brands') return base;
  return {
    ...base,
    slug: text(recordValue(record, 'slug')),
    logoUrl: text(recordValue(record, 'logoUrl')),
    coverImageUrl: text(recordValue(record, 'coverImageUrl')),
    website: text(recordValue(record, 'website')),
    isVisible: booleanValue(recordValue(record, 'isVisible'), true),
    accentColor: text(recordValue(record, 'accentColor')) || '#C8AE7D',
    secondaryColor: text(recordValue(record, 'secondaryColor')) || '#F4F1EC',
    backgroundColor: text(recordValue(record, 'backgroundColor')) || '#080706',
    themeVariant: text(recordValue(record, 'themeVariant')) || 'archive',
    logoTreatment: text(recordValue(record, 'logoTreatment')) || 'natural',
    kicker: text(recordValue(record, 'kicker')),
    headline: text(recordValue(record, 'headline')),
    description: text(recordValue(record, 'description')),
    originLabel: text(recordValue(record, 'originLabel')),
    styleLabel: text(recordValue(record, 'styleLabel')),
  };
}

function validateRow(type, data, rowNumber) {
  const errors = [];
  if (!data.name) errors.push('Name is required');
  if (!Number.isInteger(data.displayOrder) || data.displayOrder < 0) errors.push('Display order must be a whole number zero or greater');
  if (!['Active', 'Archived'].includes(data.status)) errors.push('Status must be Active or Archived');
  if (type === 'brands') {
    ['logoUrl', 'coverImageUrl', 'website'].forEach(key => {
      const value = data[key];
      if (value && !/^(https?:\/\/|\/api\/v1\/images\/)/i.test(value)) errors.push(`${key === 'logoUrl' ? 'Logo' : key === 'coverImageUrl' ? 'Cover image' : 'Website'} URL must begin with http://, https:// or /api/v1/images/`);
    });
    ['accentColor', 'secondaryColor', 'backgroundColor'].forEach(key => {
      if (data[key] && !/^#[0-9a-f]{6}$/i.test(data[key])) errors.push(`${key.replace(/([A-Z])/g, ' $1')} must be a six-digit hex color`);
    });
    if (!['archive', 'velocity', 'precision', 'race', 'grid', 'neon'].includes(data.themeVariant)) errors.push('Theme is not supported');
    if (!['natural', 'invert'].includes(data.logoTreatment)) errors.push('Logo treatment must be Natural or Invert');
  }
  return { type, rowNumber, data, errors };
}

function styleSheet(sheet, definition) {
  sheet.columns = definition.columns.map(([header, key, width]) => ({ header, key, width }));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + definition.columns.length)}1` };
  const header = sheet.getRow(1);
  header.height = 28;
  header.font = { bold: true, color: { argb: 'FFF4F1EC' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171512' } };
  header.alignment = { vertical: 'middle' };
  ['logoUrl', 'coverImageUrl', 'headline', 'description'].forEach(key => {
    if (definition.columns.some(([, columnKey]) => columnKey === key)) sheet.getColumn(key).alignment = { vertical: 'top', wrapText: true };
  });
}

function addValidations(sheet, definition, rowCount) {
  const columnIndex = key => definition.columns.findIndex(([, columnKey]) => columnKey === key) + 1;
  const addList = (key, values) => {
    const column = columnIndex(key);
    if (!column) return;
    for (let row = 2; row <= rowCount; row += 1) {
      sheet.getCell(row, column).dataValidation = {
        type: 'list', allowBlank: false, formulae: [`"${values.join(',')}"`], showErrorMessage: true,
        errorStyle: 'stop', errorTitle: 'Choose an available option', error: `Select ${key} from the dropdown list.`,
      };
    }
  };
  addList('status', ['Active', 'Archived']);
  if (definition.sheetName === 'Brands') {
    addList('isVisible', ['Yes', 'No']);
    addList('themeVariant', ['archive', 'velocity', 'precision', 'race', 'grid', 'neon']);
    addList('logoTreatment', ['natural', 'invert']);
  }
}

function addInstructions(workbook) {
  const sheet = workbook.addWorksheet('Instructions');
  sheet.columns = [{ width: 26 }, { width: 100 }];
  sheet.addRows([
    ['Master data backup', 'This workbook backs up Brands, Scales and Series used by the GarageKings catalog.'],
    ['Import safety', 'Import opens a review screen. Nothing is saved until the changes are confirmed.'],
    ['Matching', 'Existing records are matched by Record ID first, then by case-insensitive Name.'],
    ['Brand images', 'Logo and cover image files are not embedded. Their durable S3, CDN or /api/v1/images references are preserved.'],
    ['Restoring lookup data', 'If these lookup records are deleted, import this workbook to recreate them. Product data must be restored from the separate catalog backup.'],
    ['Blank optional cells', 'Blank optional values do not erase an existing value during an update.'],
  ]);
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFF4F1EC' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171512' } };
  sheet.getColumn(2).alignment = { vertical: 'top', wrapText: true };
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

export async function buildMasterDataWorkbook(data = {}) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  Object.entries(MASTER_DATA_SHEETS).forEach(([type, definition]) => {
    const sheet = workbook.addWorksheet(definition.sheetName);
    styleSheet(sheet, definition);
    (data[type] || []).map(record => normalizedRecord(type, record)).forEach(record => {
      const row = sheet.addRow({ ...record, isVisible: type === 'brands' ? (record.isVisible ? 'Yes' : 'No') : undefined });
      if (type === 'brands' && (record.description || record.logoUrl || record.coverImageUrl)) row.height = 42;
    });
    addValidations(sheet, definition, Math.max(500, (data[type] || []).length + 100));
  });
  addInstructions(workbook);
  return workbook;
}

export async function exportMasterDataWorkbook(data = {}) {
  const workbook = await buildMasterDataWorkbook(data);
  await downloadWorkbook(workbook, `GarageKings-master-data-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function readMasterDataWorkbook(file) {
  const ExcelModule = await import('exceljs');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const rows = [];
  Object.entries(MASTER_DATA_SHEETS).forEach(([type, definition]) => {
    const sheet = workbook.worksheets.find(candidate => candidate.name.toLowerCase() === definition.sheetName.toLowerCase());
    if (!sheet) return;
    const headers = {};
    sheet.getRow(1).eachCell((cell, columnNumber) => {
      const key = HEADER_ALIASES[text(cell.value).toLowerCase()];
      if (key) headers[columnNumber] = key;
    });
    if (!Object.values(headers).includes('name')) throw new Error(`${definition.sheetName} is missing the Name column.`);
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const raw = {};
      Object.entries(headers).forEach(([column, key]) => { raw[key] = row.getCell(Number(column)).value; });
      if (Object.values(raw).every(value => text(value) === '')) return;
      const data = normalizedRecord(type, {
        ...raw,
        displayOrder: text(raw.displayOrder) === '' ? 0 : Number(raw.displayOrder),
        isVisible: booleanValue(raw.isVisible, true),
      });
      const parsed = validateRow(type, data, rowNumber);
      parsed.providedFields = Object.keys(raw).filter(key => text(raw[key]) !== '');
      rows.push(parsed);
    });
  });
  if (!rows.length) throw new Error('No Brands, Scales or Series rows were found in the workbook.');
  const names = new Set();
  rows.forEach(row => {
    const key = `${row.type}:${row.data.name.toLocaleLowerCase()}`;
    if (names.has(key)) row.errors.push(`Duplicate ${row.type.slice(0, -1)} name in workbook`);
    names.add(key);
  });
  return rows;
}

export function masterDataRecordValue(record, key) {
  return recordValue(record, key);
}
