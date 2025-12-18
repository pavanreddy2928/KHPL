// Script to upload KHPL images to S3 bucket
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS (make sure you have credentials configured)
// You can set these via environment variables or AWS credentials file
const s3 = new AWS.S3({
  region: 'ap-south-1' // Mumbai region
});

const BUCKET_NAME = 'khpl-registration-data-unique-name';

async function uploadImage(imagePath, key) {
  try {
    const fileContent = fs.readFileSync(imagePath);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: 'image/jpeg',
      ACL: 'public-read' // Make images publicly readable
    };

    const result = await s3.upload(params).promise();
    console.log(`✅ Successfully uploaded ${key} to ${result.Location}`);
    return result;
  } catch (error) {
    console.error(`❌ Error uploading ${key}:`, error.message);
    return null;
  }
}

async function uploadAllImages() {
  console.log('🚀 Starting image upload to S3...');
  
  // Upload KHPL logo
  await uploadImage(
    path.join(__dirname, '../public/khpl.jpeg'),
    'images/khpl.jpeg'
  );
  
  // Upload QR Code
  await uploadImage(
    path.join(__dirname, '../public/KHPL-QR-CODE.jpeg'),
    'images/KHPL-QR-CODE.jpeg'
  );
  
  // Upload Main Background
  await uploadImage(
    path.join(__dirname, '../src/mainbackground.jpeg'),
    'images/mainbackground.jpeg'
  );
  
  console.log('🎯 Image upload process completed!');
}

// Run the upload
uploadAllImages().catch(console.error);