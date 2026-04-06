
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
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'diamond_inventory',
};

let connection;

async function initDB() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MariaDB');
        const excelPath = path.join(__dirname, '../excel/inventory.xlsx');
        await syncInventory(excelPath, connection);
    } catch (err) {
        console.error('Database connection failed. Retrying in 5 seconds...', err.message);
        setTimeout(initDB, 5000);
    }
}

cron.schedule('0 */2 * * *', async () => {
    if (connection) {
        const excelPath = path.join(__dirname, '../excel/inventory.xlsx');
        await syncInventory(excelPath, connection);
    }
});

app.get('/api/diamonds', async (req, res) => {
    try {
        const { 
            shape, color, clarity, minWeight, maxWeight,
            parcelName, stockId, colorFrom, colorTo, clarityFrom, clarityTo,
            minLength, maxLength, minWidth, maxWidth, minSize, maxSize,
            fluorescence, pairSingle, minPrice, maxPrice, station, location, certificate
        } = req.query;
        let query = 'SELECT * FROM diamonds WHERE 1=1';
        const params = [];

        // Parcel Search
        if (parcelName) {
            query += ' AND marketing LIKE ?';
            params.push(`%${parcelName}%`);
        }
        if (stockId) {
            query += ' AND stock_id LIKE ?';
            params.push(`%${stockId}%`);
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
        if (station) {
            query += ' AND marketing = ?';
            params.push(station);
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
        addRange('height', minSize, maxSize); // size maps to height
        addRange('total_price', minPrice, maxPrice);

        const [rows] = await connection.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/filters', async (req, res) => {
    try {
        const [shapes] = await connection.execute('SELECT DISTINCT shape FROM diamonds WHERE shape IS NOT NULL ORDER BY shape');
        const [colors] = await connection.execute('SELECT DISTINCT color FROM diamonds WHERE color IS NOT NULL ORDER BY color');
        const [clarities] = await connection.execute('SELECT DISTINCT clarity FROM diamonds WHERE clarity IS NOT NULL ORDER BY clarity');
        const [labs] = await connection.execute('SELECT DISTINCT lab FROM diamonds WHERE lab IS NOT NULL ORDER BY lab');
        const [fluorescence] = await connection.execute('SELECT DISTINCT fluorescence FROM diamonds WHERE fluorescence IS NOT NULL ORDER BY fluorescence');
        const [locations] = await connection.execute('SELECT DISTINCT country FROM diamonds WHERE country IS NOT NULL ORDER BY country');
        const [stations] = await connection.execute('SELECT DISTINCT marketing FROM diamonds WHERE marketing IS NOT NULL ORDER BY marketing');
        const [certificates] = await connection.execute('SELECT DISTINCT certificate FROM diamonds WHERE certificate IS NOT NULL ORDER BY certificate');

        res.json({
            shapes: shapes.map(r => r.shape),
            colors: colors.map(r => r.color),
            clarities: clarities.map(r => r.clarity),
            labs: labs.map(r => r.lab),
            fluorescence: fluorescence.map(r => r.fluorescence),
            locations: locations.map(r => r.country),
            stations: stations.map(r => r.marketing),
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
        const [rows] = await connection.query('SELECT * FROM diamonds WHERE id IN (?)', [ids]);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Diamonds Export');
        
        worksheet.columns = [
            { header: 'Stock #', key: 'stock_id' },
            { header: 'Shape', key: 'shape' },
            { header: 'Weight', key: 'weight' },
            { header: 'Color', key: 'color' },
            { header: 'Clarity', key: 'clarity' },
            { header: 'Lab', key: 'lab' },
            { header: 'Total Price', key: 'total_price' }
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

        const [rows] = await connection.query('SELECT * FROM diamonds WHERE id IN (?)', [ids]);
        
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
                        <th>Weight</th>
                        <th>Color</th>
                        <th>Clarity</th>
                        <th>Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td>${r.stock_id}</td>
                            <td>${r.shape}</td>
                            <td>${r.weight}</td>
                            <td>${r.color}</td>
                            <td>${r.clarity}</td>
                            <td>$${parseFloat(r.total_price).toLocaleString()}</td>
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
