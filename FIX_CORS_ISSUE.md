# Fix S3 CORS Issue for KHPL Images

## 🚨 Problem
```
Access to fetch at 'https://khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com/images/KHPL-QR-CODE.jpeg' 
from origin 'https://main.d1zc6r51bs3tdm.amplifyapp.com' has been blocked by CORS policy
```

## 🔧 Solutions (Choose One)

### Solution 1: Configure S3 CORS (Recommended)

#### Step 1: Open AWS S3 Console
1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click on your bucket: `khpl-registration-data-unique-name`

#### Step 2: Configure CORS
1. Go to **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Replace with this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "PUT",
            "POST"
        ],
        "AllowedOrigins": [
            "https://main.d1zc6r51bs3tdm.amplifyapp.com",
            "https://*.amplifyapp.com",
            "http://localhost:3000",
            "https://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

#### Step 3: Make Images Public
1. Go to **Permissions** tab → **Block public access**
2. **Edit** → Uncheck "Block all public access"
3. **Save changes** → Type "confirm"

#### Step 4: Set Bucket Policy
1. Go to **Permissions** tab → **Bucket policy**
2. Click **Edit** and add:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::khpl-registration-data-unique-name/images/*"
        }
    ]
}
```

### Solution 2: Use CloudFront (Advanced)

#### Create CloudFront Distribution
1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. **Create Distribution**
3. **Origin Domain**: `khpl-registration-data-unique-name.s3.ap-south-1.amazonaws.com`
4. **Origin Path**: `/images`
5. **Viewer Protocol Policy**: Redirect HTTP to HTTPS
6. **Create Distribution**

#### Update App Configuration
Add to your `.env`:
```env
REACT_APP_CLOUDFRONT_DOMAIN=d123456789.cloudfront.net
```

### Solution 3: Quick Fix - Use Local Images (Immediate)

The app now automatically falls back to local images when S3 CORS fails. 

#### Upload Images to Public Folder
1. Copy `khpl.jpeg` to `public/khpl.jpeg`
2. Copy `KHPL-QR-CODE.jpeg` to `public/KHPL-QR-CODE.jpeg`
3. App will use these automatically

## ✅ Testing the Fix

### Test CORS Configuration
1. Open browser developer tools
2. Go to your KHPL app
3. Check console for:
   - `✅ Using public S3 URL for: khpl.jpeg`
   - `✅ Using public S3 URL for: KHPL-QR-CODE.jpeg`

### Test Fallback
If you see:
- `📱 Falling back to local images for: khpl.jpeg`

This means CORS is still blocking, but app is working with local fallback.

## 🎯 What I've Fixed in Code

1. **Enhanced Error Handling**: Better CORS error detection
2. **Smart Fallbacks**: Automatically uses local images if S3 fails
3. **Improved Logging**: Clear console messages about what's happening
4. **Simplified URLs**: Uses standard S3 URL format

## 🚀 Deploy the Fix

The code changes are ready to deploy:

```bash
# Build and test locally
npm run build
npm start

# The changes are already committed and will deploy automatically
# to your AWS Amplify app
```

## 📋 Immediate Action Required

**Choose one approach:**

🔥 **Quick (5 minutes)**: Use Solution 3 - just put images in public folder
⚡ **Best (10 minutes)**: Use Solution 1 - configure S3 CORS properly
🚀 **Advanced (30 minutes)**: Use Solution 2 - set up CloudFront

The app will work with any of these solutions!