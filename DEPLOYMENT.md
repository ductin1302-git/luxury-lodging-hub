# Deployment Checklist

## 1. Rotate exposed credentials

Rotate any database password or API key that has been posted in chat, screenshots, logs, or committed files. Update the deployment platform environment variables after rotating them.

## 2. Backend environment variables

Configure these variables on the backend hosting platform:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=https://your-frontend.example
PUBLIC_API_URL=https://your-backend.example
GOOGLE_CALLBACK_URL=https://your-backend.example/api/auth/google/redirect
OPENAI_API_KEY=replace-with-your-key
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-gmail@example.com
MAIL_PASS=your-gmail-app-password
MAIL_FROM=LuxStay <your-gmail@example.com>
MAIL_TIMEOUT_MS=10000
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_PARTNER_CODE=replace-with-momo-partner-code
MOMO_ACCESS_KEY=replace-with-momo-access-key
MOMO_SECRET_KEY=replace-with-momo-secret-key
MOMO_REDIRECT_URL=https://your-backend.example/api/payments/momo/return
MOMO_IPN_URL=https://your-backend.example/api/payments/momo/ipn
MOMO_REQUEST_TYPE=payWithMethod
```

The backend automatically adds `uselibpqcompat=true` when `DATABASE_URL` uses `sslmode=require`. This is required for hosted PostgreSQL services such as Aiven when the Node PostgreSQL driver encounters their TLS certificate chain.

Build and start the backend:

```bash
npm install
npm run build
npm run start:prod
```

For integrations, do not use `localhost` or an expired ngrok URL in production:

- `FRONTEND_URL` must be the Vercel domain.
- `PUBLIC_API_URL`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`, and `GOOGLE_CALLBACK_URL` must be the Render backend domain.
- Gmail requires an App Password, not the normal Gmail login password.
- MoMo sandbox credentials only work against the sandbox endpoint. Production MoMo requires production partner credentials and endpoint from MoMo.

## 3. Frontend environment variable

Configure this variable before building the frontend:

```env
VITE_API_BASE_URL=https://your-backend.example
```

Do not include `/api` at the end. The frontend adds it automatically.

Build the frontend:

```bash
npm install
npm run build
```

## 4. Import a PostgreSQL dump

Do not paste a plain `pg_dump` file into the pgAdmin Query Tool. A dump can contain `psql` commands such as `\restrict`, which are not SQL statements and cause syntax errors in the Query Tool.

For a plain `.sql` dump, restore it with `psql`:

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" -f backup.sql
```

For a custom-format dump created with `pg_dump -Fc`, restore it with `pg_restore` or the pgAdmin **Restore** action:

```bash
pg_restore --clean --if-exists --no-owner --dbname "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" backup.dump
```

After importing, verify the backend endpoint:

```bash
curl "https://your-backend.example/api/hotels?guests=2&rooms=1"
```
