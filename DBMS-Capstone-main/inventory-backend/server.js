const express = require('express'); // Import express framework
const cors = require('cors'); // Enable CORS middleware
require('dotenv').config(); // Load .env file
const { Pool } = require('pg'); // Import postgres pool

const app = express(); // Create express app
app.use(cors()); // Use CORS
app.use(express.json()); // Parse JSON body

// A pool keeps database connections ready for reuse
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // DB connection pool

app.get('/health', (req, res) => { // Health check route
    res.json({ status: 'ok' }); // Return status ok
}); // End route

// Get all products with their category names
app.get('/products', async (req, res) => { // Get all products route
    try { // Try block
        const result = await pool.query(` // Query products with categories
      SELECT p.id, p.name, c.name AS category, p.price, // Select product fields
             p.quantity, p.reorder_level // Select stock fields
      FROM products p // From products table
      JOIN categories c ON c.id = p.category_id // Join categories table
      ORDER BY p.id // Sort by product id
    `); // End query
        res.json(result.rows); // Send products list
    } catch (err) { // Catch block
        console.error(err.message); // Log error
        res.status(500).json({ error: 'Could not fetch products' }); // Return 500 error
    } // End catch
}); // End route
// Check the data before it reaches the database
function isValid({ name, category_id, price, reorder_level } = {}) { // Validate input data
    return typeof name === 'string' && name.trim() !== '' && // Non-empty string
        Number.isInteger(category_id) && category_id > 0 && // Positive integer
        typeof price === 'number' && price >= 0 && // Non-negative number
        Number.isInteger(reorder_level) && reorder_level >= 0; // Non-negative integer
} // End function

function sendError(res, err) { // Error handler
    console.error(err.message); // Log error
    if (err.code === '23503') { // Foreign key error
        return res.status(400).json({ error: 'Category does not exist' }); // Return 400 error
    } // End if
    res.status(500).json({ error: 'Something went wrong' }); // Return 500 error
} // End function

// Add a product (quantity starts at 0)
app.post('/products', async (req, res) => { // Add product route
    if (!isValid(req.body)) return res.status(400).json({ error: 'Invalid data' }); // Validate payload
    const { name, category_id, price, reorder_level } = req.body; // Extract fields
    try { // Try block
        const result = await pool.query( // Insert query
            `INSERT INTO products (name, category_id, price, reorder_level) // Target columns
       VALUES ($1, $2, $3, $4) RETURNING *`, // Insert placeholders and return
            [name.trim(), category_id, price, reorder_level] // Query parameters
        ); // End query
        res.status(201).json(result.rows[0]); // Return created product
    } catch (err) { sendError(res, err); } // Handle error
}); // End route

// Edit a product
app.put('/products/:id', async (req, res) => { // Edit product route
    if (!isValid(req.body)) return res.status(400).json({ error: 'Invalid data' }); // Validate payload
    const { name, category_id, price, reorder_level } = req.body; // Extract fields
    try { // Try block
        const result = await pool.query( // Update query
            `UPDATE products // Target table
       SET name = $1, category_id = $2, price = $3, reorder_level = $4 // Set fields
       WHERE id = $5 RETURNING *`, // Match id and return
            [name.trim(), category_id, price, reorder_level, req.params.id] // Query parameters
        ); // End query
        if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' }); // Check found
        res.json(result.rows[0]); // Return updated product
    } catch (err) { sendError(res, err); } // Handle error
}); // End route

// Delete a product
app.delete('/products/:id', async (req, res) => { // Delete product route
    try { // Try block
        const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]); // Run delete
        if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' }); // Check found
        res.json({ message: 'Product deleted' }); // Return success
    } catch (err) { sendError(res, err); } // Handle error
}); // End route
// Stock in or stock out
app.post('/stock', async (req, res) => { // Stock movement route
    const { product_id, type, quantity } = req.body || {}; // Extract body
    if (!Number.isInteger(product_id) || !['IN', 'OUT'].includes(type) || // Check id and type
        !Number.isInteger(quantity) || quantity <= 0) { // Check quantity > 0
        return res.status(400).json({ error: 'Invalid data' }); // Return 400 error
    } // End if

    let client; // DB client
    try { // Try block
        client = await pool.connect(); // Get client from pool
        await client.query('BEGIN'); // Start transaction

        // Change stock only if it won't go below zero
        const change = type === 'IN' ? quantity : -quantity; // Calculate change
        const result = await client.query( // Update stock
            `UPDATE products SET quantity = quantity + $1 // Apply delta
       WHERE id = $2 AND quantity + $1 >= 0 RETURNING *`, // Prevent negative stock
            [change, product_id] // Query parameters
        ); // End query
        if (result.rowCount === 0) { // Check if update succeeded
            await client.query('ROLLBACK'); // Roll back changes
            return res.status(400).json({ error: 'Product not found or not enough stock' }); // Return 400 error
        } // End if

        await client.query( // Insert movement log
            'INSERT INTO stock_movements (product_id, type, quantity) VALUES ($1, $2, $3)', // Insert query
            [product_id, type, quantity] // Query parameters
        ); // End query
        await client.query('COMMIT'); // Commit transaction
        res.json(result.rows[0]); // Return updated product
    } catch (err) { // Catch error
        if (client) await client.query('ROLLBACK').catch(() => { }); // Roll back on failure
        sendError(res, err); // Handle error
    } finally { // Finally block
        if (client) client.release(); // Release client
    } // End finally
}); // End route

// Products at or below their reorder level
app.get('/products/low-stock', async (req, res) => { // Low stock route
    try { // Try block
        const result = await pool.query( // Query low stock
            'SELECT * FROM products WHERE quantity <= reorder_level ORDER BY id' // Filter by threshold
        ); // End query
        res.json(result.rows); // Send low stock list
    } catch (err) { sendError(res, err); } // Handle error
}); // End route

// Stock movement history, newest first
app.get('/history', async (req, res) => { // History route
    try { // Try block
        const result = await pool.query(` // Query history
      SELECT m.id, p.name AS product, m.type, m.quantity, m.created_at // Select fields
      FROM stock_movements m // From movements
      JOIN products p ON p.id = m.product_id // Join products
      ORDER BY m.created_at DESC, m.id DESC // Newest first
    `); // End query
        res.json(result.rows); // Send history list
    } catch (err) { sendError(res, err); } // Handle error
}); // End route
const PORT = process.env.PORT || 4000; // Port configuration
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // Start listener
