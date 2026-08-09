import { parseReceiptDate } from './receiptDates';

const formatLabel = (value) => value === 'prebooking' ? 'Pre-Order' : (value || 'standard');

function safeSheetName(value) {
  return String(value).replace(/[\\/*?:[\]]/g, ' ').slice(0, 31) || 'Receipts';
}

function groupReceipts(receipts, groupBy) {
  const keyFor = groupBy === 'format'
    ? receipt => formatLabel(receipt.formatType)
    : groupBy === 'month'
      ? receipt => parseReceiptDate(receipt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : null;
  if (keyFor) return receipts.reduce((groups, receipt) => {
    const key = keyFor(receipt);
    (groups[key] ||= []).push(receipt);
    return groups;
  }, {});
  return { Receipts: receipts };
}

export async function exportReceiptsWorkbook(receipts, { groupBy = 'none', format = 'all' } = {}) {
  const eligible = receipts.filter(receipt => receipt.status !== 'Voided' && (format === 'all' || receipt.formatType === format));
  if (!eligible.length) throw new Error('There are no matching receipts to export.');

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GarageKings';
  workbook.created = new Date();

  for (const [label, rows] of Object.entries(groupReceipts(eligible, groupBy))) {
    const sheet = workbook.addWorksheet(safeSheetName(label));
    sheet.columns = [
      { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
      { header: 'Receipt Date', key: 'receiptDate', width: 22 },
      { header: 'Customer', key: 'customerName', width: 28 },
      { header: 'Phone', key: 'customerPhone', width: 18 },
      { header: 'Email', key: 'customerEmail', width: 28 },
      { header: 'Format', key: 'format', width: 16 },
      { header: 'Items', key: 'items', width: 55 },
      { header: 'Paid', key: 'paid', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Balance Due', key: 'balance', width: 15, style: { numFmt: '₹#,##0.00' } },
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } };

    rows.forEach(receipt => sheet.addRow({
      receiptNumber: receipt.receiptNumber,
      receiptDate: parseReceiptDate(receipt),
      customerName: receipt.customerName,
      customerPhone: receipt.customerPhone,
      customerEmail: receipt.customerEmail,
      format: formatLabel(receipt.formatType),
      items: (receipt.items || []).map(item => `${item.qty} × ${item.description}`).join('; '),
      paid: Number(receipt.totalAmount || 0),
      balance: Number(receipt.pendingBalance || 0),
    }));
    sheet.getColumn('receiptDate').numFmt = 'dd mmm yyyy hh:mm';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: 'A1', to: 'I1' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `garagekings_receipts_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
