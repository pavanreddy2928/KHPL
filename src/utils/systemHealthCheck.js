// System Health Check Utility
// Helps diagnose payment failures by checking system components

import { validateConfiguration } from './dynamoDBStorage';

export const performHealthCheck = async () => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    components: {}
  };

  try {
    // Check DynamoDB Configuration
    console.log('🔍 Checking DynamoDB configuration...');
    const dbConfigValid = validateConfiguration();
    healthStatus.components.dynamodb = {
      status: dbConfigValid ? 'healthy' : 'warning',
      configured: dbConfigValid,
      message: dbConfigValid ? 'Database properly configured' : 'Database configuration issues detected'
    };

    // Check Environment Variables
    console.log('🔍 Checking environment variables...');
    const envVars = {
      hasAwsRegion: !!process.env.REACT_APP_AWS_REGION,
      hasAwsAccessKey: !!process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      hasTableName: !!process.env.REACT_APP_DYNAMODB_TABLE_NAME,
      hasBucketName: !!process.env.REACT_APP_S3_BUCKET_NAME
    };

    const envScore = Object.values(envVars).filter(Boolean).length;
    const totalEnvVars = Object.keys(envVars).length;

    healthStatus.components.environment = {
      status: envScore >= 3 ? 'healthy' : envScore >= 1 ? 'warning' : 'error',
      configured: `${envScore}/${totalEnvVars} environment variables set`,
      variables: envVars,
      message: envScore >= 3 ? 'Environment properly configured' : 'Missing critical environment variables'
    };

    // Check Network Connectivity (basic)
    console.log('🔍 Checking network connectivity...');
    try {
      // Simple connectivity check using fetch to a reliable endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      healthStatus.components.network = {
        status: 'healthy',
        message: 'Internet connectivity available'
      };
    } catch (networkError) {
      healthStatus.components.network = {
        status: 'error',
        message: 'Network connectivity issues detected',
        error: networkError.message
      };
    }

    // Check Local Storage
    console.log('🔍 Checking browser capabilities...');
    try {
      const testKey = 'khpl_health_check_test';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      healthStatus.components.localStorage = {
        status: retrieved === 'test' ? 'healthy' : 'warning',
        available: retrieved === 'test',
        message: retrieved === 'test' ? 'Local storage working' : 'Local storage issues'
      };
    } catch (storageError) {
      healthStatus.components.localStorage = {
        status: 'warning',
        available: false,
        message: 'Local storage not available',
        error: storageError.message
      };
    }

    // Calculate overall health
    const componentStatuses = Object.values(healthStatus.components).map(comp => comp.status);
    const hasError = componentStatuses.includes('error');
    const hasWarning = componentStatuses.includes('warning');

    if (hasError) {
      healthStatus.overall = 'error';
    } else if (hasWarning) {
      healthStatus.overall = 'warning';
    } else {
      healthStatus.overall = 'healthy';
    }

    // Generate recommendations
    healthStatus.recommendations = generateRecommendations(healthStatus.components);

    console.log('🏥 Health Check Complete:', healthStatus);
    return healthStatus;

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return {
      timestamp: new Date().toISOString(),
      overall: 'error',
      error: error.message,
      components: healthStatus.components
    };
  }
};

const generateRecommendations = (components) => {
  const recommendations = [];

  if (components.dynamodb?.status !== 'healthy') {
    recommendations.push({
      category: 'Database',
      priority: 'high',
      message: 'Set up AWS credentials and DynamoDB configuration in .env file',
      action: 'Create .env file with REACT_APP_AWS_ACCESS_KEY_ID, REACT_APP_AWS_SECRET_ACCESS_KEY, and REACT_APP_DYNAMODB_TABLE_NAME'
    });
  }

  if (components.environment?.status === 'error') {
    recommendations.push({
      category: 'Environment',
      priority: 'high',
      message: 'Configure environment variables for AWS services',
      action: 'Copy .env.example to .env and fill in your AWS credentials'
    });
  }

  if (components.network?.status === 'error') {
    recommendations.push({
      category: 'Network',
      priority: 'medium',
      message: 'Check internet connectivity and firewall settings',
      action: 'Verify internet connection and ensure AWS endpoints are accessible'
    });
  }

  if (components.localStorage?.status !== 'healthy') {
    recommendations.push({
      category: 'Browser',
      priority: 'low',
      message: 'Local storage issues may affect user experience',
      action: 'Clear browser cache or try a different browser'
    });
  }

  return recommendations;
};

export const logHealthStatus = async () => {
  const health = await performHealthCheck();
  
  console.log('\n🏥 =====  KHPL SYSTEM HEALTH REPORT  =====');
  console.log(`📊 Overall Status: ${health.overall.toUpperCase()}`);
  console.log(`🕐 Checked at: ${health.timestamp}`);
  console.log('\n📋 Component Status:');
  
  Object.entries(health.components).forEach(([name, status]) => {
    const icon = status.status === 'healthy' ? '✅' : status.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${name}: ${status.message}`);
  });

  if (health.recommendations && health.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    health.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵';
      console.log(`${priorityIcon} ${rec.category}: ${rec.message}`);
      console.log(`   Action: ${rec.action}`);
    });
  }

  console.log('\n===========================================\n');
  
  return health;
};