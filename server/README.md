# ecolift.ge API

Node.js/Express backend for the elevator parts catalog: admin uploads parts, customers place orders, each order is saved in MySQL and emailed to the owner. No online payment.

## Run locally

```bash
cd server
cp .env.example .env      # fill in DB, JWT_SECRET, SMTP
npm install
mysql -u <user> -p <db> < schema.sql
npm run create-admin -- admin@ecolift.ge 'StrongPassword123'
npm start                 # http://localhost:3000/api/health
```

In another terminal run the Angular site with `npm start` from the repo root; in development it calls `http://localhost:3000/api` (set `PORT=3000` and `CORS_ORIGIN=http://localhost:4200` in `.env`).

## Deploy on cPanel

1. **Database** — cPanel → *MySQL Databases*: create a database and a user, add the user to the database with ALL PRIVILEGES. Open *phpMyAdmin*, select the database, *Import* → `schema.sql`.
2. **Mailbox** — cPanel → *Email Accounts*: create e.g. `orders@ecolift.ge`. Its SMTP host/port are under *Connect Devices* (usually `mail.ecolift.ge`, port 465, SSL).
3. **Upload the server** — upload the `server/` folder (without `node_modules` and `.env`) to e.g. `/home/<user>/ecolift-server` (outside `public_html`).
4. **Node.js app** — cPanel → *Setup Node.js App* → *Create Application*:
   - Node.js version: 18 or newer
   - Application mode: Production
   - Application root: `ecolift-server`
   - Application URL: `ecolift.ge` / `api`
   - Application startup file: `app.js`
   - Environment variables: everything from `.env.example` with real values (`BASE_PATH=/api`, `CORS_ORIGIN=https://ecolift.ge`, a long random `JWT_SECRET`). Alternatively create a `.env` file in the application root with File Manager.
   - Save, then *Run NPM Install*, then *Restart*.
   - Check `https://ecolift.ge/api/health` returns `{"ok":true}`.
5. **First admin** — in the Node.js app page copy the "Enter to the virtual environment" command, run it in cPanel → *Terminal*, then `npm run create-admin -- admin@ecolift.ge 'StrongPassword123'`.
6. **Frontend** — on your computer, from the repo root: `npm install --legacy-peer-deps && npx ng build`. Upload the contents of `dist/ecoliftplus/` (including `.htaccess`) into `public_html`. Do not delete the `api` folder/`.htaccess` that cPanel created for the Node.js app.
7. **SSL** — cPanel → *SSL/TLS Status* → run AutoSSL so the site and API are on https.

Uploaded images are stored in `server/uploads/` and served from `/api/uploads/...`. Include that folder in backups.

## API

Public:

| Method | Path | |
|---|---|---|
| GET | `/api/products?search=&category=&page=` | active products, paginated |
| GET | `/api/products/:id` | one product with images |
| GET | `/api/categories` | categories |
| POST | `/api/orders` | `{ name, phone, email?, company?, comment?, items: [{ productId, quantity }] }` |

Admin (header `Authorization: Bearer <token>`):

| Method | Path | |
|---|---|---|
| POST | `/api/admin/login` | `{ email, password }` → `{ token }` |
| GET | `/api/admin/products` | all products incl. hidden |
| POST / PUT | `/api/admin/products[/:id]` | multipart form, fields + `images` (up to 10, 5MB each) |
| DELETE | `/api/admin/products/:id` | |
| DELETE | `/api/admin/products/:id/images/:imageId` | |
| POST / DELETE | `/api/admin/categories[/:id]` | |
| GET | `/api/admin/orders` | latest 200 orders with items |
| PATCH | `/api/admin/orders/:id` | `{ status: new \| in_progress \| done \| cancelled }` |
