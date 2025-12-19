// AWS DynamoDB Storage Utility for KHPL Registration Data
// Uses DynamoDB for fast NoSQL data access with pay-per-request pricing

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand,
  UpdateCommand,
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';

// DynamoDB Configuration
const DYNAMODB_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  tableName: process.env.REACT_APP_DYNAMODB_TABLE_NAME || 'KHPL-Registrations',
  enabled: process.env.REACT_APP_DYNAMODB_ENABLED !== 'false' // Default to true unless explicitly disabled
};

// Validate DynamoDB configuration on module load
const validateConfiguration = () => {
  const issues = [];
  
  if (!DYNAMODB_CONFIG.enabled) {
    issues.push('DynamoDB is disabled');
  }
  if (!DYNAMODB_CONFIG.accessKeyId) {
    issues.push('AWS Access Key ID not configured');
  }
  if (!DYNAMODB_CONFIG.secretAccessKey) {
    issues.push('AWS Secret Access Key not configured');
  }
  if (!DYNAMODB_CONFIG.tableName) {
    issues.push('DynamoDB table name not configured');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ DynamoDB Configuration Issues:', issues);
    console.warn('📄 Create a .env file with proper AWS credentials to enable database storage');
    return false;
  }
  
  console.log('✅ DynamoDB configuration validated successfully');
  return true;
};

// Validate configuration on startup
validateConfiguration();

// Initialize DynamoDB Client
let dynamoClient = null;
let docClient = null;

const initializeDynamoClient = () => {
  if (!DYNAMODB_CONFIG.enabled) {
    console.log('⚠️ DynamoDB is disabled in configuration');
    return null;
  }
  
  if (!DYNAMODB_CONFIG.accessKeyId || !DYNAMODB_CONFIG.secretAccessKey) {
    console.error('❌ DynamoDB credentials not configured properly');
    console.error('Missing:', {
      accessKeyId: !DYNAMODB_CONFIG.accessKeyId,
      secretAccessKey: !DYNAMODB_CONFIG.secretAccessKey
    });
    return null;
  }

  try {
    dynamoClient = new DynamoDBClient({
      region: DYNAMODB_CONFIG.region,
      credentials: {
        accessKeyId: DYNAMODB_CONFIG.accessKeyId,
        secretAccessKey: DYNAMODB_CONFIG.secretAccessKey,
      },
      maxAttempts: 3, // Retry failed requests
      retryMode: 'adaptive' // Use adaptive retry mode
    });

    docClient = DynamoDBDocumentClient.from(dynamoClient);
    console.log('✅ DynamoDB Client initialized successfully for region:', DYNAMODB_CONFIG.region);
    console.log('📁 Using table:', DYNAMODB_CONFIG.tableName);
    return docClient;
  } catch (error) {
    console.error('❌ Error initializing DynamoDB:', error);
    return null;
  }
};

// Sanitize data for DynamoDB - remove File objects and other non-serializable data
const sanitizeForDynamoDB = (data) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip File objects, functions, and other non-serializable types
    if (value instanceof File || 
        value instanceof Blob || 
        typeof value === 'function' ||
        value === undefined ||
        (typeof value === 'object' && value !== null && value.constructor && value.constructor.name === 'File')) {
      continue; // Skip non-serializable data
    }
    
    // Handle nested objects (but not Date objects or arrays)
    if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
      sanitized[key] = sanitizeForDynamoDB(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Save Registration to DynamoDB
export const saveRegistrationToDynamoDB = async (registrationData, retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    const client = initializeDynamoClient();
    if (!client) {
      throw new Error('DynamoDB service not available - please check configuration');
    }

    // Generate unique ID if not provided
    const uniqueId = registrationData.id || `KHPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Sanitize the data to remove File objects and other non-serializable data
    const sanitizedData = sanitizeForDynamoDB(registrationData);
    
    const registration = {
      id: uniqueId,
      ...sanitizedData,
      timestamp: registrationData.timestamp || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      source: 'khpl-registration-app',
      retryAttempt: retryCount
    };

    console.log(`📝 Saving to DynamoDB (attempt ${retryCount + 1}):`, registration.id);

    const command = new PutCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      Item: registration,
      ConditionExpression: 'attribute_not_exists(id)' // Prevent overwrites
    });

    await client.send(command);
    
    console.log('✅ Registration saved to DynamoDB successfully:', uniqueId);
    
    return {
      success: true,
      data: registration
    };

  } catch (error) {
    console.error(`❌ DynamoDB save attempt ${retryCount + 1} failed:`, error.name, error.message);
    
    if (error.name === 'ConditionalCheckFailedException') {
      // Record already exists - this is not retryable
      console.warn('⚠️ Registration with this ID already exists:', registrationData.id);
      return {
        success: false,
        error: 'Registration ID already exists',
        retryable: false
      };
    }
    
    // Check if error is retryable
    const retryableErrors = [
      'NetworkingError',
      'TimeoutError', 
      'ThrottlingException',
      'ProvisionedThroughputExceededException',
      'ServiceUnavailable',
      'InternalServerError'
    ];
    
    const isRetryable = retryableErrors.some(retryableError => 
      error.name === retryableError || error.message.includes(retryableError)
    );
    
    // Retry for retryable errors
    if (isRetryable && retryCount < maxRetries) {
      console.log(`🔄 Retrying DynamoDB save in ${(retryCount + 1) * 1000}ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await saveRegistrationToDynamoDB(registrationData, retryCount + 1);
          resolve(result);
        }, (retryCount + 1) * 1000); // Exponential backoff: 1s, 2s, 3s
      });
    }
    
    // Final failure
    const errorMessage = getErrorMessage(error);
    console.error('❌ Final DynamoDB save failure after', retryCount + 1, 'attempts:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      retryable: isRetryable,
      attempts: retryCount + 1
    };
  }
};

// Helper function to get user-friendly error messages
const getErrorMessage = (error) => {
  switch (error.name) {
    case 'ResourceNotFoundException':
      return 'Database table not found - please contact support';
    case 'ValidationException':
      return 'Invalid data format - please check your information';
    case 'AccessDeniedException':
      return 'Database access denied - service temporarily unavailable';
    case 'ThrottlingException':
      return 'Service busy - please try again in a moment';
    case 'NetworkingError':
      return 'Network connection issue - please check your internet';
    case 'TimeoutError':
      return 'Request timed out - please try again';
    default:
      return error.message || 'Database service temporarily unavailable';
  }
};

// Load All Registrations from DynamoDB
export const loadRegistrationsFromDynamoDB = async () => {
  try {
    const client = initializeDynamoClient();
    if (!client) {
      console.log('⚠️ DynamoDB not configured, returning empty array');
      return [];
    }

    const command = new ScanCommand({
      TableName: DYNAMODB_CONFIG.tableName
    });

    const response = await client.send(command);
    
    console.log('✅ Loaded', response.Items.length, 'registrations from DynamoDB');
    
    // Sort by timestamp (newest first)
    const sortedItems = response.Items.sort((a, b) => {
      const timestampA = new Date(a.timestamp || 0);
      const timestampB = new Date(b.timestamp || 0);
      return timestampB - timestampA;
    });
    
    return sortedItems;

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error('❌ DynamoDB table not found:', DYNAMODB_CONFIG.tableName);
      console.error('💡 Create the table using: node scripts/createDynamoTable.js');
      return [];
    } else {
      console.error('❌ Error loading from DynamoDB:', error);
      return [];
    }
  }
};

// Get Single Registration by ID
export const getRegistrationById = async (registrationId) => {
  try {
    const client = initializeDynamoClient();
    if (!client) {
      throw new Error('DynamoDB not configured');
    }

    const command = new GetCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      Key: {
        id: registrationId
      }
    });

    const response = await client.send(command);
    
    if (response.Item) {
      console.log('✅ Found registration:', registrationId);
      return response.Item;
    } else {
      console.log('⚠️ Registration not found:', registrationId);
      return null;
    }

  } catch (error) {
    console.error('❌ Error getting registration by ID:', error);
    return null;
  }
};

// Update Registration Status
export const updateRegistrationStatus = async (registrationId, updateData) => {
  try {
    const client = initializeDynamoClient();
    if (!client) {
      throw new Error('DynamoDB not configured');
    }

    // Build update expression dynamically
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Always update lastUpdated
    updateExpression.push('#updated = :updated');
    expressionAttributeNames['#updated'] = 'lastUpdated';
    expressionAttributeValues[':updated'] = new Date().toISOString();

    // Handle different update types
    Object.entries(updateData).forEach(([key, value], index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      updateExpression.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = value;
    });

    const command = new UpdateCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      Key: {
        id: registrationId
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const response = await client.send(command);
    console.log('✅ Updated registration:', registrationId);
    return response.Attributes;

  } catch (error) {
    console.error('❌ Error updating registration:', error);
    return null;
  }
};

// Delete Registration
export const deleteRegistration = async (registrationId) => {
  try {
    console.log('🗑️ Starting delete process for registration:', registrationId);
    
    const client = initializeDynamoClient();
    if (!client) {
      throw new Error('DynamoDB service not available - please check configuration');
    }

    // First check if the registration exists
    const getCommand = new GetCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      Key: {
        id: registrationId
      }
    });

    const getResult = await client.send(getCommand);
    if (!getResult.Item) {
      console.warn('⚠️ Registration not found in database:', registrationId);
      throw new Error(`Registration ${registrationId} not found in database`);
    }

    console.log('📋 Found registration to delete:', getResult.Item.name || 'Unknown');

    // Delete the registration
    const deleteCommand = new DeleteCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      Key: {
        id: registrationId
      },
      // Add condition to ensure we're deleting the right record
      ConditionExpression: 'attribute_exists(id)'
    });

    await client.send(deleteCommand);
    
    console.log('✅ Registration deleted successfully from DynamoDB:', registrationId);
    return {
      success: true,
      deletedId: registrationId,
      deletedName: getResult.Item.name || 'Unknown'
    };

  } catch (error) {
    console.error('❌ Error deleting registration:', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        success: false,
        error: 'Registration no longer exists in database'
      };
    }
    
    if (error.name === 'ResourceNotFoundException') {
      return {
        success: false,
        error: 'Database table not found - please contact support'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown database error'
    };
  }
};

// Verify DynamoDB Connection
export const verifyDynamoDBConnection = async () => {
  try {
    const client = initializeDynamoClient();
    if (!client) {
      return { success: false, reason: 'DynamoDB not configured' };
    }

    // Try to describe the table
    const command = new ScanCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      Limit: 1 // Just check if table exists
    });

    await client.send(command);
    return { 
      success: true, 
      table: DYNAMODB_CONFIG.tableName, 
      region: DYNAMODB_CONFIG.region 
    };

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return { 
        success: false, 
        reason: 'Table does not exist', 
        table: DYNAMODB_CONFIG.tableName 
      };
    }
    return { 
      success: false, 
      reason: error.message,
      errorType: error.name
    };
  }
};

// Delete All Registrations (Bulk Delete)
export const deleteAllRegistrations = async () => {
  try {
    console.log('🗑️ Starting bulk delete of all registrations...');
    
    const client = initializeDynamoClient();
    if (!client) {
      throw new Error('DynamoDB service not available - please check configuration');
    }

    // First scan to get all registration IDs
    const scanCommand = new ScanCommand({
      TableName: DYNAMODB_CONFIG.tableName,
      ProjectionExpression: 'id, #name',
      ExpressionAttributeNames: {
        '#name': 'name'
      }
    });

    const scanResult = await client.send(scanCommand);
    const registrations = scanResult.Items || [];
    
    if (registrations.length === 0) {
      console.log('ℹ️ No registrations found to delete');
      return {
        success: true,
        deletedCount: 0,
        message: 'No registrations found to delete'
      };
    }

    console.log(`📋 Found ${registrations.length} registrations to delete`);

    // Delete each registration individually
    // Note: DynamoDB doesn't have bulk delete, so we need to delete one by one
    const deletePromises = registrations.map(async (registration) => {
      try {
        const deleteCommand = new DeleteCommand({
          TableName: DYNAMODB_CONFIG.tableName,
          Key: {
            id: registration.id
          }
        });

        await client.send(deleteCommand);
        console.log(`✅ Deleted registration: ${registration.name || 'Unknown'} (${registration.id})`);
        return { success: true, id: registration.id, name: registration.name };
      } catch (error) {
        console.error(`❌ Failed to delete registration ${registration.id}:`, error);
        return { success: false, id: registration.id, error: error.message };
      }
    });

    // Wait for all deletions to complete
    const results = await Promise.all(deletePromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`🎯 Bulk delete completed: ${successful.length} successful, ${failed.length} failed`);

    return {
      success: failed.length === 0,
      deletedCount: successful.length,
      failedCount: failed.length,
      totalCount: registrations.length,
      results: results,
      message: failed.length === 0 
        ? `Successfully deleted all ${successful.length} registrations`
        : `Deleted ${successful.length} registrations, ${failed.length} failed`
    };

  } catch (error) {
    console.error('❌ Bulk delete failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during bulk delete',
      deletedCount: 0
    };
  }
};

export { validateConfiguration };

export default {
  saveRegistrationToDynamoDB,
  loadRegistrationsFromDynamoDB,
  getRegistrationById,
  updateRegistrationStatus,
  deleteRegistration,
  deleteAllRegistrations,
  verifyDynamoDBConnection,
  validateConfiguration,
  config: DYNAMODB_CONFIG
};