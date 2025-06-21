const axios = require('axios');
require('dotenv').config();

// Get credentials based on environment
const USE_SANDBOX = process.env.USE_SANDBOX === 'true';

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('USE_SANDBOX:', USE_SANDBOX);
console.log('EBAY_CLIENT_ID:', process.env.EBAY_CLIENT_ID);
console.log('EBAY_CLIENT_SECRET:', process.env.EBAY_CLIENT_SECRET ? '***SET***' : 'NOT SET');
console.log('EBAY_CLIENT_ID_SANDBOX:', process.env.EBAY_CLIENT_ID_SANDBOX);
console.log('EBAY_CLIENT_SECRET_SANDBOX:', process.env.EBAY_CLIENT_SECRET_SANDBOX ? '***SET***' : 'NOT SET');

const CLIENT_ID = USE_SANDBOX ? process.env.EBAY_CLIENT_ID_SANDBOX : process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = USE_SANDBOX ? process.env.EBAY_CLIENT_SECRET_SANDBOX : process.env.EBAY_CLIENT_SECRET;

// OAuth endpoints
const OAUTH_URL = USE_SANDBOX 
  ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
  : 'https://api.ebay.com/identity/v1/oauth2/token';

async function getOAuthToken() {
  try {
    console.log(`🔐 Getting OAuth token for ${USE_SANDBOX ? 'SANDBOX' : 'PRODUCTION'}`);
    console.log(`🔐 Using Client ID: ${CLIENT_ID}`);
    console.log(`🔐 Using Client Secret: ${CLIENT_SECRET ? '***SET***' : 'NOT SET'}`);
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error(`Missing credentials: CLIENT_ID=${!!CLIENT_ID}, CLIENT_SECRET=${!!CLIENT_SECRET}`);
    }
    
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      OAUTH_URL,
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );
    
    console.log('✅ OAuth token received successfully');
    return response.data.access_token;
    
  } catch (err) {
    console.error('❌ Failed to get OAuth token:', err.response?.data || err.message);
    throw new Error('OAuth token request failed');
  }
}

module.exports = getOAuthToken; 