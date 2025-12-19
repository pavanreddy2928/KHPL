// Safe Data Migration Script: S3 to DynamoDB
// This script preserves ALL existing records and ensures no data loss

// Load environment variables first
require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const CONFIG = {
  aws: {
    region: process.env.AWS_REGION || process.env.REACT_APP_AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET_NAME || process.env.REACT_APP_S3_BUCKET_NAME,
    dynamoTable: process.env.DYNAMODB_TABLE_NAME || process.env.REACT_APP_DYNAMODB_TABLE_NAME || 'KHPL-Registrations'
  },
  migration: {
    batchSize: 5, // Process 5 records at a time to avoid overwhelming AWS
    backupPrefix: 'migration-backup-',
    dryRun: false // Set to true to test without making changes
  }
};

// Initialize AWS clients
let dynamoClient = null;
let s3Client = null;

const initializeClients = () => {
  try {
    // DynamoDB Client
    const dynamoDBClient = new DynamoDBClient({
      region: CONFIG.aws.region,
      credentials: {
        accessKeyId: CONFIG.aws.accessKeyId,
        secretAccessKey: CONFIG.aws.secretAccessKey,
      },
    });
    dynamoClient = DynamoDBDocumentClient.from(dynamoDBClient);

    // S3 Client
    s3Client = new S3Client({
      region: CONFIG.aws.region,
      credentials: {
        accessKeyId: CONFIG.aws.accessKeyId,
        secretAccessKey: CONFIG.aws.secretAccessKey,
      },
    });

    console.log('✅ AWS clients initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AWS clients:', error);
    return false;
  }
};

// Load existing data from S3
const loadExistingDataFromS3 = async () => {
  try {
    console.log('📥 Loading existing registration data from S3...');
    
    const command = new GetObjectCommand({
      Bucket: CONFIG.aws.s3Bucket,
      Key: 'registrations.json'
    });

    const response = await s3Client.send(command);
    const dataString = await response.Body.transformToString();
    const data = JSON.parse(dataString);

    console.log(`📊 Found ${data.length} existing records in S3`);
    return data;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.log('ℹ️ No existing registrations.json found in S3');
      return [];
    }
    console.error('❌ Error loading data from S3:', error);
    throw error;
  }
};

// Create backup of existing data
const createBackup = async (data) => {
  try {
    const backupKey = `${CONFIG.migration.backupPrefix}${new Date().toISOString()}-registrations.json`;
    
    console.log(`💾 Creating backup: ${backupKey}`);
    
    const command = new PutObjectCommand({
      Bucket: CONFIG.aws.s3Bucket,
      Key: backupKey,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    });

    await s3Client.send(command);
    console.log('✅ Backup created successfully');
    return backupKey;
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    throw error;
  }
};

// Check if record already exists in DynamoDB
const recordExistsInDynamoDB = async (recordId) => {
  try {
    const command = new GetCommand({
      TableName: CONFIG.aws.dynamoTable,
      Key: { id: recordId }
    });

    const response = await dynamoClient.send(command);
    return !!response.Item;
  } catch (error) {
    console.error(`❌ Error checking record ${recordId}:`, error);
    return false;
  }
};

// Upload image to S3 if it's base64 data
const uploadImageToS3 = async (base64Data, fileName, recordId) => {
  try {
    if (!base64Data || !base64Data.startsWith('data:')) {
      return null; // Not base64 data
    }

    // Extract mime type and base64 content
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.warn(`⚠️ Invalid base64 format for ${fileName}`);
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');

    // Generate S3 key
    const extension = mimeType.split('/')[1] || 'jpg';
    const s3Key = `registration-images/${recordId}/${fileName}.${extension}`;

    console.log(`📤 Uploading ${fileName} for record ${recordId}...`);

    const command = new PutObjectCommand({
      Bucket: CONFIG.aws.s3Bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType
    });

    await s3Client.send(command);
    console.log(`✅ Uploaded ${fileName} to S3: ${s3Key}`);

    return {
      s3Key: s3Key,
      originalFileName: fileName,
      mimeType: mimeType,
      size: buffer.length
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error);
    return null;
  }
};

// Process images for a record
const processRecordImages = async (record) => {
  const imageResults = {};
  const imageFields = [
    { field: 'image', name: 'userPhoto' },
    { field: 'userPhoto', name: 'userPhoto' },
    { field: 'aadhaarCopy', name: 'aadhaar' },
    { field: 'paymentScreenshot', name: 'paymentScreenshot' }
  ];

  for (const { field, name } of imageFields) {
    if (record[field]) {
      const uploadResult = await uploadImageToS3(record[field], name, record.id);
      if (uploadResult) {
        imageResults[name] = uploadResult;
      }
    }
  }

  return imageResults;
};

// Sanitize record for DynamoDB
const sanitizeRecordForDynamoDB = (record, imageResults) => {
  // Remove base64 image data and file objects
  const sanitizedRecord = {
    ...record,
    // Ensure required fields
    id: record.id || `KHPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: record.timestamp || record.registrationDate || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    
    // Add image upload results
    imageUploadResults: imageResults,
    imageUploadStatus: Object.keys(imageResults).length > 0 ? 'completed' : 'none',
    uploadedImageCount: Object.keys(imageResults).length,
    totalImageCount: Object.keys(imageResults).length,
    
    // Migration metadata
    migratedFrom: 'S3',
    migrationDate: new Date().toISOString(),
    originalRecord: true
  };

  // Remove base64 image fields to save space
  delete sanitizedRecord.image;
  delete sanitizedRecord.userPhoto;
  delete sanitizedRecord.aadhaarCopy;
  delete sanitizedRecord.paymentScreenshot;

  // Remove any File objects or functions
  Object.keys(sanitizedRecord).forEach(key => {
    const value = sanitizedRecord[key];
    if (value === undefined || 
        (typeof value === 'object' && value !== null && value.constructor && value.constructor.name === 'File') ||
        typeof value === 'function') {
      delete sanitizedRecord[key];
    }
  });

  return sanitizedRecord;
};

// Migrate a single record
const migrateRecord = async (record, index, total) => {
  try {
    console.log(`\n🔄 Processing record ${index + 1}/${total}: ${record.name || 'Unknown'}`);
    console.log(`📋 Record ID: ${record.id}`);

    // Check if already exists
    if (await recordExistsInDynamoDB(record.id)) {
      console.log(`⚠️ Record ${record.id} already exists in DynamoDB - skipping`);
      return { status: 'skipped', reason: 'already_exists', record: record };
    }

    // Process images
    console.log('🖼️ Processing images...');
    const imageResults = await processRecordImages(record);
    console.log(`📸 Processed ${Object.keys(imageResults).length} images:`, Object.keys(imageResults));

    // Prepare record for DynamoDB
    const sanitizedRecord = sanitizeRecordForDynamoDB(record, imageResults);

    // Save to DynamoDB
    if (!CONFIG.migration.dryRun) {
      console.log('💾 Saving to DynamoDB...');
      
      const command = new PutCommand({
        TableName: CONFIG.aws.dynamoTable,
        Item: sanitizedRecord
      });

      await dynamoClient.send(command);
    } else {
      console.log('🔍 DRY RUN - Would save to DynamoDB');
    }

    console.log(`✅ Successfully migrated record: ${record.name || 'Unknown'}`);
    
    return { 
      status: 'success', 
      record: sanitizedRecord,
      imagesUploaded: Object.keys(imageResults).length
    };

  } catch (error) {
    console.error(`❌ Failed to migrate record ${record.id}:`, error);
    return { 
      status: 'error', 
      record: record, 
      error: error.message 
    };
  }
};

// Process records in batches
const processInBatches = async (records) => {
  const results = {
    total: records.length,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < records.length; i += CONFIG.migration.batchSize) {
    const batch = records.slice(i, i + CONFIG.migration.batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / CONFIG.migration.batchSize) + 1}...`);

    const batchPromises = batch.map((record, batchIndex) => 
      migrateRecord(record, i + batchIndex, records.length)
    );

    const batchResults = await Promise.all(batchPromises);

    // Aggregate results
    batchResults.forEach(result => {
      switch (result.status) {
        case 'success':
          results.successful++;
          break;
        case 'skipped':
          results.skipped++;
          break;
        case 'error':
          results.failed++;
          results.errors.push(result);
          break;
      }
    });

    // Brief pause between batches
    if (i + CONFIG.migration.batchSize < records.length) {
      console.log('⏳ Pausing between batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting KHPL Data Migration: S3 → DynamoDB');
  console.log('================================================');
  
  try {
    // Validate configuration
    if (!CONFIG.aws.accessKeyId || !CONFIG.aws.secretAccessKey || !CONFIG.aws.s3Bucket) {
      throw new Error('Missing required AWS configuration. Please check your environment variables.');
    }

    console.log(`📊 Migration Configuration:`);
    console.log(`   • AWS Region: ${CONFIG.aws.region}`);
    console.log(`   • S3 Bucket: ${CONFIG.aws.s3Bucket}`);
    console.log(`   • DynamoDB Table: ${CONFIG.aws.dynamoTable}`);
    console.log(`   • Access Key ID: ${CONFIG.aws.accessKeyId ? CONFIG.aws.accessKeyId.substring(0, 8) + '...' : 'Not set'}`);
    console.log(`   • Batch Size: ${CONFIG.migration.batchSize}`);
    console.log(`   • Dry Run: ${CONFIG.migration.dryRun ? 'YES' : 'NO'}`);

    // Initialize AWS clients
    if (!initializeClients()) {
      throw new Error('Failed to initialize AWS clients');
    }

    // Load existing data
    const existingData = await loadExistingDataFromS3();
    
    if (existingData.length === 0) {
      console.log('ℹ️ No data found to migrate');
      return;
    }

    // Create backup
    console.log('\n💾 Creating backup of existing data...');
    const backupKey = await createBackup(existingData);

    // Process migration
    console.log('\n🔄 Starting data migration...');
    const migrationResults = await processInBatches(existingData);

    // Display results
    console.log('\n📊 Migration Results:');
    console.log('====================');
    console.log(`✅ Successfully migrated: ${migrationResults.successful}`);
    console.log(`⚠️ Skipped (already exist): ${migrationResults.skipped}`);
    console.log(`❌ Failed: ${migrationResults.failed}`);
    console.log(`📊 Total processed: ${migrationResults.total}`);
    console.log(`💾 Backup created: ${backupKey}`);

    if (migrationResults.errors.length > 0) {
      console.log('\n❌ Migration Errors:');
      migrationResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.record.name || error.record.id}: ${error.error}`);
      });
    }

    if (migrationResults.successful === migrationResults.total) {
      console.log('\n🎉 Migration completed successfully! All records preserved.');
    } else if (migrationResults.successful > 0) {
      console.log('\n⚠️ Migration partially completed. Some records may need manual review.');
    } else {
      console.log('\n❌ Migration failed. All data preserved in backup.');
    }

  } catch (error) {
    console.error('\n💥 Migration failed with error:', error);
    console.log('\n🛡️ All existing data remains safe in S3');
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  // Load environment variables from .env file if it exists
  try {
    require('dotenv').config();
  } catch (error) {
    console.log('ℹ️ No dotenv package found, using system environment variables');
  }

  runMigration()
    .then(() => {
      console.log('\n✨ Migration process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, CONFIG };