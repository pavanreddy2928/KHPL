// Verify Migration Status and Data Integrity
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Load environment variables first
require('dotenv').config();

// Configuration
const CONFIG = {
  aws: {
    region: process.env.AWS_REGION || process.env.REACT_APP_AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET_NAME || process.env.REACT_APP_S3_BUCKET_NAME,
    dynamoTable: process.env.DYNAMODB_TABLE_NAME || process.env.REACT_APP_DYNAMODB_TABLE_NAME || 'KHPL-Registrations'
  }
};

let dynamoClient = null;
let s3Client = null;

// Initialize AWS clients
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

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AWS clients:', error);
    return false;
  }
};

// Load data from S3
const loadS3Data = async () => {
  try {
    const command = new GetObjectCommand({
      Bucket: CONFIG.aws.s3Bucket,
      Key: 'registrations.json'
    });

    const response = await s3Client.send(command);
    const dataString = await response.Body.transformToString();
    return JSON.parse(dataString);
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return [];
    }
    throw error;
  }
};

// Load data from DynamoDB
const loadDynamoData = async () => {
  try {
    const command = new ScanCommand({
      TableName: CONFIG.aws.dynamoTable
    });

    const response = await dynamoClient.send(command);
    return response.Items || [];
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return null; // Table doesn't exist
    }
    throw error;
  }
};

// Verify migration status
const verifyMigration = async () => {
  console.log('🔍 Verifying KHPL Data Migration Status');
  console.log('=====================================');

  try {
    // Validate configuration
    if (!CONFIG.aws.accessKeyId || !CONFIG.aws.secretAccessKey || !CONFIG.aws.s3Bucket) {
      throw new Error('Missing required AWS configuration');
    }

    // Initialize clients
    if (!initializeClients()) {
      throw new Error('Failed to initialize AWS clients');
    }

    console.log('📊 Loading data from both sources...\n');

    // Load data from both sources
    const [s3Data, dynamoData] = await Promise.all([
      loadS3Data(),
      loadDynamoData()
    ]);

    // Check if DynamoDB table exists
    if (dynamoData === null) {
      console.log('❌ DynamoDB table does not exist');
      console.log('💡 Run: node scripts/createDynamoTable.js');
      return false;
    }

    // Display data counts
    console.log('📈 Data Summary:');
    console.log(`   • S3 Records: ${s3Data.length}`);
    console.log(`   • DynamoDB Records: ${dynamoData.length}`);

    if (s3Data.length === 0 && dynamoData.length === 0) {
      console.log('\nℹ️ No data found in either source - nothing to migrate');
      return true;
    }

    // Check migration status
    const migrationStatus = {
      s3Only: [],
      dynamoOnly: [],
      bothSources: [],
      migrated: []
    };

    // Create ID maps for comparison
    const s3Ids = new Set(s3Data.map(record => record.id));
    const dynamoIds = new Set(dynamoData.map(record => record.id));

    // Find records in S3 only
    s3Data.forEach(record => {
      if (!dynamoIds.has(record.id)) {
        migrationStatus.s3Only.push({
          id: record.id,
          name: record.name || 'Unknown'
        });
      } else {
        migrationStatus.bothSources.push(record.id);
      }
    });

    // Find records in DynamoDB only
    dynamoData.forEach(record => {
      if (!s3Ids.has(record.id)) {
        migrationStatus.dynamoOnly.push({
          id: record.id,
          name: record.name || 'Unknown'
        });
      }
    });

    // Find migrated records (have migration metadata)
    migrationStatus.migrated = dynamoData
      .filter(record => record.migratedFrom === 'S3')
      .map(record => ({
        id: record.id,
        name: record.name || 'Unknown',
        migrationDate: record.migrationDate,
        imagesUploaded: record.uploadedImageCount || 0
      }));

    // Display detailed results
    console.log('\n🔍 Migration Analysis:');
    console.log(`   • Records in both S3 and DynamoDB: ${migrationStatus.bothSources.length}`);
    console.log(`   • Records marked as migrated: ${migrationStatus.migrated.length}`);
    console.log(`   • Records only in S3: ${migrationStatus.s3Only.length}`);
    console.log(`   • Records only in DynamoDB: ${migrationStatus.dynamoOnly.length}`);

    // Show unmigrated records
    if (migrationStatus.s3Only.length > 0) {
      console.log('\n⚠️ Records needing migration (in S3 only):');
      migrationStatus.s3Only.slice(0, 10).forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.name} (${record.id})`);
      });
      if (migrationStatus.s3Only.length > 10) {
        console.log(`   ... and ${migrationStatus.s3Only.length - 10} more`);
      }
    }

    // Show migration summary
    if (migrationStatus.migrated.length > 0) {
      console.log('\n✅ Successfully migrated records:');
      
      // Group by migration date
      const migrationGroups = {};
      migrationStatus.migrated.forEach(record => {
        const date = record.migrationDate ? record.migrationDate.split('T')[0] : 'Unknown';
        if (!migrationGroups[date]) {
          migrationGroups[date] = [];
        }
        migrationGroups[date].push(record);
      });

      Object.entries(migrationGroups).forEach(([date, records]) => {
        console.log(`   📅 ${date}: ${records.length} records`);
        const totalImages = records.reduce((sum, record) => sum + record.imagesUploaded, 0);
        console.log(`      📸 Total images: ${totalImages}`);
      });
    }

    // Determine overall status
    const needsMigration = migrationStatus.s3Only.length > 0;
    const migrationComplete = s3Data.length > 0 && migrationStatus.s3Only.length === 0;

    console.log('\n📊 Overall Status:');
    if (migrationComplete) {
      console.log('✅ Migration appears complete - all S3 records found in DynamoDB');
    } else if (needsMigration) {
      console.log('⚠️ Migration needed - some records only exist in S3');
      console.log('💡 Run: node scripts/migrateS3ToDynamoDB.js');
    } else if (s3Data.length === 0 && dynamoData.length > 0) {
      console.log('ℹ️ Only DynamoDB data exists - may be post-migration state');
    } else {
      console.log('❓ Unable to determine migration status');
    }

    return !needsMigration;

  } catch (error) {
    console.error('\n💥 Verification failed:', error);
    return false;
  }
};

// Run verification if called directly
if (require.main === module) {
  // Load environment variables from .env file if it exists
  try {
    require('dotenv').config();
  } catch (error) {
    console.log('ℹ️ No dotenv package found, using system environment variables');
  }

  verifyMigration()
    .then(success => {
      console.log('\n✨ Verification completed');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyMigration };