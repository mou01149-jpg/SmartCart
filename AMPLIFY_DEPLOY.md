# Deploying SmartCart to AWS Amplify Hosting

This guide outlines the step-by-step process to deploy SmartCart to **AWS Amplify Hosting** with automatic CI/CD deployments on every git push.

---

## 1. What Has Been Configured

- **[`amplify.yml`](./amplify.yml)**: The AWS Amplify build specification file is added to your project root.
  - Automatically installs dependencies via `npm ci`
  - Builds the production bundle via `npm run build`
  - Deploys the output directory `dist/`
  - Caches `node_modules` for fast incremental builds
  - Adds security headers and asset caching headers
- **[`index.html`](./index.html)**: Cleaned up meta viewport and SEO descriptions for mobile responsiveness and AR camera permissions.
- **Production Build Tested**: Verified clean Vite production build (`dist/`) with 0 errors and 0 warnings.

---

## 2. Step-by-Step Deployment via AWS Amplify Console

### Step A: Push changes to GitHub
In your project terminal, commit and push your new `amplify.yml` configuration:

```bash
git add amplify.yml index.html
git commit -m "Configure AWS Amplify Hosting build specification"
git push origin main
```

---

### Step B: Connect your GitHub repo to AWS Amplify
1. Log into your [AWS Management Console](https://console.aws.amazon.com/amplify/).
2. Search for **AWS Amplify** in the search bar.
3. Click **Create new app** (or **Host web app**).
4. Choose **GitHub** as your Git repository provider and click **Next**.
5. Authorize AWS Amplify to access your GitHub account.
6. Select:
   - **Repository**: `mou01149-jpg/SmartCart`
   - **Branch**: `main`
7. Click **Next**.

---

### Step C: Build Settings
- AWS Amplify will automatically detect the **[`amplify.yml`](./amplify.yml)** file in your repository.
- Ensure the app name is set to `SmartCart` (or your preferred name).
- Click **Next**, review the configuration, and click **Save and deploy**.

AWS Amplify will now:
1. **Provision** the cloud environment
2. **Build** using `amplify.yml`
3. **Deploy** to AWS CloudFront global edge CDN
4. **Verify** and generate a live public HTTPS URL (e.g. `https://main.d123456789.amplifyapp.com`)

---

## 3. Important: SPA Rewrite / Redirect Rule

To ensure client-side routing works smoothly without 404 errors on browser refresh:

1. In the AWS Amplify Console, navigate to your app: **SmartCart**.
2. In the left sidebar, click **Rewrites and redirects** (under *App settings* or *Hosting*).
3. Check if there is an existing rule for Single Page Apps. If not, click **Add rule** or edit:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
4. Click **Save**.

---

## 4. (Optional) Custom Domain & HTTPS
- In the left sidebar of Amplify, go to **Domain management**.
- Click **Add domain** (e.g. `smartcart.yourdomain.com` or `yourdomain.com`).
- AWS automatically provisions a free managed SSL certificate via Amazon Route 53 or your DNS provider.

---

## 5. Camera & Web Audio Permissions Notice
Because SmartCart includes real-time **Virtual Try-On camera** and **Web Audio sensory sound**, modern browsers require a secure **HTTPS** connection to access `navigator.mediaDevices.getUserMedia()`. 

AWS Amplify provides a free HTTPS connection out of the box, ensuring the camera virtual try-on works seamlessly across desktop and mobile devices.

