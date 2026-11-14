"use strict";

// Build the PDF directly so iOS Safari cannot add its URL, timestamp, or page footer.
function createInvoicePdf(draft, { money, numberOrZero, dateLabel }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = 15;
  const right = 195;
  const pageBottom = 277;
  const lineHeight = 5.2;
  let y = 19;

  function lines(value, width) {
    return String(value ?? "").replace(/\r\n?/g, "\n").split("\n")
      .flatMap(part => part ? doc.splitTextToSize(part, width) : [""]);
  }

  function textBlock(value, x, top, width, { bold = false, size = 11, gap = 0 } = {}) {
    if (!value) return top;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const height = size * 0.3528 * 1.35;
    const wrapped = lines(value, width);
    wrapped.forEach((line, index) => doc.text(line || " ", x, top + height * (index + 0.8)));
    return top + wrapped.length * height + gap;
  }

  function newPage() {
    doc.addPage();
    y = 19;
  }

  function sectionTitle(title, x, top) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, x, top);
  }

  function tableHeader() {
    const widths = [94, 23, 32, 31];
    const labels = ["Description", "Quantity", "Unit Price", "Amount"];
    let x = left;
    doc.setFillColor(237, 240, 242);
    doc.setDrawColor(52, 52, 52);
    doc.setLineWidth(0.25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.rect(left, y, 180, 8, "F");
    doc.setTextColor(0, 0, 0);
    widths.forEach((width, index) => {
      doc.rect(x, y, width, 8, "S");
      doc.text(labels[index], x + 2, y + 5.4);
      x += width;
    });
    y += 8;
  }

  function tableRow(item) {
    const description = lines(item.description, 89);
    let offset = 0;
    let firstPart = true;
    do {
      if (y + 9 > pageBottom) {
        newPage();
        tableHeader();
      }
      const available = Math.max(1, Math.floor((pageBottom - y - 4) / lineHeight));
      const part = description.slice(offset, offset + available);
      const height = Math.max(8, part.length * lineHeight + 4);
      const quantity = firstPart ? String(item.quantity) : "";
      const unitPrice = firstPart ? money(numberOrZero(item.unitPrice)) : "";
      const amount = firstPart ? money(numberOrZero(item.quantity) * numberOrZero(item.unitPrice)) : "";
      const cells = [part, [quantity], [unitPrice], [amount]];
      const widths = [94, 23, 32, 31];
      let x = left;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      cells.forEach((cell, index) => {
        doc.rect(x, y, widths[index], height);
        if (index === 0) {
          cell.forEach((line, lineIndex) => doc.text(line || " ", x + 2, y + 3.6 + lineIndex * lineHeight));
        } else if (index > 1) {
          doc.text(cell[0], x + widths[index] - 2, y + 5.3, { align: "right" });
        } else {
          doc.text(cell[0], x + 2, y + 5.3);
        }
        x += widths[index];
      });
      y += height;
      offset += part.length;
      firstPart = false;
    } while (offset < description.length);
  }

  doc.setProperties({ title: `Invoice ${draft.invoiceNumber || "draft"}` });
  y = textBlock(draft.senderName, left, y, 105, { bold: true, gap: 1 });
  y = textBlock(draft.senderAddress, left, y, 105, { gap: 1 });
  y = textBlock(draft.senderEmail, left, y, 105, { gap: 1 });
  y = textBlock(draft.senderPhone, left, y, 105);

  const partiesTop = Math.max(y + 19, 65);
  sectionTitle("BILL TO", left, partiesTop);
  let clientY = partiesTop + 6;
  clientY = textBlock(draft.clientName, left, clientY, 87, { gap: 1 });
  clientY = textBlock(draft.clientAddress, left, clientY, 87);

  sectionTitle("INVOICE", 115, partiesTop);
  let metaY = partiesTop + 7;
  for (const [label, value] of [
    ["Invoice No:", draft.invoiceNumber],
    ["Issue Date:", dateLabel(draft.issueDate)],
    ["Due Date:", dateLabel(draft.dueDate)]
  ]) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, 115, metaY);
    doc.text(String(value || ""), right, metaY, { align: "right" });
    metaY += 6;
  }

  y = Math.max(clientY, metaY) + 12;
  if (y + 17 > pageBottom) newPage();
  tableHeader();
  let subtotal = 0;
  for (const item of draft.items) {
    subtotal += numberOrZero(item.quantity) * numberOrZero(item.unitPrice);
    tableRow(item);
  }

  if (y + 57 > pageBottom) newPage();
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Subtotal", 140, y);
  doc.text(money(subtotal), right, y, { align: "right" });
  y += 9;
  doc.line(139, y - 5, right, y - 5);
  doc.setFontSize(11);
  doc.text("Total", 140, y);
  doc.text(money(subtotal), right, y, { align: "right" });
  doc.line(139, y + 3, right, y + 3);

  y += 22;
  sectionTitle("PAY BY BANK TRANSFER", left, y);
  y += 5;
  y = textBlock(draft.bankName, left, y, 120, { gap: 1 });
  y = textBlock(draft.accountName, left, y, 120, { gap: 1 });
  textBlock(draft.accountNumber, left, y, 120);

  const filename = `${(draft.invoiceNumber || "invoice").replace(/[^a-z0-9_-]/gi, "_")}.pdf`;
  doc.save(filename);
}
