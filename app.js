"use strict";

const STORAGE_KEY = "invoice-builder-draft-v1";
const fieldNames = ["senderName", "senderAddress", "senderEmail", "senderPhone", "clientName", "clientAddress", "invoiceNumber", "currency", "issueDate", "dueDate", "bankName", "accountName", "accountNumber"];
const byId = id => document.getElementById(id);
const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
const pad = number => String(number).padStart(2, "0");

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function plusMonth(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const lastDayNextMonth = new Date(year, month + 1, 0).getDate();
  const target = new Date(year, month, Math.min(day, lastDayNextMonth));
  return localDate(target);
}

function emptyDraft() {
  const issueDate = localDate();
  return {
    senderName: "", senderAddress: "", senderEmail: "", senderPhone: "",
    clientName: "", clientAddress: "", invoiceNumber: "INV-0001", currency: "RM",
    issueDate, dueDate: plusMonth(issueDate),
    bankName: "", accountName: "", accountNumber: "",
    items: [{ id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "0.00" }]
  };
}

function validDraft(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.items)) throw new Error("The selected file is not an invoice draft.");
  const base = emptyDraft();
  for (const key of fieldNames) {
    if (typeof value[key] === "string") base[key] = value[key].slice(0, 2000);
  }
  base.items = value.items.slice(0, 1000).map(item => ({
    id: crypto.randomUUID(),
    description: String(item.description ?? "").slice(0, 2000),
    quantity: String(item.quantity ?? "1").slice(0, 30),
    unitPrice: String(item.unitPrice ?? "0.00").slice(0, 30)
  }));
  if (!base.items.length) base.items = emptyDraft().items;
  return base;
}

let draft;
try { draft = validDraft(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
catch { draft = emptyDraft(); }

function money(number) {
  const currency = draft.currency.trim() || "RM";
  return `${currency} ${new Intl.NumberFormat("en-MY", {minimumFractionDigits:2, maximumFractionDigits:2}).format(number)}`;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function dateLabel(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : dateString;
}

let saveTimer;
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    byId("save-status").textContent = "Saved in this browser";
  } catch {
    byId("save-status").textContent = "Browser storage unavailable — download a draft";
  }
}
function changed() {
  renderPreview();
  byId("save-status").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 220);
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function renderEditor() {
  for (const key of fieldNames) document.querySelector(`[data-field="${key}"]`).value = draft[key];
  renderItemsEditor();
  renderPreview();
}

function renderItemsEditor() {
  const container = byId("item-editor");
  container.replaceChildren();
  draft.items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `<div class="item-card-top"><strong>Item ${index + 1}</strong><button type="button" class="remove-item" aria-label="Remove item ${index + 1}">Remove</button></div>
      <div class="item-card-fields">
        <label class="item-input description-input">Description<input data-item-field="description" placeholder="Item or service" value="${escapeHtml(item.description)}"></label>
        <label class="item-input">Quantity<input data-item-field="quantity" type="number" min="0" step="any" inputmode="decimal" value="${escapeHtml(item.quantity)}"></label>
        <label class="item-input">Unit price<input data-item-field="unitPrice" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(item.unitPrice)}"></label>
        <div class="item-amount">Amount: <span>${money(numberOrZero(item.quantity) * numberOrZero(item.unitPrice))}</span></div>
      </div>`;
    card.querySelector(".remove-item").addEventListener("click", () => {
      draft.items.splice(index, 1);
      if (!draft.items.length) draft.items.push({id:crypto.randomUUID(),description:"",quantity:"1",unitPrice:"0.00"});
      renderItemsEditor(); changed();
    });
    card.querySelectorAll("[data-item-field]").forEach(input => input.addEventListener("input", () => {
      item[input.dataset.itemField] = input.value;
      card.querySelector(".item-amount span").textContent = money(numberOrZero(item.quantity) * numberOrZero(item.unitPrice));
      changed();
    }));
    container.append(card);
  });
}

function renderPreview() {
  document.querySelectorAll("[data-preview]").forEach(element => {
    const key = element.dataset.preview;
    element.textContent = key.endsWith("Date") ? dateLabel(draft[key]) : draft[key];
  });
  const tbody = byId("preview-items");
  tbody.replaceChildren();
  let subtotal = 0;
  draft.items.forEach(item => {
    const amount = numberOrZero(item.quantity) * numberOrZero(item.unitPrice);
    subtotal += amount;
    const tr = document.createElement("tr");
    for (const text of [item.description, item.quantity, money(numberOrZero(item.unitPrice)), money(amount)]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    }
    tbody.append(tr);
  });
  byId("subtotal").textContent = money(subtotal);
  byId("total").textContent = money(subtotal);
}

document.querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", () => {
  draft[input.dataset.field] = input.value;
  if (input.dataset.field === "currency") renderItemsEditor();
  changed();
}));

byId("add-item").addEventListener("click", () => {
  draft.items.push({id:crypto.randomUUID(),description:"",quantity:"1",unitPrice:"0.00"});
  renderItemsEditor(); changed();
  byId("item-editor").lastElementChild.querySelector("[data-item-field=description]").focus();
});

byId("new-invoice").addEventListener("click", () => {
  if (!window.confirm("Create a new invoice? This keeps your sender and bank details, and clears the current client and items.")) return;
  const next = emptyDraft();
  for (const key of ["senderName","senderAddress","senderEmail","senderPhone","bankName","accountName","accountNumber","currency"]) next[key] = draft[key];
  const match = /^(.*?)(\d+)$/.exec(draft.invoiceNumber);
  if (match) next.invoiceNumber = match[1] + String(Number(match[2]) + 1).padStart(match[2].length, "0");
  draft = next; renderEditor(); changed(); showToast("New invoice ready.");
});

byId("print-invoice").addEventListener("click", () => {
  save();
  const previousTitle = document.title;
  document.title = `Invoice ${draft.invoiceNumber || "draft"}`;
  window.addEventListener("afterprint", () => { document.title = previousTitle; }, { once:true });
  window.print();
});

byId("download-draft").addEventListener("click", () => {
  save();
  const blob = new Blob([JSON.stringify(draft, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(draft.invoiceNumber || "invoice-draft").replace(/[^a-z0-9_-]/gi, "_")}.json`;
  document.body.append(link);
  link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Draft downloaded.");
});

byId("upload-draft").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error("Draft file is too large.");
    draft = validDraft(JSON.parse(await file.text()));
    renderEditor(); save(); showToast("Draft imported.");
  } catch (error) { showToast(error.message || "Could not open that draft."); }
  event.target.value = "";
});

renderEditor();
