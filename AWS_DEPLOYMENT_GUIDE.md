# AWS Deployment Guide for KHPL React App

## Prerequisites
1. AWS Account (free tier eligible)
2. AWS CLI installed and configured
3. Your React app built and ready

## Deployment Options

### Option 1: AWS Amplify (Recommended - Easiest)

#### Step 1: Prepare Your Code
```bash
# Build the production version
npm run build

# Create a GitHub repository (if not already done)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/pavanreddy2928/KHPL.git
git push -u origin main
```

#### Step 2: Deploy with Amplify
1. Go to AWS Console → AWS Amplify
2. Click "New app" → "Host web app"
3. Choose "GitHub" as source
4. Select your KHPL repository
5. Configure build settings:
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - npm install
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: build
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
   ```
6. Add environment variables:
   - REACT_APP_GITHUB_TOKEN: `your_token_here`
   - REACT_APP_GITHUB_STORAGE: `true`
   - REACT_APP_GITHUB_OWNER: `pavanreddy2928`
   - REACT_APP_GITHUB_REPO: `KHPL`

### Option 2: Amazon S3 + CloudFront

#### Step 1: Create S3 Bucket
```bash
# Create bucket (replace with unique name)
aws s3 mb s3://khpl-cricket-app-unique-name

# Configure for static website hosting
aws s3 website s3://khpl-cricket-app-unique-name --index-document index.html --error-document index.html
```

#### Step 2: Build and Upload
```bash
# Build the app
npm run build

# Upload to S3
aws s3 sync build/ s3://khpl-cricket-app-unique-name --delete

# Set public read permissions
aws s3api put-bucket-policy --bucket khpl-cricket-app-unique-name --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::khpl-cricket-app-unique-name/*"
    }
  ]
}'
```

#### Step 3: Create CloudFront Distribution
1. Go to CloudFront in AWS Console
2. Create Distribution
3. Origin Domain: your-s3-bucket.s3-website-region.amazonaws.com
4. Default Root Object: index.html
5. Error Pages: Add custom error response for 404 → /index.html (for React routing)

### Option 3: AWS App Runner (For Node.js backend if needed)

If you want to add a backend later, App Runner is good for containerized apps.

## Environment Variables Security

### For Production Deployment:
1. **Never commit .env to GitHub**
2. **Use AWS Systems Manager Parameter Store**:
   ```bash
   # Store GitHub token securely
   aws ssm put-parameter --name "/khpl/github-token" --value "your_token" --type "SecureString"
   ```

3. **Update your app to use Parameter Store** (optional advanced setup):
   ```javascript
   // In production, fetch from AWS Parameter Store
   const getParameter = async (name) => {
     const AWS = require('aws-sdk');
     const ssm = new AWS.SSM();
     const result = await ssm.getParameter({
       Name: name,
       WithDecryption: true
     }).promise();
     return result.Parameter.Value;
   };
   ```

## Cost Optimization (Free Tier)

### AWS Amplify Free Tier:
- 1,000 build minutes per month
- 15 GB served per month
- 5 GB storage per month

### S3 + CloudFront Free Tier:
- 5 GB S3 storage
- 20,000 GET requests
- 50 GB CloudFront data transfer

## Recommended Steps for Your App:

1. **Use AWS Amplify** - simplest for React apps
2. **Push code to GitHub** first
3. **Set up environment variables** in Amplify console
4. **Configure custom domain** (optional)

## Custom Domain Setup (Optional):
1. Purchase domain in Route 53 or use existing
2. In Amplify: Domain management → Add domain
3. Follow DNS verification steps

## Monitoring:
- CloudWatch logs (free tier: 5 GB)
- Amplify provides built-in monitoring
- Set up billing alerts

Would you like me to help you with any specific step?