# File Transfer - Temporary File Sharing App

A complete, production-ready temporary file-sharing web application inspired by filetransfer.io. Share files securely using 6-digit codes with automatic deletion after 10 minutes.

## Features

- **Secure Code-Based Access**: No public links - files are only accessible with a unique 6-digit code
- **Automatic Deletion**: Files are permanently deleted after exactly 10 minutes
- **Drag & Drop Upload**: Easy file upload with progress tracking
- **Multiple File Support**: Upload up to 10 files (max 200MB total)
- **Download Options**: Download individual files or all files as a ZIP
- **Live Countdown Timer**: See exactly how much time remains before deletion
- **No User Accounts**: Completely anonymous and temporary
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

This is a monorepo with two separate projects:

### Frontend (`/frontend`)
- **Technology**: Next.js 14 with Pages Router
- **Build**: Static export (`next export`) for GitHub Pages deployment
- **Features**: 
  - Drag-and-drop file upload
  - Real-time progress bars
  - Countdown timers
  - Clipboard integration
  - Responsive UI

### Backend (`/backend`)
- **Technology**: Node.js + Express
- **Deployment**: Render.com Web Service compatible
- **Features**:
  - File upload with size/count validation
  - Unique code generation (no collisions)
  - Automatic 10-minute cleanup
  - On-the-fly ZIP generation
  - In-memory transfer tracking

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SystemInfomation/file.git
cd file
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running Locally

1. Start the backend server:
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3001`

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

3. Open `http://localhost:3000` in your browser

### Development Mode

For backend hot-reload:
```bash
cd backend
npm run dev
```

## Deployment

### Backend (Render.com)

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: 
     - `PORT`: (auto-set by Render)
     - `UPLOADS_DIR`: `/tmp` (recommended for Render)

4. Deploy and note your service URL (e.g., `https://your-app.onrender.com`)

### Frontend (GitHub Pages)

#### Option 1: Automatic Deployment (Recommended)

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the main branch.

1. Go to your GitHub repository settings
2. Navigate to **Settings** > **Pages**
3. Under **Source**, select **GitHub Actions**
4. Add your backend URL as a repository secret:
   - Go to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Name: `BACKEND_URL`
   - Value: `https://your-backend.onrender.com` (your Render backend URL)
5. Push to the main branch or manually trigger the workflow
6. Your site will be available at `https://yourusername.github.io/file/`

#### Option 2: Manual Deployment

1. Update the backend URL:
   - Create `.env.local` in frontend directory:
     ```
     NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
     ```
   - Or update `frontend/config.js` directly

2. Build the static site:
```bash
cd frontend
npm run build
```

3. The static files will be in `frontend/out/`

4. Deploy to GitHub Pages:
   - Create a new branch (e.g., `gh-pages`)
   - Copy the contents of `frontend/out/` to the root of this branch
   - Push to GitHub
   - Enable GitHub Pages in repository settings, pointing to the `gh-pages` branch

## Configuration

### Backend Environment Variables

- `PORT`: Server port (default: 3001)
- `UPLOADS_DIR`: Directory for temporary file storage (default: `./uploads`)

### Frontend Environment Variables

- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL (default: `http://localhost:3001`)

### Important Notes for GitHub Pages Deployment

1. **CORS Configuration**: Ensure your backend CORS settings allow requests from your GitHub Pages domain
2. **HTTPS Required**: GitHub Pages serves over HTTPS, so your backend must support HTTPS (Render.com provides this automatically)
3. **Backend URL**: Set the `BACKEND_URL` secret in your GitHub repository for automatic deployments
4. **Custom Domain**: You can configure a custom domain in GitHub Pages settings if desired
5. **Base Path**: This setup works for repository pages (e.g., `username.github.io/file/`)

## Usage

### Sending Files

1. Go to the home page
2. Drag & drop files or click to select (max 10 files, 200MB total)
3. Click "Upload Files"
4. Get your 6-digit code and share it with the recipient
5. Files will be automatically deleted after 10 minutes

### Receiving Files

1. Click "Receive Files" or go to `/receive`
2. Enter the 6-digit code
3. Download individual files or all as ZIP
4. Files remain available until the 10-minute timer expires

## Technical Details

### File Storage
- Files are stored with UUID filenames to prevent collisions
- Original filenames are preserved in metadata
- Automatic cleanup after 10 minutes, even if not downloaded

### Code Generation
- Random 6-digit codes (100000-999999)
- Collision detection and regeneration
- No leading zeros for better UX

### Security
- No permanent storage
- No public file listing
- CORS enabled (configure for production)
- File size and count validation

## Project Structure

```
file/
├── backend/
│   ├── server.js           # Express server
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── pages/
│   │   ├── index.js        # Upload page
│   │   ├── success.js      # Success with code
│   │   ├── receive.js      # Enter code
│   │   └── download.js     # Download files
│   ├── styles/
│   │   └── globals.css     # Global styles
│   ├── config.js           # Backend URL config
│   ├── next.config.js      # Next.js config
│   └── package.json
└── README.md
```

## License

MIT
