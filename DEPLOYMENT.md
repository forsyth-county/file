# Deployment Checklist

## Prerequisites

- [ ] GitHub account
- [ ] Render.com account (free tier works
- [ ] Repository pushed to GitHub

## Backend Deployment (Render.com)

1. [ ] Go to [Render.com](https://render.com) and sign in
2. [ ] Click "New +" and select "Web Service"
3. [ ] Connect your GitHub repository
4. [ ] Configure the service:
   - **Name**: Choose a name (e.g., `file-transfer-backend`)
   - **Region**: Select closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. [ ] Add environment variables:
   - `UPLOADS_DIR` = `/tmp`
6. [ ] Click "Create Web Service"
7. [ ] Wait for deployment to complete
8. [ ] Copy your backend URL (e.g., `https://file-transfer-backend.onrender.com`)
9. [ ] Test the health endpoint: `https://your-backend.onrender.com/api/health`

## Frontend Deployment (GitHub Pages)

### Method 1: GitHub Actions (Automatic) ✅ Recommended

1. [ ] Go to your GitHub repository
2. [ ] Navigate to **Settings** > **Pages**
3. [ ] Under **Source**, select **GitHub Actions**
4. [ ] Go to **Settings** > **Secrets and variables** > **Actions**
5. [ ] Click **New repository secret**
   - **Name**: `BACKEND_URL`
   - **Value**: Your Render backend URL (e.g., `https://file-transfer-backend.onrender.com`)
6. [ ] Merge your code to the `main` branch (or manually trigger the workflow)
7. [ ] Go to the **Actions** tab to monitor the deployment
8. [ ] Once complete, your site will be live at `https://yourusername.github.io/file/`

### Method 2: Manual Deployment

1. [ ] Clone the repository locally
2. [ ] Create `frontend/.env.local`:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```
3. [ ] Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
4. [ ] Create a `gh-pages` branch
5. [ ] Copy contents of `frontend/out/` to the root of `gh-pages` branch
6. [ ] Push to GitHub
7. [ ] Go to **Settings** > **Pages** and select `gh-pages` branch

## Post-Deployment Configuration

### Update Backend CORS

1. [ ] Edit `backend/server.js`
2. [ ] Update CORS configuration to allow your GitHub Pages domain:
   ```javascript
   app.use(cors({
     origin: ['https://yourusername.github.io', 'http://localhost:3000'],
     methods: ['GET', 'POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type']
   }));
   ```
3. [ ] Commit and push changes
4. [ ] Render will automatically redeploy

## Verification

1. [ ] Visit your GitHub Pages URL
2. [ ] Test uploading files
3. [ ] Verify you get a 6-digit code
4. [ ] Test downloading files with the code
5. [ ] Verify countdown timer works
6. [ ] Test "Download All as ZIP" feature
7. [ ] Check browser console for errors
8. [ ] Test on mobile device

## Optional: Custom Domain

1. [ ] Purchase a domain (e.g., from Namecheap, Google Domains)
2. [ ] In GitHub repository settings, go to **Pages**
3. [ ] Under **Custom domain**, enter your domain
4. [ ] Add DNS records as instructed by GitHub
5. [ ] Wait for DNS propagation (can take up to 24 hours)
6. [ ] Enable "Enforce HTTPS" once SSL certificate is issued

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `BACKEND_URL` secret is set correctly
- Ensure backend is using HTTPS

### 404 errors on page refresh
- GitHub Pages should handle this automatically with Next.js export
- Check that `.nojekyll` file exists in output

### Files not uploading
- Check browser console for errors
- Verify backend health endpoint is accessible
- Check network tab for failed requests

### Build fails on GitHub Actions
- Check the Actions logs
- Verify `package.json` and `package-lock.json` are committed
- Ensure Node.js version matches (18.x)

## Cost Estimate

- **GitHub Pages**: Free (for public repositories)
- **Render.com Free Tier**: 
  - 750 hours/month (enough for 1 service)
  - Spins down after 15 minutes of inactivity
  - 512 MB RAM
  - **Note**: Service will restart on first request after inactivity (cold start ~30 seconds)

## Security Recommendations

- [ ] Restrict CORS to your specific domain(s)
- [ ] Implement rate limiting (not included by default)
- [ ] Monitor backend logs for unusual activity
- [ ] Consider adding authentication for sensitive use cases
- [ ] Regularly update dependencies for security patches
