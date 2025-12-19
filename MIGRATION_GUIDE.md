# KHPL Data Migration Guide: S3 → DynamoDB

This guide provides step-by-step instructions for safely migrating existing KHPL registration data from S3 to DynamoDB while preserving all records and uploading images.

## 🎯 Migration Overview

**What this migration does:**
1. ✅ **Preserves ALL existing records** - No data loss guaranteed
2. ✅ **Extracts images from base64** - Uploads to S3 as separate files
3. ✅ **Creates complete DynamoDB records** - With proper schema and metadata
4. ✅ **Creates automatic backups** - Before making any changes
5. ✅ **Handles errors gracefully** - Continues processing even if some records fail

## 📋 Prerequisites

### 1. Environment Variables Required
Create a `.env` file in your project root:
```env
# AWS Configuration
REACT_APP_AWS_REGION=ap-south-1
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_S3_BUCKET_NAME=your_bucket_name
REACT_APP_DYNAMODB_TABLE_NAME=KHPL-Registrations
REACT_APP_DYNAMODB_ENABLED=true
```

### 2. AWS Permissions Required
Your AWS user/role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/KHPL-Registrations"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## 🚀 Migration Steps

### Step 1: Install Dependencies
```bash
# Install required AWS SDK packages
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3

# Optional: Install dotenv for .env file support
npm install dotenv
```

### Step 2: Verify Current Data
```bash
# Check what data exists in S3 and DynamoDB
node scripts/verifyMigration.js
```

Expected output:
```
🔍 Verifying KHPL Data Migration Status
=====================================
📊 Loading data from both sources...

📈 Data Summary:
   • S3 Records: 25
   • DynamoDB Records: 0

⚠️ Records needing migration (in S3 only):
   1. John Doe (KHPL_1701234567_abc123)
   2. Jane Smith (KHPL_1701234568_def456)
   ...

📊 Overall Status:
⚠️ Migration needed - some records only exist in S3
💡 Run: node scripts/migrateS3ToDynamoDB.js
```

### Step 3: Create DynamoDB Table
```bash
# Create the DynamoDB table if it doesn't exist
node scripts/createDynamoTable.js
```

### Step 4: Run Migration (Dry Run First)
```bash
# Test migration without making changes
node scripts/migrateS3ToDynamoDB.js
```

The script runs in safe mode by default. Review the output carefully.

### Step 5: Run Actual Migration
Edit the migration script to set `dryRun: false` or the script will automatically run the actual migration after dry run confirmation.

```bash
# Run the actual migration
node scripts/migrateS3ToDynamoDB.js
```

### Step 6: Verify Migration Success
```bash
# Verify all data was migrated correctly
node scripts/verifyMigration.js
```

Expected output after successful migration:
```
📈 Data Summary:
   • S3 Records: 25
   • DynamoDB Records: 25

🔍 Migration Analysis:
   • Records in both S3 and DynamoDB: 25
   • Records marked as migrated: 25
   • Records only in S3: 0
   • Records only in DynamoDB: 0

✅ Successfully migrated records:
   📅 2025-12-19: 25 records
      📸 Total images: 75

📊 Overall Status:
✅ Migration appears complete - all S3 records found in DynamoDB
```

## 📊 Migration Process Details

### What Happens to Each Record:

1. **Record Loading**: Loads from S3 `registrations.json`
2. **Duplicate Check**: Verifies record doesn't already exist in DynamoDB
3. **Image Processing**: 
   - Extracts base64 image data
   - Uploads to S3 as separate files
   - Creates S3 keys: `registration-images/{recordId}/{imageName}.{ext}`
4. **Data Sanitization**: 
   - Removes base64 data to save space
   - Adds migration metadata
   - Ensures DynamoDB compatibility
5. **DynamoDB Storage**: Saves complete record with image references

### Image Migration Example:
```
Original S3 Record:
{
  "id": "KHPL_123",
  "name": "John Doe",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "aadhaarCopy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}

After Migration:
DynamoDB Record:
{
  "id": "KHPL_123",
  "name": "John Doe",
  "imageUploadResults": {
    "userPhoto": {
      "s3Key": "registration-images/KHPL_123/userPhoto.jpeg",
      "mimeType": "image/jpeg"
    },
    "aadhaar": {
      "s3Key": "registration-images/KHPL_123/aadhaar.png", 
      "mimeType": "image/png"
    }
  },
  "migratedFrom": "S3",
  "migrationDate": "2025-12-19T10:30:00.000Z"
}

S3 Images:
- registration-images/KHPL_123/userPhoto.jpeg
- registration-images/KHPL_123/aadhaar.png
```

## 🛡️ Safety Features

### 1. Automatic Backups
- Creates timestamped backup of original S3 data
- Backup key: `migration-backup-2025-12-19T10:30:00.000Z-registrations.json`
- Original data never modified

### 2. Duplicate Protection
- Checks if record already exists in DynamoDB
- Skips existing records to prevent overwrites
- Safe to run multiple times

### 3. Error Handling
- Continues processing even if individual records fail
- Detailed error reporting
- Batch processing to avoid overwhelming AWS

### 4. Rollback Capability
If migration fails, your original data is safe:
- S3 `registrations.json` remains unchanged
- Backup files are created automatically
- DynamoDB records can be deleted if needed

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing AWS credentials"**
   - Check your `.env` file exists
   - Verify AWS access keys are correct

2. **"Table does not exist"**
   - Run `node scripts/createDynamoTable.js` first

3. **"Access denied"**
   - Check AWS IAM permissions
   - Ensure user has DynamoDB and S3 access

4. **"Some records failed"**
   - Check error details in output
   - Re-run migration (skips successful records)
   - Individual failures won't affect other records

### Getting Help:
- Check AWS CloudWatch logs
- Verify S3 bucket access
- Ensure DynamoDB table permissions

## ✅ Post-Migration Checklist

- [ ] Run verification script shows 100% success
- [ ] Test admin panel loads migrated data
- [ ] Verify images display correctly
- [ ] Check backup files were created
- [ ] Update application to use DynamoDB-only mode
- [ ] Consider archiving old S3 `registrations.json`

## 🎉 Migration Complete!

After successful migration:
- All existing records preserved in DynamoDB
- Images uploaded to S3 with proper organization
- Application ready for production use
- Full data integrity maintained