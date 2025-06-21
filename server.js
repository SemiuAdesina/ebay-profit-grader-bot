require('dotenv').config();
const express = require('express');
const path = require('path');
const { findItemsByKeywords, getCompletedListings } = require('./src/api/ebayAPI');
const { searchActiveItemsBrowseAPI } = require('./src/api/browseAPI');
const { calculateGradeSimple } = require('./src/utils/grader');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Combined search endpoint: Get both active and sold listings
app.post('/api/searchAll', async (req, res) => {
  try {
    const { keywords, limit = 10 } = req.body;
    console.log(`🔍 Combined search: "${keywords}" with limit ${limit}`);
    
    // Fetch both active and sold listings in parallel
    const [activeItems, soldItems] = await Promise.all([
      searchActiveItemsBrowseAPI(keywords, limit).catch(err => {
        console.log('⚠️ Browse API failed for active, falling back to Finding API');
        return findItemsByKeywords(keywords).then(data => {
          if (!data.findItemsByKeywordsResponse || 
              !data.findItemsByKeywordsResponse[0] || 
              !data.findItemsByKeywordsResponse[0].searchResult) {
            return [];
          }
          const findingItems = data.findItemsByKeywordsResponse[0].searchResult[0].item || [];
          return findingItems.map(item => ({
            title: item.title ? item.title[0] : '',
            price: item.sellingStatus ? parseFloat(item.sellingStatus[0].currentPrice[0].__value__) : 0,
            currency: 'USD',
            url: item.viewItemURL ? item.viewItemURL[0] : '',
            condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Unknown',
            imageUrl: item.galleryURL ? item.galleryURL[0] : '',
            itemId: item.itemId ? item.itemId[0] : '',
            endTime: item.listingInfo ? item.listingInfo[0].endTime[0] : null
          }));
        });
      }),
      getCompletedListings(keywords, limit).catch(err => {
        console.log('⚠️ Sold listings failed:', err.message);
        return [];
      })
    ]);

    console.log(`✅ Active: ${activeItems.length}, Sold: ${soldItems.length}`);
    
    res.json({
      success: true,
      active: activeItems,
      sold: soldItems,
      activeCount: activeItems.length,
      soldCount: soldItems.length
    });
    
  } catch (error) {
    console.error('❌ Combined search error:', error);
    res.status(500).json({ 
      error: 'Combined search failed',
      details: error.message
    });
  }
});

// Individual active listings endpoint
app.post('/api/active', async (req, res) => {
  try {
    const { keywords, limit = 10 } = req.body;
    console.log(`🔍 Active search: "${keywords}" with limit ${limit}`);
    
    const activeItems = await searchActiveItemsBrowseAPI(keywords, limit);
    res.json({
      success: true,
      items: activeItems,
      count: activeItems.length
    });
    
  } catch (error) {
    console.error('❌ Active search error:', error);
    res.status(500).json({ 
      error: 'Active search failed',
      details: error.message
    });
  }
});

// Individual sold listings endpoint
app.post('/api/sold', async (req, res) => {
  try {
    const { keywords, limit = 10 } = req.body;
    console.log(`🔍 Sold search: "${keywords}" with limit ${limit}`);
    
    const soldItems = await getCompletedListings(keywords, limit);
    res.json({
      success: true,
      items: soldItems,
      count: soldItems.length
    });
    
  } catch (error) {
    console.error('❌ Sold search error:', error);
    res.status(500).json({ 
      error: 'Sold search failed',
      details: error.message
    });
  }
});

// API endpoint: handle analysis (using active listings only to avoid rate limits)
app.post('/api/analyze', async (req, res) => {
  try {
    const { keywords, bidPrice } = req.body;

    console.log(`�� Searching for: "${keywords}" with bid price: $${bidPrice}`);

    // Try Browse API first (OAuth - higher quota)
    let activeItems = [];
    let apiSource = 'Browse API (OAuth)';
    
    try {
      activeItems = await searchActiveItemsBrowseAPI(keywords, 20);
      console.log(`✅ Browse API: Found ${activeItems.length} items`);
    } catch (browseError) {
      console.log('⚠️ Browse API failed, falling back to Finding API');
      apiSource = 'Finding API (App ID)';
      
      // Fallback to Finding API
      const activeData = await findItemsByKeywords(keywords);
      console.log('📊 Raw API response received:', JSON.stringify(activeData, null, 2));

      // Check if the response has the expected structure
      if (!activeData.findItemsByKeywordsResponse || 
          !activeData.findItemsByKeywordsResponse[0] || 
          !activeData.findItemsByKeywordsResponse[0].searchResult) {
        throw new Error('Invalid API response structure');
      }

      const findingItems = activeData.findItemsByKeywordsResponse[0].searchResult[0].item || [];
      
      // Convert Finding API format to match Browse API format
      activeItems = findingItems.map(item => ({
        title: item.title ? item.title[0] : '',
        price: item.sellingStatus ? parseFloat(item.sellingStatus[0].currentPrice[0].__value__) : 0,
        currency: 'USD',
        url: item.viewItemURL ? item.viewItemURL[0] : '',
        condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Unknown',
        imageUrl: item.galleryURL ? item.galleryURL[0] : '',
        itemId: item.itemId ? item.itemId[0] : '',
        endTime: item.listingInfo ? item.listingInfo[0].endTime[0] : null
      }));
    }

    console.log(`📊 Found ${activeItems.length} active listings using ${apiSource}`);

    // Extract current prices from active listings
    const currentPrices = activeItems
      .map(item => item.price)
      .filter(price => price > 0);

    const averageCurrentPrice = currentPrices.length > 0 
      ? (currentPrices.reduce((a,b) => a + b, 0) / currentPrices.length) 
      : 0;

    console.log(`💰 Average current price: $${averageCurrentPrice.toFixed(2)}`);

    // Calculate grade based on current market prices (instead of sold prices)
    const { grade, profitPercentage, totalCost } = calculateGradeSimple(averageCurrentPrice, bidPrice);

    const response = {
      activeCount: activeItems.length,
      averageCurrentPrice: averageCurrentPrice.toFixed(2),
      grade,
      profitPercentage,
      totalCost: totalCost.toFixed(2),
      activeItems,
      apiSource,
      note: `Using ${apiSource} for active listings`
    };

    console.log('✅ Sending response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Something went wrong',
      details: error.message,
      note: "Try using sandbox mode or different keywords"
    });
  }
});

// New endpoint: Browse API search (for testing)
app.post('/api/search', async (req, res) => {
  try {
    const { keywords, limit = 10 } = req.body;
    console.log(`🔍 Browse API search: "${keywords}" with limit ${limit}`);
    
    const results = await searchActiveItemsBrowseAPI(keywords, limit);
    res.json({
      success: true,
      items: results,
      count: results.length
    });
    
  } catch (error) {
    console.error('❌ Browse API search error:', error);
    res.status(500).json({ 
      error: 'Browse API search failed',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('eBay Profit Grader Bot is ready!');
    console.log('🔧 Using Browse API (OAuth) with Finding API fallback');
    console.log('🆕 New endpoints: /api/searchAll, /api/active, /api/sold');
}); 