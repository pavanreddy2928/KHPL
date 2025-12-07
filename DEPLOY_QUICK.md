# Deploy KHPL to AWS - Quick Start

## 🚀 Fastest Method: AWS Amplify

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "KHPL React App - Initial commit"
git branch -M main
git remote add origin https://github.com/pavanreddy2928/KHPL.git
git push -u origin main
```

### Step 2: Deploy with Amplify
1. **Login to AWS Console**
2. **Search "Amplify"** → Open AWS Amplify
3. **Click "New app"** → "Host web app"
4. **Select "GitHub"** → Authorize AWS to access your repos
5. **Choose your KHPL repository**
6. **Configure build**:
   - Branch: `main` 
   - Build settings: Auto-detected (React)
7. **Add Environment Variables** (Choose AWS S3 OR GitHub):
   
   **Option A: AWS S3 Storage (Recommended - 5GB Free)**
   ```
   REACT_APP_S3_STORAGE=true
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_S3_BUCKET_NAME=khpl-registration-data
   REACT_APP_AWS_ACCESS_KEY_ID=[Your AWS Access Key]
   REACT_APP_AWS_SECRET_ACCESS_KEY=[Your AWS Secret Key]
   ```
   
   **Option B: GitHub Storage**
   ```
   REACT_APP_GITHUB_TOKEN=[Your GitHub Personal Access Token]
   REACT_APP_GITHUB_STORAGE=true
   REACT_APP_GITHUB_OWNER=pavanreddy2928
   REACT_APP_GITHUB_REPO=KHPL
   ```
   
   > **Setup Guide**: See `AWS_S3_SETUP.md` for AWS setup or `GITHUB_SETUP.md` for GitHub setup
8. **Click "Save and Deploy"**

### Step 3: Get Your URL
- Amplify will provide a URL like: `https://main.d1234567890.amplifyapp.com`
- Your KHPL cricket registration app is now live! 🏏

## 💰 Cost: FREE (within limits)
- ✅ 1,000 build minutes/month
- ✅ 15 GB bandwidth/month  
- ✅ Perfect for cricket league website

## 🔄 Auto-Deploy
Every time you push to GitHub, AWS automatically rebuilds and deploys your app!

## 🌐 Custom Domain (Optional)
In Amplify console: Domain management → Add your own domain

---

**Need help?** The full deployment guide is in `AWS_DEPLOYMENT_GUIDE.md`