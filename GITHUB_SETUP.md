# GitHub Setup Guide for KHPL Registration Data Storage

## Overview
This guide helps you set up GitHub as the storage backend for KHPL registration data instead of localStorage.

## Prerequisites
- GitHub account
- GitHub repository to store data

## Step 1: Create GitHub Repository
1. Go to https://github.com and create a new repository
2. Name it `khpl-data` (or any name you prefer)
3. Make it **Private** for security (recommended)
4. Initialize with README (optional)

## Step 2: Generate Personal Access Token
1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Set expiration (recommend: 90 days or custom)
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

## Step 3: Configure Application
1. Update `src/utils/githubStorage.js`:
   ```javascript
   const GITHUB_CONFIG = {
     owner: 'your-actual-username',     // Your GitHub username
     repo: 'khpl-data',                 // Your repository name
     token: process.env.REACT_APP_GITHUB_TOKEN,
     branch: 'main'
   };
   ```

2. Create `.env` file in root directory:
   ```
   REACT_APP_GITHUB_TOKEN=your_actual_token_here
   ```

## Step 4: Test Configuration
1. Start the application: `npm start`
2. Register a test user
3. Check your GitHub repository for `registrations.json` file

## Step 5: Security Considerations
- Never commit `.env` file to version control
- Use repository secrets for production deployments
- Regenerate tokens periodically
- Use private repositories for sensitive data

## Backup Strategy
- GitHub serves as primary storage
- localStorage serves as fallback/cache
- Excel exports available from admin panel

## File Structure in GitHub
```
your-repo/
├── registrations.json    # All registration data
├── backup-YYYYMMDD.json  # Daily backups (optional)
└── README.md            # Repository documentation
```

## Troubleshooting
- If GitHub API fails, data falls back to localStorage
- Check browser console for GitHub API errors
- Verify token permissions and repository access
- Ensure token hasn't expired

## Production Deployment
For production environments:
1. Use GitHub Secrets or environment variables
2. Consider using GitHub Apps instead of personal tokens
3. Implement proper error handling and retry logic
4. Set up automated backups