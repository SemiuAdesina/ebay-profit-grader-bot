/**
 * Calculate profit grade based on bid price and market analysis
 * @param {number} bidPrice - The bid price for the item
 * @param {Object} marketData - Market analysis data from eBay API
 * @returns {Object} Grade and analysis information
 */
function calculateGrade(bidPrice, marketData) {
    if (!marketData || marketData.totalListings === 0) {
        return {
            grade: 'F',
            score: 0,
            profitMargin: 0,
            riskLevel: 'High',
            confidence: 'Low',
            reasoning: 'No market data available for analysis'
        };
    }

    const { averagePrice, medianPrice, minPrice, maxPrice, priceRange } = marketData;
    
    // Calculate potential selling price (use median as it's less affected by outliers)
    const potentialSellingPrice = medianPrice;
    
    // Calculate gross profit
    const grossProfit = potentialSellingPrice - bidPrice;
    
    // Calculate profit margin percentage
    const profitMargin = bidPrice > 0 ? (grossProfit / bidPrice) * 100 : 0;
    
    // Calculate risk factors
    const priceVolatility = priceRange / averagePrice; // Higher = more volatile
    const marketSize = marketData.totalListings;
    
    // Base score calculation (0-100)
    let score = 0;
    
    // Profit margin component (40% of score)
    if (profitMargin > 50) score += 40;
    else if (profitMargin > 30) score += 30;
    else if (profitMargin > 20) score += 20;
    else if (profitMargin > 10) score += 10;
    else if (profitMargin > 0) score += 5;
    
    // Price stability component (30% of score)
    if (priceVolatility < 0.3) score += 30;
    else if (priceVolatility < 0.5) score += 20;
    else if (priceVolatility < 0.7) score += 10;
    
    // Market size component (20% of score)
    if (marketSize > 50) score += 20;
    else if (marketSize > 20) score += 15;
    else if (marketSize > 10) score += 10;
    else if (marketSize > 5) score += 5;
    
    // Price positioning component (10% of score)
    const pricePosition = (bidPrice - minPrice) / (maxPrice - minPrice);
    if (pricePosition < 0.3) score += 10; // Good price
    else if (pricePosition < 0.5) score += 7;
    else if (pricePosition < 0.7) score += 4;
    
    // Determine grade
    let grade, riskLevel, confidence;
    
    if (score >= 85) {
        grade = 'A';
        riskLevel = 'Low';
        confidence = 'High';
    } else if (score >= 70) {
        grade = 'B';
        riskLevel = 'Low-Medium';
        confidence = 'Medium-High';
    } else if (score >= 55) {
        grade = 'C';
        riskLevel = 'Medium';
        confidence = 'Medium';
    } else if (score >= 40) {
        grade = 'D';
        riskLevel = 'Medium-High';
        confidence = 'Medium-Low';
    } else {
        grade = 'F';
        riskLevel = 'High';
        confidence = 'Low';
    }
    
    // Generate reasoning
    const reasoning = generateReasoning(grade, profitMargin, priceVolatility, marketSize, pricePosition);
    
    return {
        grade,
        score: Math.round(score),
        profitMargin: Math.round(profitMargin * 100) / 100,
        riskLevel,
        confidence,
        reasoning,
        marketData: {
            averagePrice,
            medianPrice,
            minPrice,
            maxPrice,
            priceRange: Math.round(priceRange * 100) / 100,
            totalListings: marketData.totalListings
        }
    };
}

/**
 * Simple calculateGrade function for server compatibility
 * @param {number} averageSoldPrice - Average selling price from completed listings
 * @param {number} bidPrice - The bid price for the item
 * @returns {Object} Grade and profit information
 */
function calculateGradeSimple(averageSoldPrice, bidPrice) {
    if (!averageSoldPrice || averageSoldPrice <= 0) {
        return {
            grade: 'F',
            profitPercentage: 0,
            totalCost: bidPrice
        };
    }

    const profit = averageSoldPrice - bidPrice;
    const profitPercentage = bidPrice > 0 ? (profit / bidPrice) * 100 : 0;
    
    // Calculate eBay fees (10% + PayPal 2.9% + $0.30)
    const ebayFees = averageSoldPrice * 0.10;
    const paypalFees = (averageSoldPrice * 0.029) + 0.30;
    const totalFees = ebayFees + paypalFees;
    
    const netProfit = profit - totalFees;
    const netProfitPercentage = bidPrice > 0 ? (netProfit / bidPrice) * 100 : 0;
    
    // Determine grade based on net profit percentage
    let grade;
    if (netProfitPercentage >= 30) grade = 'A';
    else if (netProfitPercentage >= 20) grade = 'B';
    else if (netProfitPercentage >= 10) grade = 'C';
    else if (netProfitPercentage >= 0) grade = 'D';
    else grade = 'F';
    
    return {
        grade,
        profitPercentage: Math.round(netProfitPercentage * 100) / 100,
        totalCost: bidPrice + totalFees
    };
}

/**
 * Generate reasoning for the grade
 * @param {string} grade - The assigned grade
 * @param {number} profitMargin - Profit margin percentage
 * @param {number} priceVolatility - Price volatility ratio
 * @param {number} marketSize - Number of listings
 * @param {number} pricePosition - Position within price range
 * @returns {string} Reasoning text
 */
function generateReasoning(grade, profitMargin, priceVolatility, marketSize, pricePosition) {
    const reasons = [];
    
    // Profit margin reasoning
    if (profitMargin > 50) {
        reasons.push('Excellent profit margin potential');
    } else if (profitMargin > 30) {
        reasons.push('Good profit margin potential');
    } else if (profitMargin > 20) {
        reasons.push('Moderate profit margin potential');
    } else if (profitMargin > 10) {
        reasons.push('Low profit margin potential');
    } else if (profitMargin > 0) {
        reasons.push('Minimal profit margin potential');
    } else {
        reasons.push('No profit margin - potential loss');
    }
    
    // Market stability reasoning
    if (priceVolatility < 0.3) {
        reasons.push('Stable market prices');
    } else if (priceVolatility < 0.5) {
        reasons.push('Moderately stable market');
    } else {
        reasons.push('Volatile market prices');
    }
    
    // Market size reasoning
    if (marketSize > 50) {
        reasons.push('Large market with many listings');
    } else if (marketSize > 20) {
        reasons.push('Good market size');
    } else if (marketSize > 10) {
        reasons.push('Limited market data');
    } else {
        reasons.push('Very limited market data');
    }
    
    // Price positioning reasoning
    if (pricePosition < 0.3) {
        reasons.push('Competitive pricing');
    } else if (pricePosition < 0.5) {
        reasons.push('Average pricing');
    } else {
        reasons.push('Higher than average pricing');
    }
    
    return reasons.join('. ') + '.';
}

/**
 * Calculate eBay fees for a given selling price
 * @param {number} sellingPrice - The selling price
 * @returns {Object} Fee breakdown
 */
function calculateEBayFees(sellingPrice) {
    // Final Value Fee (FVF) - typically 10% for most categories
    const finalValueFee = sellingPrice * 0.10;
    
    // PayPal fees (if applicable) - typically 2.9% + $0.30
    const paypalFee = (sellingPrice * 0.029) + 0.30;
    
    // Insertion fee (free for first 50 listings per month)
    const insertionFee = 0;
    
    const totalFees = finalValueFee + paypalFee + insertionFee;
    
    return {
        finalValueFee: Math.round(finalValueFee * 100) / 100,
        paypalFee: Math.round(paypalFee * 100) / 100,
        insertionFee,
        totalFees: Math.round(totalFees * 100) / 100
    };
}

/**
 * Calculate net profit after fees
 * @param {number} bidPrice - Purchase price
 * @param {number} sellingPrice - Selling price
 * @param {number} shippingCost - Shipping cost (optional)
 * @returns {Object} Net profit calculation
 */
function calculateNetProfit(bidPrice, sellingPrice, shippingCost = 0) {
    const fees = calculateEBayFees(sellingPrice);
    const grossProfit = sellingPrice - bidPrice;
    const netProfit = grossProfit - fees.totalFees - shippingCost;
    const netProfitMargin = bidPrice > 0 ? (netProfit / bidPrice) * 100 : 0;
    
    return {
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netProfitMargin: Math.round(netProfitMargin * 100) / 100,
        fees: fees,
        shippingCost: shippingCost
    };
}

module.exports = {
    calculateGrade,
    calculateGradeSimple,
    calculateEBayFees,
    calculateNetProfit
}; 