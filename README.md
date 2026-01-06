# Screenie Web App

The web application for [screenie.org](https://screenie.org) — a family-friendly screen time management system that puts children in control while keeping parents in the loop.

## About Screenie

Screenie helps families manage children's screen time through a unique approach: children have their own physical device (the Screenie device) that displays their available screen time, and they can request additional time or schedule changes. Parents can approve or adjust requests through this web application.

### Related Projects

- **Screenie Client**: The companion firmware for M5StickC Plus2 devices — [github.com/partridgeworks/pw.screenie.client.m5](https://github.com/partridgeworks/pw.screenie.client.m5)

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Push Notifications**: Web Push (VAPID)

## Getting Started

### Prerequisites

- Node.js 22+
- MongoDB (local or hosted)
- A [Clerk](https://clerk.com) account for authentication

You will only need the free tier of clerk, so if you login at clerk.com and create an account, then copy your public and secret keys into the .env file (see below)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/partridgeworks/pw-screenie-web.git
   cd pw-screenie-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

2a. **Generate VAPID keys**
You'll need these if you're going to test out push notifications.  Generate them with `npx web-push generate-vapid-keys` then copy them into your env file (see below)

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   ```
   
   Edit `.env.development` with your configuration:
   - `DATABASE_URI`: Your MongoDB connection string (if hosting locally this is likely already correct)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `VAPID_*`: Your VAPID keys (see step 2a above) - optional, ignore if you won't be testing PWA push notifications

4. **Start MongoDB** (if running locally)
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:8.0
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   For HTTPS (required for some features like push notifications):
   ```bash
   npm run dev:https
   ```

6. Open [http://localhost:3000](http://localhost:3000) (or https://localhost:3000) in your browser.

## Contributing

I welcome contributions! The preferred way to contribute is by submitting pull requests to be merged into the official [screenie.org](https://screenie.org) site.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Self-Hosting

If you'd prefer to run your own instance of Screenie, here's a guide to get you started.

### Server Requirements

- Ubuntu 24.04 LTS (or similar)
- 1GB+ RAM
- Node.js 22+
- MongoDB 8.0+
- Nginx (recommended for reverse proxy)
- PM2 (recommended for process management)

### Quick Setup

#### 1. Install Dependencies on Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB 8.0
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Build for Production

On your local machine:

```bash
# Build in standalone mode
npm run build

# The output will be in .next/standalone
```

#### 3. Deploy

Copy the following to your server:
- `.next/standalone/` → `/var/www/your-domain/dist-standalone/`
- `.next/static/` → `/var/www/your-domain/dist-standalone/.next/static/`
- `public/` → `/var/www/your-domain/dist-standalone/public/`

#### 4. Configure Environment

Create `/var/www/your-domain/.env.pm2` with your production environment variables.

#### 5. Run with PM2

Create an `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'screenie-web',
    cwd: '/var/www/your-domain/dist-standalone',
    script: 'server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: '3000'
    },
    env_file: '/var/www/your-domain/.env.pm2'
  }]
};
```

Start the application:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

#### 6. Configure Nginx

Example configuration for `/etc/nginx/sites-available/your-domain`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and add SSL with Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

For more detailed deployment information, see the [Next.js self-hosting documentation](https://nextjs.org/docs/app/building-your-application/deploying#self-hosting).

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (shopfront)/       # Public marketing pages
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── home/              # Authenticated user pages
│   └── utils/             # Client-side utilities
├── lib/                   # Shared libraries
│   ├── constants/         # Type-safe constants
│   ├── db/                # Database operations
│   ├── models/            # Mongoose schemas
│   ├── server/            # Server-side auth utilities
│   └── utils/             # Shared utilities
└── public/                # Static assets
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

