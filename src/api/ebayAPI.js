const axios = require('axios');
require('dotenv').config();

console.log("✅ EBAY_APP_ID_PROD:", process.env.EBAY_APP_ID_PROD);
console.log("✅ EBAY_APP_ID_SANDBOX:", process.env.EBAY_APP_ID_SANDBOX);
console.log("✅ USE_SANDBOX:", process.env.USE_SANDBOX);

// ✅ Toggle: true = use Sandbox, false = use Production
const USE_SANDBOX = process.env.USE_SANDBOX === 'true';

// ✅ App ID and URL based on toggle
const EBAY_APP_ID = USE_SANDBOX 
  ? process.env.EBAY_APP_ID_SANDBOX 
  : process.env.EBAY_APP_ID_PROD;

const EBAY_FINDING_API_URL = USE_SANDBOX 
  ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
  : 'https://svcs.ebay.com/services/search/FindingService/v1';

console.log("✅ FINAL APP ID IN USE:", EBAY_APP_ID);
console.log(`🔧 Using ${USE_SANDBOX ? 'SANDBOX' : 'PRODUCTION'} environment`);
console.log(`🔧 API URL: ${EBAY_FINDING_API_URL}`);

/**
 * Search for similar items on eBay
 * @param {string} keywords - Search keywords
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Array>} Array of eBay listings
 */
async function searchSimilarItems(keywords, maxResults = 10) {
    try {
        if (!EBAY_APP_ID) {
            throw new Error('eBay App ID not configured');
        }

        const params = {
            'OPERATION-NAME': 'findItemsByKeywords',
            'SERVICE-VERSION': '1.13.0',
            'SECURITY-APPNAME': EBAY_APP_ID,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': true,
            'keywords': keywords,
            'paginationInput.entriesPerPage': maxResults,
            'sortOrder': 'EndTimeSoonest',
            'itemFilter(0).name': 'ListingType',
            'itemFilter(0).value': 'Auction',
            'itemFilter(1).name': 'MinPrice',
            'itemFilter(1).value': '1.0'
        };

        const response = await axios.get(EBAY_FINDING_API_URL, { params });
        
        if (response.data.findItemsByKeywordsResponse && 
            response.data.findItemsByKeywordsResponse[0].searchResult) {
            
            const items = response.data.findItemsByKeywordsResponse[0].searchResult[0].item || [];
            return items.map(item => ({
                title: item.title ? item.title[0] : '',
                price: item.sellingStatus ? parseFloat(item.sellingStatus[0].currentPrice[0].__value__) : 0,
                endTime: item.listingInfo ? item.listingInfo[0].endTime[0] : '',
                itemId: item.itemId ? item.itemId[0] : '',
                viewItemURL: item.viewItemURL ? item.viewItemURL[0] : '',
                condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Unknown'
            }));
        }
        
        return [];
    } catch (error) {
        if (error.response) {
            console.error('eBay API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('eBay API Error:', error.message);
        }
        throw new Error('Failed to fetch eBay listings');
    }
}

/**
 * Get completed listings for price analysis
 * @param {string} keywords - Search keywords
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Array>} Array of completed eBay listings
 */
async function getCompletedListings(keywords, maxResults = 10) {
    try {
        if (!EBAY_APP_ID) {
            throw new Error('eBay App ID not configured');
        }

        const params = {
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.13.0',
            'SECURITY-APPNAME': EBAY_APP_ID,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': true,
            'keywords': keywords,
            'paginationInput.entriesPerPage': maxResults,
            'sortOrder': 'EndTimeSoonest',
            'itemFilter(0).name': 'ListingType',
            'itemFilter(0).value': 'Auction'
        };

        const response = await axios.get(EBAY_FINDING_API_URL, { params });
        
        if (response.data.findCompletedItemsResponse && 
            response.data.findCompletedItemsResponse[0].searchResult) {
            
            const items = response.data.findCompletedItemsResponse[0].searchResult[0].item || [];
            return items.map(item => ({
                title: item.title ? item.title[0] : '',
                price: item.sellingStatus ? parseFloat(item.sellingStatus[0].currentPrice[0].__value__) : 0,
                endTime: item.listingInfo ? item.listingInfo[0].endTime[0] : '',
                itemId: item.itemId ? item.itemId[0] : '',
                viewItemURL: item.viewItemURL ? item.viewItemURL[0] : '',
                condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Unknown'
            }));
        }
        
        return [];
    } catch (error) {
        if (error.response) {
            console.error('eBay API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('eBay API Error:', error.message);
        }
        throw new Error('Failed to fetch completed eBay listings');
    }
}

/**
 * Analyze market data for a given item
 * @param {string} description - Item description
 * @returns {Promise<Object>} Market analysis data
 */
async function analyzeMarketData(description) {
    try {
        // Get current and completed listings
        const [currentListings, completedListings] = await Promise.all([
            searchSimilarItems(description, 20),
            getCompletedListings(description, 20)
        ]);

        // Calculate price statistics
        const allPrices = [
            ...currentListings.map(item => item.price),
            ...completedListings.map(item => item.price)
        ].filter(price => price > 0);

        if (allPrices.length === 0) {
            return {
                averagePrice: 0,
                medianPrice: 0,
                minPrice: 0,
                maxPrice: 0,
                priceRange: 0,
                totalListings: 0
            };
        }

        const sortedPrices = allPrices.sort((a, b) => a - b);
        const averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const priceRange = maxPrice - minPrice;

        return {
            averagePrice: Math.round(averagePrice * 100) / 100,
            medianPrice: Math.round(medianPrice * 100) / 100,
            minPrice: Math.round(minPrice * 100) / 100,
            maxPrice: Math.round(maxPrice * 100) / 100,
            priceRange: Math.round(priceRange * 100) / 100,
            totalListings: allPrices.length,
            currentListings: currentListings.length,
            completedListings: completedListings.length
        };
    } catch (error) {
        console.error('Market analysis error:', error);
        throw new Error('Failed to analyze market data');
    }
}

// Functions that return raw API response for server compatibility
async function findItemsByKeywords(keywords, maxResults = 10) {
    try {
        if (!EBAY_APP_ID) {
            throw new Error('eBay App ID not configured');
        }

        const params = {
            'OPERATION-NAME': 'findItemsByKeywords',
            'SERVICE-VERSION': '1.13.0',
            'SECURITY-APPNAME': EBAY_APP_ID,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': true,
            'keywords': keywords,
            'paginationInput.entriesPerPage': maxResults,
            'sortOrder': 'EndTimeSoonest',
            'itemFilter(0).name': 'ListingType',
            'itemFilter(0).value': 'Auction',
            'itemFilter(1).name': 'MinPrice',
            'itemFilter(1).value': '1.0'
        };

        const response = await axios.get(EBAY_FINDING_API_URL, { params });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('eBay API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('eBay API Error:', error.message);
        }
        throw new Error('Failed to fetch eBay listings');
    }
}

async function findCompletedItems(keywords, maxResults = 10) {
    try {
        if (!EBAY_APP_ID) {
            throw new Error('eBay App ID not configured');
        }

        const params = {
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.13.0',
            'SECURITY-APPNAME': EBAY_APP_ID,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': true,
            'keywords': keywords,
            'paginationInput.entriesPerPage': maxResults,
            'sortOrder': 'EndTimeSoonest',
            'itemFilter(0).name': 'ListingType',
            'itemFilter(0).value': 'Auction'
        };

        const response = await axios.get(EBAY_FINDING_API_URL, { params });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('eBay API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('eBay API Error:', error.message);
        }
        throw new Error('Failed to fetch completed eBay listings');
    }
}

module.exports = {
    searchSimilarItems,
    getCompletedListings,
    analyzeMarketData,
    findItemsByKeywords,
    findCompletedItems
}; 