
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function syncInventory(filePath, connection) {
    console.log('Syncing inventory from:', filePath);
    try {
        if (!fs.existsSync(filePath)) {
            console.error('Inventory file not found:', filePath);
            return;
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`Found ${rows.length} rows in inventory.`);

        // Clear existing inventory (simple strategy for MVP)
        await connection.execute('DELETE FROM diamonds');

        const insertQuery = `
            INSERT INTO diamonds (
                stock_id, country, shape, qty, weight, color, clarity, 
                marketing, cut_grade, polish, symmetry, lab, fluorescence, 
                certificate, list_price, price_per_carat, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const row of rows) {
            // Helper to get value from row by flexible key
            const getVal = (row, keys) => {
                const rowKeys = Object.keys(row);
                for (const k of keys) {
                    const matchedKey = rowKeys.find(rk => rk.toLowerCase().includes(k.toLowerCase()));
                    if (matchedKey) return row[matchedKey];
                }
                return null;
            };

            const values = [
                getVal(row, ['Stock#', 'Stock #']) || '',
                getVal(row, ['Country']) || '',
                getVal(row, ['Shape']) || '',
                parseInt(getVal(row, ['Qty', 'Quantity'])) || 0,
                parseFloat(getVal(row, ['Weight'])) || 0,
                getVal(row, ['Color']) || '',
                getVal(row, ['Clarity']) || '',
                getVal(row, ['Marketing']) || '',
                getVal(row, ['Cut Grade']) || '',
                getVal(row, ['Polish']) || '',
                getVal(row, ['Symmetry']) || '',
                getVal(row, ['Lab']) || '',
                getVal(row, ['Fluorescence']) || '',
                getVal(row, ['Certificate']) || '',
                parseFloat(getVal(row, ['List price', 'List p/'])) || 0,
                parseFloat(getVal(row, ['price_per_carat', 'P/C'])) || 0,
                parseFloat(getVal(row, ['total_price', 'Total'])) || 0
            ];
            await connection.execute(insertQuery, values);
        }

        console.log('Inventory sync completed successfully.');
    } catch (err) {
        console.error('Error during inventory sync:', err);
    }
}
