import CryptoJS from 'crypto-js';

// UPI Gateway Configuration (Use test environment for development)
const UPIGATEWAY_CONFIG = {
  merchantId: 'KHPLONLINE', // Replace with your actual merchant ID
  apiKey: 'your-api-key-here', // Replace with your actual API key
  secretKey: 'your-secret-key-here', // Replace with your actual secret key
  environment: 'sandbox', // Change to 'production' for live
  redirectUrl: `${window.location.origin}/payment-success`,
  callbackUrl: `${window.location.origin}/api/payment-callback`
};

// UPI Gateway API URLs
const UPIGATEWAY_URLS = {
  sandbox: 'https://sandbox.upigateway.com/api/v1',
  production: 'https://api.upigateway.com/v1'
};

export const generatePaymentPayload = (transactionData) => {
  const { amount, transactionId } = transactionData;
  
  const paymentPayload = {
    merchant_id: UPIGATEWAY_CONFIG.merchantId,
    order_id: transactionId,
    amount: amount, // Amount in rupees
    currency: 'INR',
    return_url: UPIGATEWAY_CONFIG.redirectUrl,
    notify_url: UPIGATEWAY_CONFIG.callbackUrl,
    customer_name: transactionData.name || '',
    customer_email: transactionData.email || '',
    customer_mobile: transactionData.phone || '',
    udf1: 'KHPL Registration',
    udf2: 'Karnataka Hardball Premier League',
    timestamp: Math.floor(Date.now() / 1000)
  };

  return paymentPayload;
};

export const generatePaymentHash = (paymentPayload) => {
  // Create hash string for UPI Gateway
  const hashString = [
    paymentPayload.merchant_id,
    paymentPayload.order_id,
    paymentPayload.amount,
    paymentPayload.currency,
    UPIGATEWAY_CONFIG.saltKey
  ].join('|');
  
  const hash = CryptoJS.SHA256(hashString).toString(CryptoJS.enc.Hex);
  return hash;
};

export const initiateUPIPayment = async (transactionData) => {
  try {
    const payload = generatePaymentPayload(transactionData);
    const hash = generatePaymentHash(payload);
    
    const apiUrl = `${UPIGATEWAY_URLS[UPIGATEWAY_CONFIG.environment]}/payment/initiate`;
    
    const requestBody = {
      ...payload,
      hash: hash
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${UPIGATEWAY_CONFIG.apiKey}`,
      'accept': 'application/json'
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    const responseData = await response.json();
    
    if (responseData.success && responseData.data?.payment_url) {
      return {
        success: true,
        redirectUrl: responseData.data.payment_url,
        transactionId: payload.order_id
      };
    } else {
      throw new Error(responseData.message || 'Payment initiation failed');
    }
    
  } catch (error) {
    console.error('UPI Gateway payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const verifyPayment = async (transactionId) => {
  try {
    const hashString = [
      UPIGATEWAY_CONFIG.merchantId,
      transactionId,
      UPIGATEWAY_CONFIG.saltKey
    ].join('|');
    
    const hash = CryptoJS.SHA256(hashString).toString(CryptoJS.enc.Hex);
    
    const apiUrl = `${UPIGATEWAY_URLS[UPIGATEWAY_CONFIG.environment]}/payment/verify`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UPIGATEWAY_CONFIG.apiKey}`,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        merchant_id: UPIGATEWAY_CONFIG.merchantId,
        order_id: transactionId,
        hash: hash
      })
    });
    
    const responseData = await response.json();
    return responseData;
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: error.message };
  }
};

export default UPIGATEWAY_CONFIG;