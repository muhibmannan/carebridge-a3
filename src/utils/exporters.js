import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PDF_PRIMARY = [47, 128, 237]; // #2F80ED
const PDF_TEXT = [16, 24, 40]; // #101828
const PDF_MUTED = [106, 114, 130]; // #6A7282
const PDF_ZEBRA = [248, 250, 252]; // #F8FAFC


const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function sanitiseCsvValue(value) {
  const text = value == null ? "" : String(value);
  if (!text.length) return "";
  return FORMULA_PREFIXES.includes(text.charAt(0)) ? `'${text}` : text;
}

export function cellText(col, row) {
  const raw = col.format ? col.format(row) : row[col.key];
  return raw == null ? "" : String(raw);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export function dateStamp(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRowsToCsv({ columns, rows, filename }) {
  const csv = Papa.unparse({
    fields: columns.map((col) => col.label),
    data: rows.map((row) =>
      columns.map((col) => sanitiseCsvValue(cellText(col, row))),
    ),
  });

  triggerDownload(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
    filename,
  );
}

function drawHeader(doc, title, subtitle) {
  doc.setTextColor(...PDF_TEXT);
  doc.setFontSize(16);
  doc.text(title, 40, 44);

  doc.setTextColor(...PDF_MUTED);
  doc.setFontSize(9);
  doc.text(subtitle, 40, 60);
}

function drawFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_MUTED);
    doc.text(
      `CareBridge — Enable Collective · Page ${i} of ${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    );
  }
}

const TABLE_STYLES = {
  theme: "grid",
  styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
  headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: "bold" },
  alternateRowStyles: { fillColor: PDF_ZEBRA },
};

export function exportRowsToPdf({ columns, rows, filename, title, subtitle }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  drawHeader(doc, title, subtitle);

  autoTable(doc, {
    ...TABLE_STYLES,
    startY: 76,
    margin: { left: 40, right: 40 },
    head: [columns.map((col) => col.label)],
    body: rows.map((row) => columns.map((col) => cellText(col, row))),
  });

  drawFooters(doc);
  doc.save(filename);
}

export function exportReportToPdf({ filename, title, subtitle, sections }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  drawHeader(doc, title, subtitle);
  let cursorY = 84;

  sections.forEach((section) => {
    doc.setFontSize(11);
    doc.setTextColor(...PDF_TEXT);
    doc.text(section.heading, 40, cursorY);

    autoTable(doc, {
      ...TABLE_STYLES,
      startY: cursorY + 10,
      margin: { left: 40, right: 40 },
      head: [section.columns.map((col) => col.label)],
      body: section.rows.map((row) =>
        section.columns.map((col) => cellText(col, row)),
      ),
    });

    cursorY = doc.lastAutoTable.finalY + 28;
  });

  drawFooters(doc);
  doc.save(filename);
}