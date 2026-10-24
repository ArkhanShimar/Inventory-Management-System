# Ceylon Pure Homecare: handover guide

## Daily operation

1. Start the local system and sign in with the administrator PIN.
2. Receive finished stock using **Add stock**, recording a meaningful reason.
3. Create a shop order. Saving deducts stock immediately. Enter only the cash actually received.
4. Mark the order delivered when delivery is completed.
5. Use **Collections** to record subsequent payments or apply available credit from another order for the same shop.
6. Download a database backup regularly and copy it onto another drive.

## Correcting mistakes

Open a placed order and choose **Correct order**. Record the reason, quantities and prices. The original invoice is retained in **Correction history**. Stock changes by the quantity difference. A reduction below the amount already received creates shop credit; it does not erase a receipt. An order with returns or credit notes cannot be rewritten. Delivered orders use returns or credit adjustments instead.

## Returns and money owed to shops

**Record return** accepts quantities up to the unreturned quantity originally sold. Choose saleable or damaged for each line. Only saleable goods are added to stock. Both reduce the invoice at its original unit price, within its remaining value. Any resulting overpayment is shown as shop credit.

**Credit adjustment** reduces an invoice for a discount or billing correction without changing stock. **Record refund** records cash already returned and is limited to the available credit. It does not transfer money. Alternatively, apply available credit to an outstanding order for the same shop. Each action is recorded separately.

## Opening records

In Settings choose **Import CSV**. Download the appropriate template, preserve the English column names, fill in the records, then upload and review the preview. Import products, shops, then opening balances. Existing records are not overwritten. Duplicate codes and invalid rows must be fixed before saving; an import either succeeds completely or changes nothing.

Product template: `sku,name,variant,size,category,price,stock,minimum`.
Category values: `Soap bars`, `Dishwashing`, `Hand wash`, `Washing powder`, `Fabric care`.
Shop template: `code,name,area,phone`.
Balance template: `shop_code,reference,amount,date`, with date `YYYY-MM-DD`.

Imported opening balances are collected from Collections. A paper-account correction can be recorded as a credit adjustment. Both appear on the shop statement.

## Archive and reporting

Archive zero-stock discontinued products and settled inactive shops. Archived records remain in history. Use the visibility dropdown to find and restore them. Shop codes are displayed for imports and statements.

Orders, Collections and Stock history have date filters. Reports use order dates for sales and the actual receipt, refund and credit dates for financial events. Current outstanding balances always include all dates. Shop statements show debits, credits and a running balance, including opening balances, corrections, returns, refunds and credit transfers. A negative statement balance is credit owed to that shop. Statements can be filtered, printed or exported.

## Guided recovery

Settings → Restore database → select a downloaded SQLite backup → inspect the factory name and record counts → type the exact factory name and current PIN → save.

The application checks integrity and references before changing records. It takes a complete `before-restore` safety snapshot in `data/backups`. Restoration replaces business records, photographs and factory settings. It keeps the current PIN, sessions and activity history. Other open tabs should be refreshed afterward. Keep a copy of the current database outside this PC as well.

Recovery accepts backups up to 40 MB in the current local workflow. Larger databases can be restored manually with the server stopped. Keep recovery files private; they contain business records. Daily snapshots on the same disk do not protect against disk loss.

## Factory acceptance checks still required

Billing: choose No discount, Amount (LKR), or Percentage (%) before saving. The total and fully paid amount update automatically. Discounts apply to the entire bill. Receipts show subtotal, discount when used, total payable, payments and outstanding; credit transfers and refunds appear only when relevant. Returns use the discounted value. Verify an LKR discount, a percentage discount, partial payment on a discounted shop order, and a partial return/refund. Existing installed PCs receive updates by extracting the new package and opening Install.cmd; close unsaved billing forms first. A database safety copy and the previous application files are kept in data/updates.

For counter sales, select **Retail sale** from Overview or Sales & orders. Enter an optional customer name/phone, choose products, and complete the fully paid sale. It is marked completed immediately, so it does not enter the delivery queue. Open its record to print a receipt or record a return/refund. Each receipt owns its refund balance; anonymous buyers never share credit. Shop orders continue to support deliveries and credit. Use the sale type filter and reports to distinguish retail from shop sales. Prices currently use the product selling price in both channels.

- Enter the real company details and verify the actual opening stock and unpaid balances against signed paper records.
- Test a cash order, part-paid order, credit order, later receipt, saleable return, damaged return, refund, credit transfer and correction using agreed test records.
- Test an anonymous walk-in sale, a named retail receipt, and a retail return/refund. Verify retail sales do not appear in outstanding shop deliveries or share shop credit.
- Check the real A4 invoice printer, margins, Sinhala/Tamil fonts and shop statement printouts.
- Restore a backup on a separate test installation and compare records before live handover.
- Verify that restart and Windows shutdown preserve saved records, and train the operator on keeping the server window open.
- Store the PIN and off-PC backups securely and agree who owns daily backups and support.

This release manages finished products, orders and shop accounts. Manufacturing recipes/raw materials, batches/expiry, cartons and multi-user staff roles remain separate scope. Browser visual verification of the latest handover screens was unavailable because browser use was disabled in Work settings; automated business-rule and API tests cover the implemented operations.
