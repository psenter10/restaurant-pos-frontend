# CounterPOS — React Frontend

Single-restaurant Billing/POS + KOT frontend. Talks to a CodeIgniter 4 REST API
(built separately) and prints bills/KOTs via QZ Tray, with a browser
`window.print()` fallback if QZ Tray isn't installed.

## Stack

- React 18 + Vite
- React Router (client-side routing)
- Tailwind CSS
- Axios (API calls)
- qz-tray (thermal printer integration)

## Project structure

```
src/
  components/       Reusable UI: TableCard, MenuItemCard, OrderCart, Receipt
  hooks/            useQzTray (printer connect), usePolling (KOT auto-refresh)
  pages/            TablesPage, OrderPage, KotPage, MenuPage, ReportsPage
  services/
    api.js          Axios instance + all CI4 API calls (edit endpoints to match your backend)
    print.js        QZ Tray ESC/POS printing + window.print() fallback
  styles/index.css  Tailwind + print-specific CSS
```

## Local setup

```bash
npm install
cp .env.example .env
# edit .env -> set VITE_API_BASE_URL to your CI4 API (e.g. http://localhost:8080/api)
npm run dev
```

App runs at `http://localhost:5173`.

## Connecting to your CodeIgniter 4 API

All API calls live in `src/services/api.js`. The endpoints assumed are:

| Method | Endpoint                          | Purpose                     |
|--------|------------------------------------|------------------------------|
| GET    | /categories                        | menu categories              |
| GET    | /menu-items                        | menu items                   |
| POST   | /menu-items                        | create menu item              |
| PUT    | /menu-items/:id                    | update menu item              |
| DELETE | /menu-items/:id                    | delete menu item              |
| GET    | /tables                            | table list + status          |
| PATCH  | /tables/:id                        | update table status           |
| GET    | /orders/table/:tableId              | active order for a table      |
| POST   | /orders                            | create order                  |
| POST   | /orders/:id/items                   | add item to order             |
| DELETE | /orders/:id/items/:itemId           | remove item from order        |
| POST   | /orders/:id/close                   | settle/close order (billing)  |
| GET    | /kots?status=pending,preparing      | active KOTs for kitchen display |
| PATCH  | /kots/:id                          | update KOT status              |
| GET    | /reports/daily-sales?date=YYYY-MM-DD | daily sales report           |

Rename/adjust these to match your CI4 routes — the pages already have
placeholder data wired in so the UI works before the backend is ready.

Auth: `api.js` attaches `Authorization: Bearer <token>` from
`localStorage.getItem('pos_token')` if present. Set this after your CI4 login
endpoint returns a token.

## Printing setup (QZ Tray)

1. Install [QZ Tray](https://qz.io/download/) on the POS PC (one-time, free).
2. Keep QZ Tray running in the background — the app auto-connects on load
   (see the status dot in the top-right of the header).
3. If QZ Tray isn't running/installed, the app automatically falls back to
   `window.print()` using the hidden receipt markup in `components/Receipt.jsx`.
4. In production over HTTPS, QZ Tray requires a signed certificate — see
   their docs: https://qz.io/wiki/2.0-signing-messages

Printer/paper width: `charWidth` in `printReceipt()` calls defaults to 42
(80mm paper). Change to 32 if you're on 58mm paper — see `src/services/print.js`.

## Building for cPanel deployment

```bash
npm run build
```

This outputs static files to `dist/`. Deploy by:

1. Zip the contents of `dist/` (not the folder itself).
2. In cPanel File Manager, upload and extract into `public_html/` (or a
   subfolder like `public_html/pos/` if you want it at a path).
3. Since this is a single-page app (React Router), add a `.htaccess` in the
   same folder so refreshing routes like `/order/3` doesn't 404:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

4. Make sure `VITE_API_BASE_URL` was set correctly in `.env` **before**
   running `npm run build` — Vite bakes env vars into the build at build time.

## Next steps

- Wire up the CI4 API endpoints listed above (matching schema: tables,
  menu_items, orders, order_items, kots, payments)
- Add a login screen + token storage once CI4 auth is ready
- Replace placeholder data in each page once live data is flowing
