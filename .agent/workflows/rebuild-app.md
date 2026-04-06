---
description: Rebuild the diamond-inventory application and refresh the frontend Docker volume.
---

1. Ensure you have saved all changes to `frontend/src` or `backend`.
2. Run the `rebuild-app.bat` script in the root directory.
// turbo
3. `cmd /c rebuild-app.bat`
4. Confirm the containers are running with `docker compose ps`.
5. Instruct the user to perform a hard refresh (Ctrl+Shift+R) in their browser.
