# AWS S3 Setup Guide for KHPL Registration Data Storage

## 🚀 Why AWS S3?

AWS S3 Free Tier includes:
- ✅ **5 GB storage** (more than enough for registration data)
- ✅ **20,000 GET requests/month** (data loading)
- ✅ **2,000 PUT requests/month** (data saving)
- ✅ **15 GB data transfer out/month**
- ✅ **Free for 12 months** (new AWS accounts)

## 🔧 Setup Steps

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow signup process (requires credit card for verification, but won't be charged for free tier usage)

### Step 2: Create S3 Bucket
1. Go to AWS Console → S3
2. Click "Create bucket"
3. **Bucket name**: `khpl-registration-data-unique-name` (must be globally unique)
4. **Region**: Choose closest to your users (e.g., `us-east-1`, `ap-south-1` for India)
5. **Block Public Access**: Keep default settings (all blocked for security)
6. Click "Create bucket"

### Step 3: Create IAM User for App Access
1. Go to AWS Console → IAM
2. Click "Users" → "Create user"
3. **Username**: `khpl-app-user`
4. **Access type**: Programmatic access
5. **Permissions**: Click "Attach policies directly"
6. Search and select: `AmazonS3FullAccess` (or create custom policy below)
7. Complete user creation
8. **Important**: Copy the Access Key ID and Secret Access Key (you won't see them again!)

### Step 4: Configure Environment Variables
Update your `.env` file:

```env
# AWS S3 Configuration
REACT_APP_S3_STORAGE=true
REACT_APP_AWS_REGION=us-east-1
REACT_APP_S3_BUCKET_NAME=khpl-registration-data-unique-name
REACT_APP_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
REACT_APP_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Step 5: Install AWS SDK
```bash
npm install @aws-sdk/client-s3
```

### Step 6: Test Connection
The app will automatically test S3 connection when you use the admin panel.

## 🔒 Security Best Practices

### Custom IAM Policy (Recommended)
Instead of `AmazonS3FullAccess`, create a custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::khpl-registration-data-unique-name",
                "arn:aws:s3:::khpl-registration-data-unique-name/*"
            ]
        }
    ]
}
```

### Environment Security
- Never commit `.env` file to GitHub
- Use AWS Secrets Manager for production
- Rotate access keys regularly
- Use IAM roles instead of keys for EC2/Lambda deployments

## 📊 AWS S3 vs Other Storage Options

| Feature | AWS S3 | GitHub | Firebase |
|---------|---------|---------|----------|
| Free Storage | 5 GB | Git repo size limit | 1 GB |
| Requests/month | 22K total | API rate limited | 50K reads |
| File Upload | Direct | API only | Direct |
| Reliability | 99.999999999% | 99.9% | 99.95% |
| Global CDN | Yes | No | Yes |

## 🚀 Usage in Your App

The app will automatically use S3 when configured:

```javascript
import { saveRegistrationData, loadRegistrationData, verifyS3Access } from './utils/awsS3Storage';

// Save registration
const result = await saveRegistrationData(registrationData);
if (result.success) {
    console.log('Saved to:', result.storage); // 'S3' or 'localStorage'
}

// Load registrations
const data = await loadRegistrationData();

// Test connection
const status = await verifyS3Access();
if (status.success) {
    console.log('S3 connected to bucket:', status.bucket);
}
```

## 💰 Cost Monitoring

Set up billing alerts:
1. AWS Console → Billing → Billing preferences
2. Enable "Receive billing alerts"
3. Create CloudWatch alarm for $1+ charges

## 🔄 Migration from GitHub Storage

Your app will automatically migrate:
1. Existing localStorage data works as before
2. S3 becomes primary storage when configured
3. localStorage serves as backup/fallback
4. No data loss during transition

## 🛠️ Troubleshooting

### Common Issues:

**❌ "Access Denied"**
- Check IAM user permissions
- Verify bucket policy
- Ensure credentials are correct

**❌ "NoSuchBucket"**
- Verify bucket name in .env
- Check bucket exists in correct region
- Ensure bucket name is globally unique

**❌ "CredentialsError"**
- Check access keys in .env
- Verify IAM user exists
- Ensure keys haven't expired

### Debug Steps:
1. Check browser console for detailed errors
2. Use admin panel "Test S3" button
3. Verify AWS credentials work in AWS CLI
4. Check S3 bucket permissions

## 📞 Support
- AWS Free Tier: https://aws.amazon.com/free/
- S3 Pricing: https://aws.amazon.com/s3/pricing/
- IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

---

**Ready to deploy? Your KHPL registration data will be securely stored in AWS S3 with automatic fallback to localStorage!** 🏏