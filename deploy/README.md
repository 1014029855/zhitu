# Q1.1 Fast Launch Deployment

This guide deploys Q1.1 to one Ubuntu VPS. Use Hong Kong first for mainland China accessibility. Singapore is the fallback region.

## 1. Server Packages

```bash
sudo apt update
sudo apt install -y nginx git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v
pm2 -v
```

Expected: Node.js 20 or newer, npm installed, PM2 installed.

## 2. Directories

```bash
sudo mkdir -p /var/www/q11/current /var/www/q11/shared/data /var/www/q11/shared/logs
sudo chown -R "$USER":"$USER" /var/www/q11
```

## 3. Upload Code

Copy the project files into:

```text
/var/www/q11/current
```

Do not overwrite:

```text
/var/www/q11/shared/data/platform.db
```

## 4. Environment

Create `/var/www/q11/current/.env.production` by reading the secret at the terminal:

```bash
read -rsp "DeepSeek production API key: " DEEPSEEK_API_KEY
echo
JWT_SECRET="$(openssl rand -hex 32)"
cat > /var/www/q11/current/.env.production <<EOF
NODE_ENV=production
API_PORT=1234
DB_PATH=/var/www/q11/shared/data/platform.db
JWT_SECRET=$JWT_SECRET
DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
EOF
chmod 600 /var/www/q11/current/.env.production
```

Use the rotated key from the DeepSeek account. Do not commit this file.

## 5. Install And Build

```bash
cd /var/www/q11/current
npm ci
npm run build
```

Expected: `dist/index.html` exists.

## 6. Start API

```bash
mkdir -p /var/www/q11/shared/data /var/www/q11/shared/logs
cp deploy/ecosystem.config.cjs ./ecosystem.config.cjs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` if PM2 asks for it.

Verify:

```bash
curl -s http://127.0.0.1:1234/api/health
```

Expected: JSON with `"success":true`.

## 7. Configure Nginx

```bash
sudo cp deploy/nginx-q11.conf /etc/nginx/sites-available/q11
sudo ln -sf /etc/nginx/sites-available/q11 /etc/nginx/sites-enabled/q11
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Verify:

```bash
curl -I http://127.0.0.1/
curl -s http://127.0.0.1/api/health
```

Expected: frontend returns HTTP 200 and API returns success JSON.

## 8. Add HTTPS

Point the production domain DNS A record to the VPS public IP. Then run:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx
```

Choose the Q1.1 domain when prompted and enable HTTP to HTTPS redirect.

Verify:

```bash
read -rp "Production domain: " Q11_DOMAIN
curl -I "https://${Q11_DOMAIN}/"
curl -s "https://${Q11_DOMAIN}/api/health"
```

Expected: HTTPS frontend returns HTTP 200 and API returns success JSON.

## 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Expected: only SSH, HTTP, and HTTPS are publicly allowed.

## 10. Release Backup

Before each later release:

```bash
mkdir -p /var/www/q11/backups
cp /var/www/q11/shared/data/platform.db /var/www/q11/backups/platform-$(date +%Y%m%d-%H%M%S).db
cp /var/www/q11/shared/data/platform.db-wal /var/www/q11/backups/platform-$(date +%Y%m%d-%H%M%S).db-wal 2>/dev/null || true
cp /var/www/q11/shared/data/platform.db-shm /var/www/q11/backups/platform-$(date +%Y%m%d-%H%M%S).db-shm 2>/dev/null || true
```

## 11. Smoke Test

Open the production site and check:

- Homepage loads.
- Login page loads.
- Registration or login works.
- The production domain `/api/health` endpoint returns success JSON.
- AI page shows a controlled error if the DeepSeek key is missing and works after the key is configured.
- Paper search failure does not break the rest of the app.
