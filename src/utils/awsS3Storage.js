// AWS S3 Storage Utility for KHPL Registration Data
// Uses AWS S3 free tier: 5 GB storage, 20,000 GET requests, 2,000 PUT requests per month

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// AWS S3 Configuration
const S3_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1', // Change to your preferred region
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'khpl-registration-data-unique-name',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  enabled: process.env.REACT_APP_S3_STORAGE === 'true'
};

// Initialize S3 Client
let s3Client = null;

const initializeS3Client = () => {
  if (!S3_CONFIG.enabled || !S3_CONFIG.accessKeyId || !S3_CONFIG.secretAccessKey) {
    console.log('AWS S3 storage not configured, using localStorage only');
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
    return s3Client;
  } catch (error) {
    console.error('Failed to initialize S3 client:', error);
    return null;
  }
};

// Verify S3 Access
export const verifyS3Access = async () => {
  const client = initializeS3Client();
  if (!client) {
    return { success: false, reason: 'S3 not configured' };
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: 'test-connection.json'
    });

    await client.send(command);
    return { success: true, bucket: S3_CONFIG.bucketName, region: S3_CONFIG.region };
  } catch (error) {
    if (error.name === 'NotFound') {
      // Bucket exists but file doesn't - this is fine
      return { success: true, bucket: S3_CONFIG.bucketName, region: S3_CONFIG.region };
    } else if (error.name === 'NoSuchBucket') {
      return { success: false, reason: 'Bucket does not exist', code: 404 };
    } else if (error.name === 'AccessDenied') {
      return { success: false, reason: 'Access denied - check credentials', code: 403 };
    } else {
      return { success: false, reason: `S3 error: ${error.message}`, code: error.$metadata?.httpStatusCode };
    }
  }
};

// Save data to S3
export const saveToS3 = async (filename, data) => {
  const client = initializeS3Client();
  if (!client) {
    return { success: false, reason: 'S3 not configured' };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: filename,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'source': 'khpl-react-app'
      }
    });

    await client.send(command);
    console.log('Successfully saved to S3:', filename);
    return { success: true };
  } catch (error) {
    console.error('S3 save error:', error);
    
    if (error.name === 'NoSuchBucket') {
      console.error('❌ S3 Bucket Not Found');
      console.error('📝 To fix this:');
      console.error('   1. Create S3 bucket:', S3_CONFIG.bucketName);
      console.error('   2. Or update REACT_APP_S3_BUCKET_NAME in .env');
      return { success: false, error: 'Bucket not found', code: 404 };
    } else if (error.name === 'AccessDenied') {
      console.error('❌ S3 Access Denied');
      console.error('📝 To fix this:');
      console.error('   1. Check AWS credentials in .env file');
      console.error('   2. Ensure IAM user has S3 permissions');
      console.error('   3. Verify bucket policy allows writes');
      return { success: false, error: 'Access denied', code: 403 };
    } else {
      return { success: false, error: error.message, code: error.$metadata?.httpStatusCode };
    }
  }
};

// Load data from S3
export const loadFromS3 = async (filename) => {
  const client = initializeS3Client();
  if (!client) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: filename,
    });

    const response = await client.send(command);
    const body = await response.Body.transformToString();
    
    console.log('Successfully loaded from S3:', filename);
    return JSON.parse(body);
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.log('File not found on S3 (normal for first registration):', filename);
      return null;
    } else if (error.name === 'NoSuchBucket') {
      console.error('❌ S3 Bucket Not Found:', S3_CONFIG.bucketName);
      return null;
    } else if (error.name === 'AccessDenied') {
      console.error('❌ S3 Access Denied for file:', filename);
      return null;
    } else {
      console.error('S3 load error:', error);
      return null;
    }
  }
};

// Enhanced save function with fallback to localStorage
export const saveRegistrationData = async (data) => {
  try {
    // Get existing data from S3 or create new array
    const existingData = await loadFromS3('registrations.json') || [];
    console.log(`📊 Current registration count: ${existingData.length}`);
    
    // Generate unique ID based on timestamp and random string
    const uniqueId = data.id || `KHPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add new registration
    const newRegistration = {
      ...data,
      id: uniqueId,
      timestamp: new Date().toISOString(),
      source: 'khpl-web-app'
    };
    
    existingData.push(newRegistration);
    console.log(`✅ Adding new registration with ID: ${uniqueId}, Total records: ${existingData.length}`);
    
    // Try to save to S3
    const s3Result = await saveToS3('registrations.json', existingData);
    
    if (s3Result.success) {
      console.log('✅ Registration saved to AWS S3 successfully');
      // Also save to localStorage as backup
      localStorage.setItem('khplRegistrations', JSON.stringify(existingData));
      return { success: true, storage: 'S3', data: newRegistration };
    } else {
      console.log('⚠️ S3 save failed, using localStorage fallback');
      // Fallback to localStorage
      const localData = JSON.parse(localStorage.getItem('khplRegistrations') || '[]');
      const localRegistration = {
        ...newRegistration,
        id: newRegistration.id || `KHPL_LOCAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      localData.push(localRegistration);
      localStorage.setItem('khplRegistrations', JSON.stringify(localData));
      return { success: true, storage: 'localStorage', data: localRegistration };
    }
  } catch (error) {
    console.error('Registration save error:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced load function with fallback to localStorage
export const loadRegistrationData = async () => {
  try {
    // Try S3 first
    const s3Data = await loadFromS3('registrations.json');
    
    if (s3Data && Array.isArray(s3Data)) {
      console.log('✅ Loaded registration data from AWS S3');
      // Update localStorage as backup
      localStorage.setItem('khplRegistrations', JSON.stringify(s3Data));
      return s3Data;
    }
    
    // Fallback to localStorage
    console.log('📱 Loading registration data from localStorage (S3 fallback)');
    const localData = JSON.parse(localStorage.getItem('khplRegistrations') || '[]');
    return localData;
  } catch (error) {
    console.error('Registration load error:', error);
    // Final fallback to localStorage
    const localData = JSON.parse(localStorage.getItem('khplRegistrations') || '[]');
    return localData;
  }
};

export default {
  saveToS3,
  loadFromS3,
  saveRegistrationData,
  loadRegistrationData,
  verifyS3Access,
  config: S3_CONFIG
};