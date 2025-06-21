// DOM elements
const analysisForm = document.getElementById('analysisForm');
const resultsDiv = document.getElementById('results');
const resultsContent = document.getElementById('resultsContent');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');

// Search functions
async function searchActive() {
    const keywords = document.getElementById('searchKeywords').value.trim();
    if (!keywords) {
        alert('Please enter search keywords');
        return;
    }
    
    try {
        showSearchLoading();
        const response = await fetch('/api/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, limit: 10 })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch active listings');
        }
        
        displaySearchResults({ active: data.items, sold: [] }, data.count, 0);
        
    } catch (error) {
        console.error('❌ Active search error:', error);
        showSearchError(error.message);
    } finally {
        hideSearchLoading();
    }
}

async function searchSold() {
    const keywords = document.getElementById('searchKeywords').value.trim();
    if (!keywords) {
        alert('Please enter search keywords');
        return;
    }
    
    try {
        showSearchLoading();
        const response = await fetch('/api/sold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, limit: 10 })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch sold listings');
        }
        
        displaySearchResults({ active: [], sold: data.items }, 0, data.count);
        
    } catch (error) {
        console.error('❌ Sold search error:', error);
        showSearchError(error.message);
    } finally {
        hideSearchLoading();
    }
}

async function searchBoth() {
    const keywords = document.getElementById('searchKeywords').value.trim();
    if (!keywords) {
        alert('Please enter search keywords');
        return;
    }
    
    try {
        showSearchLoading();
        const response = await fetch('/api/searchAll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, limit: 10 })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch listings');
        }
        
        displaySearchResults(data, data.activeCount, data.soldCount);
        
    } catch (error) {
        console.error('❌ Combined search error:', error);
        showSearchError(error.message);
    } finally {
        hideSearchLoading();
    }
}

function displaySearchResults(data, activeCount, soldCount) {
    const searchResults = document.getElementById('searchResults');
    const activeCountEl = document.getElementById('activeCount');
    const soldCountEl = document.getElementById('soldCount');
    const activeList = document.getElementById('activeList');
    const soldList = document.getElementById('soldList');
    
    // Update counts
    activeCountEl.textContent = `${activeCount} Active`;
    soldCountEl.textContent = `${soldCount} Sold`;
    
    // Display active listings
    activeList.innerHTML = '';
    if (data.active && data.active.length > 0) {
        data.active.forEach(item => {
            const li = document.createElement('li');
            
            // Handle endTime properly - Browse API doesn't always have it
            let endTimeDisplay = '';
            if (item.endTime && item.endTime !== 'FIXED_PRICE' && item.endTime !== 'Invalid Date') {
                try {
                    const endDate = new Date(item.endTime);
                    if (!isNaN(endDate.getTime())) {
                        endTimeDisplay = `<div class="item-end-time">Ends: ${endDate.toLocaleDateString()}</div>`;
                    }
                } catch (e) {
                    // Invalid date, don't show anything
                }
            }
            
            li.innerHTML = `
                <div>
                    <a href="${item.url || '#'}" target="_blank">${item.title || 'No title'}</a>
                    <div class="item-price">$${item.price || 'N/A'}</div>
                    <div class="item-condition">${item.condition || 'Unknown condition'}</div>
                    ${endTimeDisplay}
                </div>
            `;
            activeList.appendChild(li);
        });
    } else {
        activeList.innerHTML = '<li>No active listings found</li>';
    }
    
    // Display sold listings
    soldList.innerHTML = '';
    if (data.sold && data.sold.length > 0) {
        data.sold.forEach(item => {
            const li = document.createElement('li');
            
            // Handle endTime for sold items
            let endTimeDisplay = '';
            if (item.endTime && item.endTime !== 'Invalid Date') {
                try {
                    const endDate = new Date(item.endTime);
                    if (!isNaN(endDate.getTime())) {
                        endTimeDisplay = `<div class="item-end-time">Sold: ${endDate.toLocaleDateString()}</div>`;
                    }
                } catch (e) {
                    // Invalid date, don't show anything
                }
            }
            
            li.innerHTML = `
                <div>
                    <a href="${item.url || '#'}" target="_blank">${item.title || 'No title'}</a>
                    <div class="item-price">$${item.price || 'N/A'}</div>
                    <div class="item-condition">${item.condition || 'Unknown condition'}</div>
                    ${endTimeDisplay}
                </div>
            `;
            soldList.appendChild(li);
        });
    } else {
        soldList.innerHTML = '<li>No sold listings found</li>';
    }
    
    // Show results
    searchResults.style.display = 'block';
    hideSearchError();
}

function showSearchLoading() {
    const buttons = document.querySelectorAll('.search-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Searching...';
    });
}

function hideSearchLoading() {
    const buttons = document.querySelectorAll('.search-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
        if (btn.classList.contains('active-btn')) {
            btn.textContent = 'Search Active Listings';
        } else if (btn.classList.contains('sold-btn')) {
            btn.textContent = 'Search Sold Listings';
        } else if (btn.classList.contains('both-btn')) {
            btn.textContent = 'Search Both (Active + Sold)';
        }
    });
}

function showSearchError(message) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `
        <div class="error">
            <h3>Search Error</h3>
            <p>${message}</p>
        </div>
    `;
    searchResults.style.display = 'block';
}

function hideSearchError() {
    // Error handling is done within displaySearchResults
}

// Form submission handler
document.getElementById('analyze-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const keywords = document.getElementById('keywords').value;
    const bidPrice = parseFloat(document.getElementById('bidPrice').value);
    
    // Show loading state
    const button = e.target.querySelector('.analyze-btn');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    // Hide previous results and errors
    document.getElementById('results').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    try {
        console.log('🚀 Sending request:', { keywords, bidPrice });
        
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, bidPrice })
        });
        
        console.log('📡 Response status:', res.status);
        
        const data = await res.json();
        console.log('📊 Response data:', data);
        
        if (!res.ok) {
            throw new Error(data.error || data.details || 'Failed to analyze listing');
        }
        
        // Check if we have the expected data
        if (!data.activeCount && !data.activeItems) {
            throw new Error('No data received from server');
        }
        
        let html = `
            <h2>--- Analysis Complete ---</h2>
            <div class="alert alert-info">
                <strong>Note:</strong> ${data.note || 'Using active listings to avoid API rate limits'}
            </div>
            <div class="alert alert-success">
                <strong>API Source:</strong> ${data.apiSource || 'Unknown'}
            </div>
            <p><strong>Active Listings Found:</strong> ${data.activeCount}</p>
            <p><strong>Average Current Price:</strong> $${data.averageCurrentPrice}</p>
            <p><strong>Your Total Cost (incl. premium & tax):</strong> $${data.totalCost}</p>
            <p><strong>Potential Profit:</strong> ${data.profitPercentage}%</p>
            <p><strong>Profit Grade:</strong> ${data.grade}</p>

            <h3>Active Listings (with Individual Profit Analysis):</h3>
            <ul>
                ${data.activeItems && data.activeItems.length > 0 ? data.activeItems.map(item => {
                    // Calculate individual profit for each item
                    const itemPrice = parseFloat(item.price) || 0;
                    const totalCost = parseFloat(data.totalCost) || 0;
                    const individualProfit = itemPrice - totalCost;
                    const individualProfitPercent = totalCost > 0 ? ((individualProfit / totalCost) * 100) : 0;
                    
                    // Determine individual grade
                    let individualGrade = 'F';
                    if (individualProfitPercent >= 50) individualGrade = 'A';
                    else if (individualProfitPercent >= 25) individualGrade = 'B';
                    else if (individualProfitPercent >= 10) individualGrade = 'C';
                    else if (individualProfitPercent >= 0) individualGrade = 'D';
                    
                    // Handle endTime properly
                    let endTimeDisplay = '';
                    if (item.endTime && item.endTime !== 'FIXED_PRICE' && item.endTime !== 'Invalid Date') {
                        try {
                            const endDate = new Date(item.endTime);
                            if (!isNaN(endDate.getTime())) {
                                endTimeDisplay = `Ends: ${endDate.toLocaleDateString()}<br>`;
                            }
                        } catch (e) {
                            // Invalid date, don't show anything
                        }
                    }
                    
                    return `
                        <li>
                            <strong>${item.title || 'No title'}</strong><br>
                            <div class="item-details">
                                <span class="item-price">Current Price: $${item.price || 'N/A'}</span><br>
                                <span class="item-condition">Condition: ${item.condition || 'N/A'}</span><br>
                                ${endTimeDisplay}
                                <span class="item-profit ${individualProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                    Individual Profit: $${individualProfit.toFixed(2)} (${individualProfitPercent.toFixed(1)}%)
                                </span>
                                <span class="item-grade grade-${individualGrade.toLowerCase()}">Grade: ${individualGrade}</span><br>
                                ${item.imageUrl ? `<img src="${item.imageUrl}" width="100" style="margin-top: 5px;"><br>` : ''}
                                ${item.url ? `<a href="${item.url}" target="_blank" style="font-size: 12px; color: #007bff;">View on eBay</a>` : ''}
                            </div>
                        </li>
                    `;
                }).join('') : '<li>No active listings found</li>'}
            </ul>
        `;
        
        document.getElementById('results').innerHTML = html;
        document.getElementById('results').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        console.error('❌ Error details:', error.message);
        
        let errorMsg = error.message || 'An error occurred while analyzing the listing.';
        
        // Show more detailed error information
        if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Network error: Could not connect to server. Please check if the server is running.';
        } else if (error.message.includes('No data received')) {
            errorMsg = 'No data received from eBay API. Try different keywords or check API status.';
        }
        
        document.getElementById('errorMessage').textContent = errorMsg;
        document.getElementById('error').style.display = 'block';
    } finally {
        // Reset loading state
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});

// Display analysis results
function displayResults(data) {
    const html = `
        <div class="grade grade-${data.grade.toLowerCase()}">Grade: ${data.grade}</div>
        <div class="mb-20">
            <h3>Analysis Summary</h3>
            <p><strong>Keywords:</strong> ${document.getElementById('description').value}</p>
            <p><strong>Bid Price:</strong> $${document.getElementById('bidPrice').value}</p>
            <p><strong>Average Current Price:</strong> $${data.averageCurrentPrice}</p>
            <p><strong>Profit Percentage:</strong> ${data.profitPercentage}%</p>
            <p><strong>Total Cost (with fees):</strong> $${data.totalCost}</p>
        </div>
        <div class="mb-20">
            <h3>Market Data</h3>
            <p><strong>Active Listings Found:</strong> ${data.activeCount}</p>
            <p><strong>Note:</strong> ${data.note || 'Using active listings to avoid API rate limits'}</p>
        </div>
        <div>
            <h3>Recommendations</h3>
            <ul>
                <li>${data.grade === 'A' ? 'Excellent opportunity - high profit potential' : 
                       data.grade === 'B' ? 'Good opportunity - consider bidding' :
                       data.grade === 'C' ? 'Moderate opportunity - proceed with caution' :
                       data.grade === 'D' ? 'Low opportunity - consider negotiating' :
                       'Poor opportunity - avoid or negotiate significantly'}</li>
                <li>Research similar completed listings for better pricing insights</li>
                <li>Factor in shipping and handling costs</li>
                <li>Account for eBay fees in profit calculation</li>
            </ul>
        </div>
    `;
    
    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
    errorDiv.style.display = 'none';
}

// Hide results
function hideResults() {
    resultsDiv.style.display = 'none';
}

// Set loading state
function setLoadingState(isLoading) {
    const button = analysisForm.querySelector('.analyze-btn');
    
    if (isLoading) {
        button.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
    } else {
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Clear form
function clearForm() {
    analysisForm.reset();
    hideResults();
    hideError();
}

// Add clear button functionality (optional)
// You can add a clear button to the HTML and use this function
// document.getElementById('clearBtn').addEventListener('click', clearForm); 