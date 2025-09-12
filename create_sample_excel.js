const XLSX = require('xlsx');
const path = require('path');

// Sample ma'lumotlar
const data = [
  ['TOT bo\'yicha guruhlar', '', '26.06cscscs2025 final (2)', ''],
  ['', '', '', ''],
  ['Nomi', 'Miqdori', 'Narxi', 'Summa'],
  ['Qalam', 10, 5000, '=B4*C4'],
  ['Daftar', 5, 8000, '=B5*C5'],
  ['Ruchka', 20, 2000, '=B6*C6'],
  ['Kompyuter', 2, 1500000, '=B7*C7'],
  ['Monitor', 2, 800000, '=B8*C8'],
  ['', '', '', ''],
  ['Jami:', '', '', '=SUM(D4:D8)']
];

// Workbook yaratish
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Cell formatini sozlash
ws['A1'] = { v: 'TOT bo\'yicha guruhlar 26.06cscscs2025 final (2)', t: 's' };
ws['A3'] = { v: 'Nomi', t: 's' };
ws['B3'] = { v: 'Miqdori', t: 's' };
ws['C3'] = { v: 'Narxi', t: 's' };
ws['D3'] = { v: 'Summa', t: 's' };

// Range belgilash
ws['!ref'] = 'A1:D10';

// Merge cells
ws['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }  // A1:D1 ni birlashtirish
];

// Worksheet'ni workbook'ga qo'shish
XLSX.utils.book_append_sheet(wb, ws, 'TOT hisoboti');

// Excel faylni saqlash
const filePath = path.join(__dirname, 'media', 'files', 'sample_excel.xlsx');
XLSX.writeFile(wb, filePath);

console.log('Sample Excel fayl yaratildi:', filePath);
