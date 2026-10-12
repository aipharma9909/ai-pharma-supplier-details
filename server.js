const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MySQL Connection Pool
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'ai_pharma_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database: ai_pharma_db');
    
    // Ensure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(64) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        supplied_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    connection.release();
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err.message);
  }
}

initDB();

// API: Health Check
app.get('/api/health', async (req, res) => {
  try {
    if (!pool) throw new Error('Database pool not initialized');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// API: Get all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, company_name AS companyName, employee_name AS employeeName, phone_number AS phoneNumber, product_name AS productName, supplied_by AS suppliedBy, created_at AS createdAt, updated_at AS updatedAt FROM suppliers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Create new supplier
app.post('/api/suppliers', async (req, res) => {
  const { id, companyName, employeeName, phoneNumber, productName, suppliedBy } = req.body;
  if (!companyName || !employeeName || !phoneNumber || !productName || !suppliedBy) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const supId = id || ('sup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));

  try {
    await pool.query(
      'INSERT INTO suppliers (id, company_name, employee_name, phone_number, product_name, supplied_by) VALUES (?, ?, ?, ?, ?, ?)',
      [supId, companyName, employeeName, phoneNumber, productName, suppliedBy]
    );
    const [rows] = await pool.query('SELECT id, company_name AS companyName, employee_name AS employeeName, phone_number AS phoneNumber, product_name AS productName, supplied_by AS suppliedBy, created_at AS createdAt FROM suppliers WHERE id = ?', [supId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Update supplier
app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { companyName, employeeName, phoneNumber, productName, suppliedBy } = req.body;
  if (!companyName || !employeeName || !phoneNumber || !productName || !suppliedBy) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE suppliers SET company_name = ?, employee_name = ?, phone_number = ?, product_name = ?, supplied_by = ? WHERE id = ?',
      [companyName, employeeName, phoneNumber, productName, suppliedBy, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete supplier
app.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AI Pharma Server running on http://localhost:${PORT}`);
});
