// Create DynamoDB Table for KHPL Registration Data
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Load environment variables first
require('dotenv').config();

// Configuration - handle both Node.js and React environment variables
const CONFIG = {
  region: process.env.AWS_REGION || process.env.REACT_APP_AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  tableName: process.env.DYNAMODB_TABLE_NAME || process.env.REACT_APP_DYNAMODB_TABLE_NAME || 'KHPL-Registrations'
};

// Initialize DynamoDB client
const createDynamoClient = () => {
  return new DynamoDBClient({
    region: CONFIG.region,
    credentials: {
      accessKeyId: CONFIG.accessKeyId,
      secretAccessKey: CONFIG.secretAccessKey,
    },
  });
};

// Check if table exists
const tableExists = async (client, tableName) => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
};

// Create DynamoDB table
const createTable = async () => {
  console.log('🏗️ Creating DynamoDB table for KHPL registrations...');
  
  try {
    // Debug configuration loading
    console.log('🔍 Debug - CONFIG values:');
    console.log(`   • CONFIG.accessKeyId: ${CONFIG.accessKeyId ? 'Set (' + CONFIG.accessKeyId.substring(0, 8) + '...)' : 'Not set'}`);
    console.log(`   • CONFIG.secretAccessKey: ${CONFIG.secretAccessKey ? 'Set' : 'Not set'}`);
    
    // Validate configuration
    if (!CONFIG.accessKeyId || !CONFIG.secretAccessKey) {
      throw new Error('Missing AWS credentials. Please check your environment variables.');
    }

    console.log(`📊 Configuration:`);
    console.log(`   • Region: ${CONFIG.region}`);
    console.log(`   • Table Name: ${CONFIG.tableName}`);
    console.log(`   • Access Key ID: ${CONFIG.accessKeyId ? CONFIG.accessKeyId.substring(0, 8) + '...' : 'Not set'}`);

    const client = createDynamoClient();

    // Check if table already exists
    if (await tableExists(client, CONFIG.tableName)) {
      console.log('✅ Table already exists:', CONFIG.tableName);
      return true;
    }

    // Create table
    const tableParams = {
      TableName: CONFIG.tableName,
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S' // String
        }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing
      Tags: [
        {
          Key: 'Application',
          Value: 'KHPL-Registration'
        },
        {
          Key: 'Environment',
          Value: 'Production'
        },
        {
          Key: 'CreatedBy',
          Value: 'Migration-Script'
        }
      ]
    };

    console.log('🚀 Creating table...');
    const command = new CreateTableCommand(tableParams);
    const result = await client.send(command);

    console.log('⏳ Waiting for table to be active...');
    
    // Wait for table to become active
    let tableStatus = 'CREATING';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait time

    while (tableStatus !== 'ACTIVE' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const describeCommand = new DescribeTableCommand({ TableName: CONFIG.tableName });
        const description = await client.send(describeCommand);
        tableStatus = description.Table.TableStatus;
        attempts++;
        
        console.log(`📊 Table status: ${tableStatus} (attempt ${attempts}/${maxAttempts})`);
      } catch (error) {
        console.warn('⚠️ Error checking table status:', error.message);
        attempts++;
      }
    }

    if (tableStatus === 'ACTIVE') {
      console.log('✅ Table created successfully!');
      console.log(`📊 Table details:`);
      console.log(`   • Name: ${result.TableDescription.TableName}`);
      console.log(`   • ARN: ${result.TableDescription.TableArn}`);
      console.log(`   • Status: ${tableStatus}`);
      return true;
    } else {
      throw new Error(`Table creation timed out. Status: ${tableStatus}`);
    }

  } catch (error) {
    console.error('❌ Failed to create table:', error);
    
    if (error.name === 'AccessDeniedException') {
      console.log('💡 Make sure your AWS credentials have DynamoDB permissions');
    } else if (error.name === 'ResourceInUseException') {
      console.log('💡 Table is being created or already exists');
    }
    
    return false;
  }
};

// Run table creation if called directly
if (require.main === module) {


  createTable()
    .then(success => {
      if (success) {
        console.log('\n🎉 DynamoDB table setup completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Failed to create DynamoDB table');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createTable, CONFIG };