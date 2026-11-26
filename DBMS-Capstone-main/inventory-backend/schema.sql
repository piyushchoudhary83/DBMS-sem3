-- 1. VIEW: products with category names
CREATE VIEW product_details AS
SELECT p.id, p.name, c.name AS category, p.quantity, p.reorder_level
FROM products p
JOIN categories c ON c.id = p.category_id;

-- 2. CURSOR: read low-stock products one row at a time
CREATE FUNCTION low_stock_report() RETURNS SETOF TEXT AS $$
DECLARE
  cur CURSOR FOR
    SELECT name, quantity, reorder_level FROM products
    WHERE quantity <= reorder_level ORDER BY id;
  item RECORD;
BEGIN
  OPEN cur;
  LOOP
    FETCH cur INTO item;
    EXIT WHEN NOT FOUND;
    RETURN NEXT format('%s: %s left (reorder level %s)',
                       item.name, item.quantity, item.reorder_level);
  END LOOP;
  CLOSE cur;
END;
$$ LANGUAGE plpgsql;

-- 3. ROLES, GRANT and REVOKE
CREATE ROLE inventory_viewer;
CREATE ROLE inventory_staff;

GRANT SELECT ON categories, products, stock_movements, product_details
  TO inventory_viewer, inventory_staff;
GRANT INSERT, UPDATE ON products TO inventory_staff;
GRANT INSERT ON stock_movements TO inventory_staff;

REVOKE UPDATE ON products FROM inventory_staff;

-- 4. INDEX: helps sort history by date on large tables
CREATE INDEX idx_movements_date ON stock_movements (created_at);