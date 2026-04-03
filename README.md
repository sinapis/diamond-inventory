# Diamond Inventory Web Application

## Quick Start
1. Place your `inventory.xlsx` in the `excel/` folder.
2. Start the application:
   - **Double-click** `start-app.bat` (Windows)
   - OR run `npm start`
   - OR run `docker-compose up -d --build`
3. Open `http://localhost`.

## Tech Stack
- **Frontend**: React, Vite, Lucide Icons, Vanilla CSS.
- **Backend**: Node.js, Express, MySQL2, Node-cron, XLSX.
- **Infrastructure**: Docker, MariaDB, Nginx.

## Sync Information
The inventory is automatically synced from `excel/inventory.xlsx` every 2 hours. If you add a new file, it will be processed on the next cycle, or you can restart the container for an immediate sync.
