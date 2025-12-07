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
7. **Add Environment Variables**:
   ```
   REACT_APP_GITHUB_TOKEN = [Your GitHub Personal Access Token]
   REACT_APP_GITHUB_STORAGE = true
   REACT_APP_GITHUB_OWNER = pavanreddy2928
   REACT_APP_GITHUB_REPO = KHPL
   ```
   
   > **Important**: Replace `[Your GitHub Personal Access Token]` with your actual token from the GITHUB_SETUP.md guide
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