# Ceylon Pure Homecare

Local inventory and order management for a single Windows PC. Requires Node.js 24 or later. No package installation is needed.

## Project folders

- Root JavaScript files and `public/`: application source.
- `tests/`: reusable automated tests and the isolated browser fixture.
- `windows/`: installer, launcher, updater and package verification source.
- `docs/`: handover instructions.
- `data/`: development workspace records and preserved backups. Keep these private.
- `installation/Ceylon-Pure-Windows/`: current ready-to-install Windows package. Double-click **Install.cmd** to install on a new PC or safely update an existing installation.
- `installation/Ceylon-Pure-Setup-Windows-x64.zip`: the same package for copying to another PC, with a SHA-256 checksum alongside it.

`windows/Build-Package.ps1` refreshes the current package without retaining dated builds. Packaged application data starts empty. The installed app keeps its separate records under `%LOCALAPPDATA%\Ceylon Pure Homecare\data`.

Double-click **Start Ceylon Pure.bat**, or run `npm start`, and open http://localhost:3000. Keep the server window open while using the system. The database is saved to `data/inventory.sqlite` and survives restarts.

## Included

- Dashboard with actual order totals, recent orders, weekly activity and low-stock alerts.
- Products, fragrance and pack-size variants, category filters, prices and stock adjustments.
- Shops, multi-item orders, immediate stock deduction, full/partial/credit payment tracking and collection recording.
- Delivery marking; cancellation of unpaid, undelivered orders returns stock exactly once.
- Product photographs (JPEG, PNG, WebP, up to 4 MB), stored in the database.
- PIN login, PIN changes, salted PIN hashes, protected APIs, sign-out, failed-attempt lockout, and 30-minute idle expiry.
- Editable factory name, address and phone, used across the workspace and invoices. Shop editing and recent activity history.
- Printable invoices, CSV exports, full downloadable SQLite backups, persistent SQLite database.
- Light and dark themes. English, Sinhala and Tamil across login, dashboard, forms, tables, reports, invoices, settings, messages, dates and export headers. Entered business names, product names and notes remain unchanged.
- Custom dropdowns with keyboard navigation, selected-state indicators and search for longer lists. Translated labels preserve their underlying database values.
- Returns with saleable/damaged handling, credit notes, refunds, and transfers of available credit between the same shop’s orders.
- Traceable placed-order corrections, archived products/shops, date filters and printable running-balance shop statements.
- CSV previews and atomic imports of opening products, shops and unpaid balances, plus collection and adjustment of those opening balances.
- Guided backup validation and restoration, with a pre-restore safety copy and the current PIN retained.

Existing example records from the first prototype are preserved during migration. New databases start empty; no products, shops or orders are hardcoded. This release tracks individual selling units. Manufacturing recipes, raw materials, tax accounting, batches/expiry, carton conversions and multiple staff roles remain outside this release. A full daily SQLite snapshot is saved before the first stock/order/product/shop and financial-operation change to `data/backups`.

## First sign-in

Create your own 6-to-12-digit PIN on the setup page. No default PIN is installed. Keep it safely: there is no email reset for an offline workspace. Change it in Settings using the current PIN. Changing it revokes previous sessions. Five incorrect attempts temporarily lock sign-in for five minutes. The server enforces an eight-hour session limit and a 30-minute idle limit. A PIN protects app access; the Windows account and drive permissions protect the database file itself.

## Database

SQLite is embedded in Node.js, so no separate MySQL or PostgreSQL service is needed. The UI reads from the server API; browser storage holds only theme and language preferences. Business data is stored in structured `products`, `customers`, `orders`, `order_items`, `payments`, and `stock_movements` tables. Foreign keys, non-negative stock constraints, payment limits and atomic transactions protect records. Prices are stored as integer cents. Payment collections are separate dated ledger entries.

The old single-record database is migrated automatically on startup. Its `state` table remains as an untouched archive; the application uses the new tables after migration. `/api/database-status` checks the live database. `DB_PATH` can override the database file location.

## Backups and recovery

Download a complete database copy from Settings. Photographs, factory settings, PIN credentials, sales and payment history are included. Keep copies on a different drive. Automatic snapshots on the same disk do not protect against loss of that disk.

Use Settings → Restore database for backups up to 40 MB. Review the backup, type its factory name and enter your current PIN. A safety snapshot is saved before replacement. This guided process retains the current PIN and security settings. See `docs/HANDOVER.md` for complete instructions.

For manual restoration: stop the server, rename the existing `data` folder to preserve it, create a fresh `data` folder, and copy the backup into it as `inventory.sqlite`. Restart and sign in with the PIN that was active when that backup was made. Preserve the old folder until the restored records have been checked. Never replace database files while the server is running, and do not carry old `-wal` or `-shm` files into the fresh folder.

The application listens only on this PC (127.0.0.1). Business APIs, images and backups require a signed-in session. Browser storage holds only theme and language. An internet connection is optional for the font; system fonts work offline. Access through one consistent address (localhost or 127.0.0.1) because session cookies are specific to the hostname.

## Validation

Billing supports a fixed LKR discount or a percentage, with a live subtotal, discount and payable total. The server recalculates the discount; money is stored in cents. Partial returns use the discounted line value, including cent allocation, so refunds cannot exceed what was actually paid for those goods. Fully paid receipts omit unused credit/refund rows. Discounts also appear in reports, CSV exports and correction history. Schema version 5 preserves existing bills with no discount. On an installed PC, extract the new ZIP and use **Install.cmd**, which backs up the database and application files while retaining the PIN and records.

Walk-in retail is available from **Retail sale** on Overview or Sales & orders. Customer name and phone are optional; no shop record is needed. Retail receipts must be fully paid and are completed immediately, deduct stock, and support returns and refunds against that receipt. Shop orders retain deliveries, partial payments and credit collection. Sales history can be filtered by sale type, and reports and CSV exports include both channels. Existing shop data upgrades automatically to schema version 4; a configured database gets a safety copy before this migration.

Run `npm test` for database migration/reopening, rollback, inventory transactions, collections, PIN hashing/lockout/expiry/rotation, image upload validation, full backup integrity, translation completeness and business-text preservation. The central translation catalog is `public/i18n.js`. Browser checks use a separate test database and do not set your real PIN. The browser fixture and credentials in `tests/browser-fixture.mjs` are for isolated development verification only.

Before handover, follow `docs/HANDOVER.md`: validate the company’s opening balances and stock, test the real printer and a restore on the target PC, and train the operator. This is not a full manufacturing or accounting suite. Visual verification of the newly added handover screens remains pending because browser control was disabled in Work settings during the final pass.

