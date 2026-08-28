# Hostinger VPS deployment

Deploy the frontend and backend on a Hostinger Ubuntu 24.04 VPS. Use `app.example.com` for the frontend and `api.example.com` for the API.

## Server hardening

1. Add an SSH key in hPanel, create a non-root sudo user, and disable root and password SSH login.
2. Enable UFW and allow only SSH, HTTP, and HTTPS:

   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

3. Install Node.js LTS, PostgreSQL, Redis, NGINX, PM2, and Certbot. Keep PostgreSQL and Redis bound to `127.0.0.1`; do not open ports `5432`, `6379`, `3000`, or `4000` in the firewall.

## Application setup

1. Clone the `frontend` and `backend` repositories into a directory owned by the deploy user.
2. Copy `backend/.env.production.example` to `backend/.env` and replace every placeholder. Generate distinct JWT secrets with:

   ```bash
   openssl rand -base64 48
   ```

3. Copy `frontend/.env.production.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` to the HTTPS API URL.
4. Restrict `CORS_ORIGIN` to the exact frontend origin. Do not use `*`.
5. Configure SMTP before launch and keep `PASSWORD_RESET_EXPOSE_LINK=false`.

## Build and run

```bash
cd backend
npm ci
npx prisma migrate deploy
npm run build
pm2 start dist/main.js --name ofenetworks-api

cd ../frontend
npm ci
npm run build
pm2 start npm --name ofenetworks-web -- start
pm2 save
pm2 startup
```

Configure NGINX to proxy `app.example.com` to `127.0.0.1:3000` and `api.example.com` to `127.0.0.1:4000`. Obtain certificates for both domains with Certbot, then confirm only HTTPS is reachable.

## Before launch

- Confirm `https://api.example.com/api` responds through NGINX.
- Confirm login works only from the configured frontend domain.
- Take and test a PostgreSQL backup restore.
- Enable Hostinger VPS backups and monitor PM2/NGINX logs.
- Never commit `.env` files, private keys, database dumps, or SMTP/OAuth credentials.

## Facebook login setup

1. Create a Meta app and add the Facebook Login use case.
2. Enable Client OAuth Login and Web OAuth Login.
3. Add the exact value of `FACEBOOK_REDIRECT_URI` as a Valid OAuth Redirect URI. For the production template, this is `https://api.example.com/api/auth/social/facebook/callback`.
4. Add your frontend domain to the Meta app's App Domains and Site URL settings.
5. Enable the `email` and `public_profile` permissions. Users must grant email access and have a confirmed email address.
6. Add the App ID and App Secret only to `backend/.env`; never place them in the frontend environment.
7. Before enabling the app for all users, provide the required privacy-policy and data-deletion URLs, then switch the Meta app from Development to Live mode.
8. Set `FACEBOOK_GRAPH_API_VERSION` to an API version supported by your Meta app and update it before Meta retires that version.
