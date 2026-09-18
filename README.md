# 🍔 Treat Tracker

> Modern Debt & Feast Ledger — Track friendly wagers, bet treats, and celebrate tasty victories with zero awkwardness.

Treat Tracker is a modern web application designed for friends, colleagues, and groups to log food bets, track owed treats, verify feast milestones, and preserve memorable photo evidence in an interactive gallery.

---

## ✨ Features

- **Google Authentication**: Sign in with Google via Firebase Auth.
- **Dynamic Leaderboards & Stats**: Real-time stats on feasts owed, treats won, and top treaters.
- **Event Timeline**: Track pending vs. settled treats with date, occasion, and restaurant tags.
- **Evidence & Photo Gallery**: Upload proof of feast celebrations (powered by Cloudinary).
- **Responsive & Modern Design**: Sleek dark aesthetics with fluid glassmorphism and micro-animations.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend & Database**: Firebase Authentication, Cloud Firestore
- **Media Storage**: Cloudinary (Unsigned Preset upload)
- **Deployment**: Vercel / Netlify ready

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Faiyazmahmud75/Treat-Tracker-.git
cd Treat-Tracker-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in your Firebase and Cloudinary credentials:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 🌐 Deployment

### Deploy on Vercel
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variables from your `.env` file in the Vercel Project Settings (`Environment Variables`).
4. Click **Deploy**. SPA routing rules are already configured in `vercel.json`.

### Deploy on Netlify
1. Import the repository in [Netlify](https://netlify.com).
2. Set build command to `npm run build` and publish directory to `dist`.
3. Add the environment variables in Netlify Site Configuration (`Environment variables`).
4. SPA routing is automatically handled via `public/_redirects`.
