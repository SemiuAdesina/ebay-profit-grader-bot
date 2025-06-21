const getOAuthToken = require('./src/api/getToken');

async function testOAuth() {
  try {
    console.log('🧪 Testing OAuth token generation...');
    const token = await getOAuthToken();
    console.log('✅ OAuth token received successfully!');
    console.log('Token preview:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ OAuth test failed:', error.message);
  }
}

testOAuth(); 