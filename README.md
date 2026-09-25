# Invoice Builder

A static, browser-based invoice editor. Add or remove as many item rows as needed, see totals update, save a draft locally or as JSON, and print the finished A4 invoice as a PDF.

## Run locally

Open `index.html` in a modern browser. There is no build step or server dependency.

## Use

1. Fill in your sender, client, invoice, and bank details.
2. Select **Add item** for each additional invoice line. Totals update automatically.
3. Select **Print / Save PDF**, then choose **Save as PDF** in the browser's print dialog.
4. Your latest draft is stored in this browser. Use **Download draft** and **Import draft** to transfer it to another device.

Money is shown with two decimals. This basic template does not add tax or discounts. Data is stored on your device, and the source contains no personal account details.

## GitHub Pages

On GitHub, go to **Settings → Pages**, select **Deploy from a branch**, and set **main / (root)**. The site needs no build workflow.
