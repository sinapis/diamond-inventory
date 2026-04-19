
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { syncInventory } from './sync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'mariadb',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'diamond_inventory',
};

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

async function initDB() {
    try {
        // Test connection
        const conn = await pool.getConnection();
        console.log('Connected to MariaDB via pool');
        conn.release();

        // Migration: Ensure new columns exist
        await pool.execute('ALTER TABLE diamonds ADD COLUMN IF NOT EXISTS depth_percent DECIMAL(10,2)');
        await pool.execute('ALTER TABLE diamonds ADD COLUMN IF NOT EXISTS table_percent DECIMAL(10,2)');
        await pool.execute('ALTER TABLE diamonds ADD COLUMN IF NOT EXISTS ratio DECIMAL(10,2)');
        console.log('Database schema verified/updated');

        const excelPath = path.join(__dirname, '../excel/inventory.xlsx');
        await syncInventory(excelPath, pool);
    } catch (err) {
        console.error('Database connection failed. Retrying in 5 seconds...', err.message);
        setTimeout(initDB, 5000);
    }
}

cron.schedule('0 */2 * * *', async () => {
    try {
        const excelPath = path.join(__dirname, '../excel/inventory.xlsx');
        await syncInventory(excelPath, pool);
    } catch (err) {
        console.error('Scheduled sync failed:', err.message);
    }
});

app.get('/api/diamonds', async (req, res) => {
    try {
        const { 
            shape, color, clarity, minWeight, maxWeight,
            stockNumber, colorFrom, colorTo, clarityFrom, clarityTo,
            minLength, maxLength, minWidth, maxWidth,
            fluorescence, pairSingle, location, certificate
        } = req.query;
        let query = 'SELECT * FROM diamonds WHERE 1=1';
        const params = [];

        // Stock Number Search
        if (stockNumber) {
            query += ' AND stock_id LIKE ?';
            params.push(`%${stockNumber}%`);
        }

        // Dropdowns / Enums
        if (shape) {
            const shapes = Array.isArray(shape) ? shape : [shape];
            query += ` AND shape IN (${shapes.map(() => '?').join(',')})`;
            params.push(...shapes);
        }
        if (fluorescence) {
            query += ' AND fluorescence = ?';
            params.push(fluorescence);
        }
        if (location) {
            query += ' AND country = ?';
            params.push(location);
        }
        if (certificate) {
            query += ' AND certificate = ?';
            params.push(certificate);
        }

        // Pair / Single
        if (pairSingle === 'Pair') {
            query += " AND (is_matched_pair = 'Pair' OR qty >= 2)";
        } else if (pairSingle === 'Single') {
            query += " AND (is_matched_pair = 'Loose' OR qty = 1)";
        }

        // Color Range
        if (colorFrom || colorTo) {
            if (colorFrom) {
                query += ' AND color >= ?';
                params.push(colorFrom);
            }
            if (colorTo) {
                query += ' AND color <= ?';
                params.push(colorTo);
            }
        } else if (color) {
            const colors = Array.isArray(color) ? color : [color];
            query += ` AND color IN (${colors.map(() => '?').join(',')})`;
            params.push(...colors);
        }

        // Clarity Range (Order based on user input)
        const clarityOrder = ['VVS', 'VVS1', 'VVS2', 'VS', 'VS1', 'VS2', 'SI', 'SI1', 'SI2', 'SI3', 'I1', 'I2'];
        if (clarityFrom || clarityTo) {
            const fromIdx = clarityFrom ? clarityOrder.indexOf(clarityFrom) : 0;
            const toIdx = clarityTo ? clarityOrder.indexOf(clarityTo) : clarityOrder.length - 1;
            
            if (fromIdx !== -1 && toIdx !== -1) {
                const range = clarityOrder.slice(Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx) + 1);
                query += ` AND clarity IN (${range.map(() => '?').join(',')})`;
                params.push(...range);
            }
        } else if (clarity) {
            const clarities = Array.isArray(clarity) ? clarity : [clarity];
            query += ` AND clarity IN (${clarities.map(() => '?').join(',')})`;
            params.push(...clarities);
        }

        // Numeric Ranges
        const addRange = (field, min, max) => {
            if (min) { query += ` AND ${field} >= ?`; params.push(min); }
            if (max) { query += ` AND ${field} <= ?`; params.push(max); }
        };

        addRange('weight', minWeight, maxWeight);
        addRange('length', minLength, maxLength);
        addRange('width', minWidth, maxWidth);

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/filters', async (req, res) => {
    try {
        const [shapes] = await pool.execute('SELECT DISTINCT shape FROM diamonds WHERE shape IS NOT NULL ORDER BY shape');
        const [colors] = await pool.execute('SELECT DISTINCT color FROM diamonds WHERE color IS NOT NULL ORDER BY color');
        const [clarities] = await pool.execute('SELECT DISTINCT clarity FROM diamonds WHERE clarity IS NOT NULL ORDER BY clarity');
        const [labs] = await pool.execute('SELECT DISTINCT lab FROM diamonds WHERE lab IS NOT NULL ORDER BY lab');
        const [fluorescence] = await pool.execute('SELECT DISTINCT fluorescence FROM diamonds WHERE fluorescence IS NOT NULL ORDER BY fluorescence');
        const [locations] = await pool.execute('SELECT DISTINCT country FROM diamonds WHERE country IS NOT NULL ORDER BY country');
        const [certificates] = await pool.execute('SELECT DISTINCT certificate FROM diamonds WHERE certificate IS NOT NULL ORDER BY certificate');
        res.json({
            shapes: shapes.map(r => r.shape),
            colors: colors.map(r => r.color),
            clarities: clarities.map(r => r.clarity),
            labs: labs.map(r => r.lab),
            fluorescence: fluorescence.map(r => r.fluorescence),
            locations: locations.map(r => r.country),
            certificates: certificates.map(r => r.certificate)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/export', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return res.status(400).send('No IDs provided');

        // Use query instead of execute for IN (?) with array
        const [rows] = await pool.query('SELECT * FROM diamonds WHERE id IN (?)', [ids]);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Diamonds Export');
        
        worksheet.columns = [
            { header: 'Stock #', key: 'stock_id' },
            { header: 'Shape', key: 'shape' },
            { header: 'Quantity', key: 'qty' },
            { header: 'Matched pair', key: 'is_matched_pair' },
            { header: 'Weight', key: 'weight' },
            { header: 'Color', key: 'color' },
            { header: 'Clarity', key: 'clarity' },
            { header: 'Fluorescence', key: 'fluorescence' },
            { header: 'Lab', key: 'lab' },
            { header: 'Certificate No.', key: 'certificate' },
            { header: 'List p/c', key: 'list_price' },
            { header: 'Total price', key: 'total_price' },
            { header: 'Length', key: 'length' },
            { header: 'Width', key: 'width' },
            { header: 'Height', key: 'height' },
            { header: 'Depth %', key: 'depth_percent' },
            { header: 'Table %', key: 'table_percent' },
            { header: 'Ratio', key: 'ratio' },
            { header: 'Cut Grade', key: 'cut_grade' },
            { header: 'Polish', key: 'polish' },
            { header: 'Symmetry', key: 'symmetry' },
            { header: 'Location', key: 'country' }
        ];
        
        worksheet.addRows(rows);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=diamonds_export.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/email', async (req, res) => {
    try {
        const { ids, email } = req.body;
        if (!ids || !ids.length || !email) return res.status(400).send('Missing data');

        const [rows] = await pool.query('SELECT * FROM diamonds WHERE id IN (?)', [ids]);
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT || 1025,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const html = `
            <h2>Diamond Inventory Selection</h2>
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Stock #</th>
                        <th>Shape</th>
                        <th>Qty</th>
                        <th>Pairing</th>
                        <th>Weight</th>
                        <th>Color</th>
                        <th>Clarity</th>
                        <th>Fluorescence</th>
                        <th>Lab</th>
                        <th>Cert No.</th>
                        <th>List p/c</th>
                        <th>Total Price</th>
                        <th>Length</th>
                        <th>Width</th>
                        <th>Height</th>
                        <th>Depth %</th>
                        <th>Table %</th>
                        <th>Ratio</th>
                        <th>Cut</th>
                        <th>Polish</th>
                        <th>Symmetry</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td>${r.stock_id}</td>
                            <td>${r.shape}</td>
                            <td>${r.qty}</td>
                            <td>${r.is_matched_pair}</td>
                            <td>${r.weight}</td>
                            <td>${r.color}</td>
                            <td>${r.clarity}</td>
                            <td>${r.fluorescence || '-'}</td>
                            <td>${r.lab || '-'}</td>
                            <td>${r.certificate}</td>
                            <td>$${parseFloat(r.list_price).toLocaleString()}</td>
                            <td>$${parseFloat(r.total_price).toLocaleString()}</td>
                            <td>${r.length}</td>
                            <td>${r.width}</td>
                            <td>${r.height}</td>
                            <td>${r.depth_percent || '-'}</td>
                            <td>${r.table_percent || '-'}</td>
                            <td>${r.ratio || '-'}</td>
                            <td>${r.cut_grade || '-'}</td>
                            <td>${r.polish || '-'}</td>
                            <td>${r.symmetry || '-'}</td>
                            <td>${r.country}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        await transporter.sendMail({
            from: '"Diamond Inventory" <no-reply@diamonds.com>',
            to: email,
            subject: 'Your Diamond Selection',
            html: html,
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDB();
});
