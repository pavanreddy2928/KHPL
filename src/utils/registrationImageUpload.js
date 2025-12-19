// Registration Image Upload Utility for KHPL
// Handles uploading user registration images to S3 with registration ID prefix

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS S3 Configuration
const S3_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION || 'ap-south-1',
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'khpl-registration-data-unique-name',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  enabled: process.env.REACT_APP_S3_STORAGE === 'true'
};

// Initialize S3 Client
let s3Client = null;

const initializeS3Client = () => {
  console.log('🔧 S3 Config check:', {
    enabled: S3_CONFIG.enabled,
    region: S3_CONFIG.region,
    bucket: S3_CONFIG.bucketName,
    hasAccessKey: !!S3_CONFIG.accessKeyId,
    hasSecretKey: !!S3_CONFIG.secretAccessKey
  });
  
  if (!S3_CONFIG.enabled || !S3_CONFIG.accessKeyId || !S3_CONFIG.secretAccessKey) {
    console.warn('⚠️ S3 client initialization failed - missing configuration');
    return null;
  }

  try {
    s3Client = new S3Client({
      region: S3_CONFIG.region,
      credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey,
      },
    });
    console.log('✅ S3 client initialized successfully');
    return s3Client;
  } catch (error) {
    console.error('❌ Error initializing S3 client:', error);
    return null;
  }
};

// Upload registration image to S3 with registration ID prefix
export const uploadRegistrationImageToS3 = async (imageFile, registrationId, imageType) => {
  console.log(`🚀 Starting upload for ${imageType}:`, {
    fileName: imageFile?.name,
    size: imageFile?.size,
    type: imageFile?.type,
    registrationId
  });
  
  const client = initializeS3Client();
  
  if (!client) {
    console.warn('⚠️ S3 not configured - skipping image upload');
    return { success: false, reason: 'S3 not configured' };
  }

  if (!imageFile) {
    console.error('❌ No image file provided for', imageType);
    return { success: false, reason: 'No image file provided' };
  }

  try {
    // Generate unique filename with registration ID prefix
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `${registrationId}_${imageType}_${timestamp}.${fileExtension}`;
    const s3Key = `registration-attachments/${fileName}`;

    console.log(`📁 Uploading ${imageType} to S3:`, s3Key);

    const arrayBuffer = await imageFile.arrayBuffer();
    
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: s3Key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: imageFile.type || 'image/jpeg',
      // Removed ACL since bucket doesn't support ACLs
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'registration-id': registrationId,
        'image-type': imageType,
        'original-filename': imageFile.name,
        'source': 'khpl-registration-app'
      }
    });

    await client.send(command);
    
    // Since ACLs are disabled, we'll store the S3 key for later retrieval
    // The actual URL will be generated when needed using presigned URLs
    const s3Url = `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${s3Key}`;
    
    console.log(`✅ Successfully uploaded ${imageType} to S3 key:`, s3Key);
    
    return {
      success: true,
      url: s3Url, // Note: This may not be directly accessible without proper bucket policy
      s3Key: s3Key,
      fileName: fileName,
      size: imageFile.size,
      type: imageFile.type,
      uploadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Failed to upload ${imageType} to S3:`, error);
    return {
      success: false,
      error: error.message,
      reason: 'Upload failed'
    };
  }
};

// Upload multiple registration images
export const uploadMultipleRegistrationImages = async (registrationId, imageFiles) => {
  const uploadPromises = [];
  const results = {};

  // Process each image type
  for (const [imageType, file] of Object.entries(imageFiles)) {
    if (file) {
      uploadPromises.push(
        uploadRegistrationImageToS3(file, registrationId, imageType)
          .then(result => {
            results[imageType] = result;
            return result;
          })
          .catch(error => {
            results[imageType] = { success: false, error: error.message };
            return { success: false, error: error.message };
          })
      );
    }
  }

  try {
    await Promise.all(uploadPromises);
    
    // Count successful uploads
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    
    console.log(`📊 Upload Summary: ${successful}/${total} images uploaded successfully`);
    
    return {
      success: successful > 0,
      results: results,
      summary: {
        total: total,
        successful: successful,
        failed: total - successful
      }
    };
    
  } catch (error) {
    console.error('❌ Error in batch upload:', error);
    return {
      success: false,
      error: error.message,
      results: results
    };
  }
};

// Generate S3 URL for existing image
export const getRegistrationImageUrl = (registrationId, imageType, fileName) => {
  if (!S3_CONFIG.enabled) {
    return null;
  }
  
  const s3Key = fileName || `${registrationId}_${imageType}`;
  return `https://${S3_CONFIG.bucketName}.s3.amazonaws.com/registration-attachments/${s3Key}`;
};

// Generate presigned URL for accessing S3 image (secure access without ACLs)
export const generatePresignedUrl = async (s3Key, expiresIn = 3600) => {
  const client = initializeS3Client();
  
  if (!client) {
    console.warn('⚠️ S3 client not available');
    return null;
  }

  if (!s3Key) {
    console.warn('⚠️ No S3 key provided');
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn });
    
    console.log('✅ Generated presigned URL for:', s3Key);
    
    return presignedUrl;
    
  } catch (error) {
    console.error('❌ Failed to generate presigned URL:', error);
    return null;
  }
};

// Load registration image from S3 using presigned URL
export const loadRegistrationImageFromS3 = async (s3Key) => {
  if (!s3Key) {
    console.warn('⚠️ No S3 key provided');
    return null;
  }

  if (!S3_CONFIG.enabled) {
    console.warn('⚠️ S3 not enabled');
    return null;
  }

  try {
    console.log(`🔍 Generating presigned URL for: ${s3Key}`);
    
    // Generate presigned URL for secure access
    const presignedUrl = await generatePresignedUrl(s3Key, 7200); // 2 hours expiry
    
    if (presignedUrl) {
      console.log(`✅ S3 presigned URL generated: ${s3Key}`);
      return presignedUrl;
    } else {
      console.warn(`⚠️ Failed to generate presigned URL: ${s3Key}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error loading image from S3: ${s3Key}`, error.message);
    return null;
  }
};

// Load multiple registration images from S3
export const loadMultipleRegistrationImages = async (imageResults) => {
  if (!imageResults || typeof imageResults !== 'object') {
    return {};
  }

  const loadPromises = [];
  const imageTypes = Object.keys(imageResults);

  imageTypes.forEach(imageType => {
    const imageData = imageResults[imageType];
    if (imageData && imageData.s3Key) {
      loadPromises.push(
        loadRegistrationImageFromS3(imageData.s3Key)
          .then(url => ({ type: imageType, url, success: !!url }))
          .catch(error => ({ type: imageType, url: null, success: false, error: error.message }))
      );
    }
  });

  try {
    const results = await Promise.all(loadPromises);
    const loadedImages = {};

    results.forEach(result => {
      loadedImages[result.type] = {
        url: result.url,
        success: result.success,
        error: result.error
      };
    });

    console.log(`📊 Loaded ${results.filter(r => r.success).length}/${results.length} images from S3`);
    return loadedImages;
  } catch (error) {
    console.error('❌ Error in batch image loading:', error);
    return {};
  }
};

export default {
  uploadRegistrationImageToS3,
  uploadMultipleRegistrationImages,
  getRegistrationImageUrl,
  loadRegistrationImageFromS3,
  loadMultipleRegistrationImages,
  config: S3_CONFIG
};