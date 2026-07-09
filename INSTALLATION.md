# Installation Guide

Welcome to the **Express Playground**, a full-stack Node.js + MongoDB application demonstrating modern backend concepts. Follow these steps to get your environment set up.

## Prerequisites
- **Node.js** (v14 or higher recommended)
- **MongoDB** running locally on port `27017` or a remote connection string.
- A **Google Cloud Platform** account (to set up OAuth).
- A **Gmail** account with App Passwords enabled (to test the password reset feature).

## Step 1: Clone the repository (or navigate to it)
Ensure you are in the project root directory:
```bash
cd /path/to/backend-mongo-4
```

## Step 2: Install Dependencies
Run the following command to install all required packages (`express`, `mongoose`, `passport`, `pug`, etc.):
```bash
npm install
```

## Step 3: Configure Environment Variables
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```

Open `.env` in your favorite editor and configure the following variables:
1. `MONGO_URL`: Your MongoDB connection string (default: `mongodb://localhost:27017/playground`).
2. `SESSION_SECRET` & `JWT_SECRET`: Random strings used for cryptographic signing.
3. `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Obtain these by creating an OAuth 2.0 Client ID in the [Google Cloud Console](https://console.cloud.google.com/). Make sure the redirect URI matches `GOOGLE_CALLBACK_URL`.
4. `MAIL_USER` & `MAIL_PASS`: Used by Nodemailer. For Gmail, you must generate an **App Password** under your Google Account Security settings.

## Step 4: Run the Application

### Option A: Standard Development Mode
You can start the app directly using node:
```bash
node app.js
```
The server will start on `http://localhost:3000`.

### Option B: Using PM2 Process Manager
PM2 is a production process manager that will keep your application alive and auto-restart it if files change (in watch mode).
1. Install PM2 globally if you haven't already:
```bash
npm install -g pm2
```
2. Start the application using the ecosystem config file:
```bash
pm2 start ecosystem.config.js
```
3. To view logs or monitor the app:
```bash
pm2 logs
pm2 monit
```

## Step 5: (Optional) Set up Nginx
If you are deploying this to a production server, you should run Nginx as a reverse proxy. 
An example configuration file is provided in `nginx.conf.example`. Place this in `/etc/nginx/sites-available/` and create a symlink to `sites-enabled`. Reload Nginx to apply changes.
