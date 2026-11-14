# Invoice Builder

A static, browser-based invoice editor. Add or remove as many item rows as needed, see totals update, save a draft locally or as JSON, and download the finished A4 invoice as a PDF.

## Run locally

Open `index.html` in a modern browser. There is no build step or server dependency. Creating a PDF requires an internet connection to load jsPDF.

## Use

1. Fill in your sender, client, invoice, and bank details.
2. Select **Add item** for each additional invoice line. Press Enter in a description to add a new line. Totals update automatically.
3. Select **Download PDF** to save an A4 PDF without browser print headers or footers.
4. Your latest draft is stored in this browser. Use **Download draft** and **Import draft** to transfer it to another device.

Money is shown with two decimals. This basic template does not add tax or discounts. Data is stored on your device, and the source contains no personal account details.

## GitHub Pages

On GitHub, go to **Settings â†’ Pages**, select **Deploy from a branch**, and set **main / (root)**. The site needs no build workflow.


