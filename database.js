import { DatabaseSync } from 'node:sqlite';

const cents = value => Math.round(value * 100);

export function openStore(filename) {
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      variant TEXT NOT NULL, size TEXT NOT NULL DEFAULT '', category TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
      stock INTEGER NOT NULL CHECK(stock >= 0), minimum INTEGER NOT NULL CHECK(minimum >= 0)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT ''
    ) STRICT;
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
      status TEXT NOT NULL CHECK(status IN ('Placed', 'Delivered', 'Cancelled')),
      created_at TEXT NOT NULL, notes TEXT NOT NULL DEFAULT ''
    ) STRICT;
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL, variant TEXT NOT NULL, size TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
      PRIMARY KEY(order_id, product_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
      amount_cents INTEGER NOT NULL CHECK(amount_cents > 0), received_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS stock_movements (
      record_key TEXT PRIMARY KEY, id INTEGER NOT NULL,
      product TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity != 0),
      reason TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS orders_date ON orders(created_at);
    CREATE INDEX IF NOT EXISTS payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS stock_movements_date ON stock_movements(created_at);
    CREATE TRIGGER IF NOT EXISTS payments_limit BEFORE INSERT ON payments BEGIN
      SELECT CASE WHEN (SELECT status FROM orders WHERE id = NEW.order_id) = 'Cancelled'
        THEN RAISE(ABORT, 'Cannot pay a cancelled order') END;
      SELECT CASE WHEN NEW.amount_cents + COALESCE((SELECT SUM(amount_cents) FROM payments WHERE order_id = NEW.order_id), 0)
        > (SELECT total_cents FROM orders WHERE id = NEW.order_id)
        THEN RAISE(ABORT, 'Payment exceeds order total') END;
    END;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_settings (
      id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT ''
    ) STRICT;
    INSERT OR IGNORE INTO business_settings(id,name) VALUES(1,'Ceylon Pure Homecare');
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, pin_hash TEXT NOT NULL,
      failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, last_seen INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY, mime TEXT NOT NULL, content BLOB NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY, action TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
  `);
  if (!db.prepare('PRAGMA table_info(products)').all().some(c=>c.name==='image_id')) {
    db.exec('ALTER TABLE products ADD COLUMN image_id TEXT REFERENCES images(id)');
  }

  // Retail sales belong to the individual receipt, without a shared anonymous credit account.
  if (!db.prepare('PRAGMA table_info(orders)').all().some(c=>c.name==='sale_type')) {
    const columns=new Set(db.prepare('PRAGMA table_info(orders)').all().map(c=>c.name));
    const trigger=db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='payments_limit'").get()?.sql;
    if(filename!==':memory:'&&db.prepare('SELECT count(*) AS n FROM credentials').get().n) {
      db.prepare('VACUUM INTO ?').run(`${filename}.before-retail-${Date.now()}.sqlite`);
    }
    db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE');
    try {
      db.exec(`DROP TRIGGER IF EXISTS payments_limit;
        CREATE TABLE orders_next (
          id INTEGER PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
          customer_id INTEGER REFERENCES customers(id),
          total_cents INTEGER NOT NULL CHECK(total_cents>=0),
          status TEXT NOT NULL CHECK(status IN ('Placed','Delivered','Cancelled')),
          created_at TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
          revision INTEGER NOT NULL DEFAULT 0, closed_at TEXT,
          sale_type TEXT NOT NULL DEFAULT 'shop' CHECK(sale_type IN ('shop','retail')),
          customer_name TEXT NOT NULL DEFAULT '', customer_phone TEXT NOT NULL DEFAULT '',
          CHECK((sale_type='shop' AND customer_id IS NOT NULL) OR (sale_type='retail' AND customer_id IS NULL))
        ) STRICT;
        INSERT INTO orders_next(id,reference,customer_id,total_cents,status,created_at,notes,revision,closed_at)
          SELECT id,reference,customer_id,total_cents,status,created_at,notes,${columns.has('revision')?'revision':'0'},${columns.has('closed_at')?'closed_at':'NULL'} FROM orders;
        DROP TABLE orders;
        ALTER TABLE orders_next RENAME TO orders;
        CREATE INDEX orders_customer ON orders(customer_id);
        CREATE INDEX orders_date ON orders(created_at);
        CREATE INDEX orders_sale_type ON orders(sale_type);`);
      if(trigger)db.exec(trigger);
      if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Retail migration has broken references');
      db.prepare('INSERT OR IGNORE INTO schema_migrations VALUES(4,?)').run(new Date().toISOString());
      db.exec('COMMIT');
    } catch(error) {db.exec('ROLLBACK');throw error}
    finally {db.exec('PRAGMA foreign_keys=ON')}
  }

  if(!db.prepare('PRAGMA table_info(orders)').all().some(c=>c.name==='discount_type')){
    if(filename!==':memory:'&&db.prepare('SELECT count(*) AS n FROM credentials').get().n)db.prepare('VACUUM INTO ?').run(`${filename}.before-discounts-${Date.now()}.sqlite`);
    db.exec('BEGIN IMMEDIATE');
    try{
      db.exec(`ALTER TABLE orders ADD COLUMN subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK(subtotal_cents>=0);
        ALTER TABLE orders ADD COLUMN discount_type TEXT NOT NULL DEFAULT 'none' CHECK(discount_type IN ('none','amount','percent'));
        ALTER TABLE orders ADD COLUMN discount_value REAL NOT NULL DEFAULT 0 CHECK(discount_value>=0);
        ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0 CHECK(discount_cents>=0);
        ALTER TABLE order_items ADD COLUMN net_total_cents INTEGER CHECK(net_total_cents>=0);
        UPDATE orders SET subtotal_cents=total_cents;
        UPDATE order_items SET net_total_cents=price_cents*quantity;`);
      db.prepare('INSERT OR IGNORE INTO schema_migrations VALUES(5,?)').run(new Date().toISOString());db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error}
  }

  function read() {
    const products = db.prepare(`SELECT id, sku, name, variant, size, category, price_cents / 100.0 AS price, stock, minimum, image_id AS imageId FROM products ORDER BY id`).all();
    const customers = db.prepare('SELECT id,name,area,phone FROM customers ORDER BY id').all();
    const orders = db.prepare(`SELECT o.id, reference, customer_id AS customerId, total_cents / 100.0 AS total,
      COALESCE((SELECT SUM(amount_cents) FROM payments p WHERE p.order_id=o.id),0) / 100.0 AS paid,
      status, created_at AS date, notes, sale_type AS saleType, customer_name AS customerName, customer_phone AS customerPhone,
      subtotal_cents/100.0 AS subtotal,discount_type AS discountType,discount_value AS discountValue,discount_cents/100.0 AS discountAmount FROM orders o ORDER BY created_at DESC, id DESC`).all();
    const items = db.prepare(`SELECT product_id AS productId, name, variant, size, quantity, price_cents / 100.0 AS price,COALESCE(net_total_cents,price_cents*quantity)/100.0 AS netTotal FROM order_items WHERE order_id=? ORDER BY product_id`);
    for (const order of orders) order.items = items.all(order.id);
    const movements = db.prepare('SELECT id, product, quantity, reason, created_at AS date FROM stock_movements ORDER BY created_at DESC, id DESC').all();
    return { products, customers, orders, movements };
  }

  // All changes in a business operation commit together, including stock and payment records.
  function write(state, {transaction=true}={}) {
    if(transaction) db.exec('BEGIN IMMEDIATE');
    try {
      const product = db.prepare(`INSERT INTO products(id,sku,name,variant,size,category,price_cents,stock,minimum,image_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET sku=excluded.sku, name=excluded.name, variant=excluded.variant,
        size=excluded.size, category=excluded.category, price_cents=excluded.price_cents,
        stock=excluded.stock, minimum=excluded.minimum, image_id=excluded.image_id`);
      for (const p of state.products) product.run(p.id,p.sku,p.name,p.variant,p.size||'',p.category,cents(p.price),p.stock,p.minimum,p.imageId||null);
      const hasCode=db.prepare('PRAGMA table_info(customers)').all().some(c=>c.name==='code');
      const customer = db.prepare(`INSERT INTO customers(id,name,area,phone${hasCode?',code':''}) VALUES (?, ?, ?, ?${hasCode?',?':''})
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, area=excluded.area, phone=excluded.phone`);
      for (const c of state.customers) customer.run(c.id,c.name,c.area||'',c.phone||'',...(hasCode?[c.code||`SHOP-${String(c.id).padStart(4,'0')}`]:[]));
      const order = db.prepare(`INSERT INTO orders(id,reference,customer_id,total_cents,status,created_at,notes,sale_type,customer_name,customer_phone,subtotal_cents,discount_type,discount_value,discount_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET status=excluded.status, notes=excluded.notes`);
      const item = db.prepare('INSERT INTO order_items(order_id,product_id,name,variant,size,quantity,price_cents,net_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(order_id,product_id) DO NOTHING');
      const paid = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS amount FROM payments WHERE order_id=?');
      const payment = db.prepare('INSERT INTO payments(order_id,amount_cents,received_at) VALUES (?, ?, ?)');
      for (const o of state.orders) {
        const existing = db.prepare('SELECT id FROM orders WHERE id=?').get(o.id);
        order.run(o.id,o.reference,o.customerId,cents(o.total),o.status,o.date,o.notes||'',o.saleType||'shop',o.customerName||'',o.customerPhone||'',cents(o.subtotal??o.total),o.discountType||'none',o.discountValue||0,cents(o.discountAmount||0));
        for (const i of o.items) item.run(o.id,i.productId,i.name,i.variant,i.size||'',i.quantity,cents(i.price),cents(i.netTotal??i.price*i.quantity));
        const difference = cents(o.paid) - paid.get(o.id).amount;
        if (difference < 0) throw Error('Payment records cannot be removed');
        if (difference > 0) payment.run(o.id,difference,existing?new Date().toISOString():o.date);
      }
      const movement = db.prepare('INSERT INTO stock_movements VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(record_key) DO NOTHING');
      for (const m of state.movements) movement.run(JSON.stringify([m.id,m.product,m.quantity,m.reason,m.date]),m.id,m.product,m.quantity,m.reason,m.date);
      if(transaction) db.exec('COMMIT');
    } catch (error) {
      if(transaction) db.exec('ROLLBACK');
      throw error;
    }
  }

  // Retain the old record as a migration archive, but never read it after migration.
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=1').get()) {
    const legacy = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='state'").get();
    if (legacy) {
      const row = db.prepare('SELECT value FROM state WHERE id=1').get();
      if (row) write(JSON.parse(row.value));
    }
    db.prepare('INSERT INTO schema_migrations VALUES(1,?)').run(new Date().toISOString());
  }
  db.prepare('INSERT OR IGNORE INTO schema_migrations VALUES(2,?)').run(new Date().toISOString());
  return { read, write, db, close: () => db.close() };
}

