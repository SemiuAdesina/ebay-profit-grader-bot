const axios = require('axios');
const getOAuthToken = require('./getToken');
require('dotenv').config();

// Get environment settings
const USE_SANDBOX = process.env.USE_SANDBOX === 'true';

// Browse API endpoints
const BROWSE_API_URL = USE_SANDBOX 
  ? 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search'
  : 'https://api.ebay.com/buy/browse/v1/item_summary/search';

async function searchActiveItemsBrowseAPI(keywords, limit = 10) {
  try {
    console.log(`🔍 Browse API: Searching for "${keywords}" with limit ${limit}`);
    
    const token = await getOAuthToken();
    
    const response = await axios.get(BROWSE_API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': USE_SANDBOX ? 'EBAY-US' : 'EBAY-US'
      },
      params: {
        q: keywords,
        limit: limit,
        filter: 'conditions:{NEW|USED_EXCELLENT|USED_VERY_GOOD|USED_GOOD}'
      }
    });

    const items = response.data.itemSummaries || [];
    console.log(`📊 Browse API: Found ${items.length} items`);
    
    return items.map(item => ({
      title: item.title || '',
      price: item.price ? parseFloat(item.price.value) : 0,
      currency: item.price ? item.price.currency : 'USD',
      url: item.itemWebUrl || '',
      condition: item.condition || 'Unknown',
      imageUrl: item.image ? item.image.imageUrl : '',
      itemId: item.itemId || '',
      endTime: null
    }));
    
  } catch (err) {
    console.error('❌ Browse API Error:', err.response?.data || err.message);
    throw new Error('Browse API search failed');
  }
}

module.exports = { searchActiveItemsBrowseAPI }; 