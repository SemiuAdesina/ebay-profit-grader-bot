# eBay Profit Grader Bot

A web application that analyzes eBay listings to calculate potential profit margins and assign grades based on profitability.

## Features

- Analyze eBay listings by description and bid price
- Calculate potential profit margins
- Assign grades based on profitability analysis
- Clean, modern web interface
- Real-time eBay API integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- eBay Developer Account with API credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ebay-profit-grader-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your eBay API credentials:
```env
EBAY_APP_ID=your_ebay_app_id_here
```

## Getting eBay API Credentials

1. Go to [eBay Developer Program](https://developer.ebay.com/)
2. Sign up for a developer account
3. Create a new application
4. Get your App ID (Client ID)
5. Add the App ID to your `.env` file

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Enter an item description and bid price in the form

4. Click "Analyze" to get profit analysis and grade

## API Endpoints

- `GET /` - Serves the main HTML page
- `POST /api/analyze` - Analyzes eBay listings for profit potential

## Project Structure

```
ebay-profit-grader-bot/
│
├── .env                    # Stores EBAY_APP_ID
├── package.json            # Dependencies: express, axios, dotenv
├── server.js               # Main server file: serves HTML & handles API
│
├── /public                 # Frontend static files for client
│   ├── index.html          # The form (Description + Bid price)
│   ├── style.css           # Styling for clean UI
│   ├── main.js             # Browser JS: handles form submit + render results
│
├── /src
│   ├── /api
│   │   ├── ebayAPI.js      # Functions to call eBay Finding API
│   ├── /utils
│   │   ├── grader.js       # calculateGrade function (profit logic)
│
├── /tests                  # (Optional) Unit tests
│   ├── grader.test.js
│
└── README.md               # This file
```

## Dependencies

- **express**: Web server framework
- **axios**: HTTP client for API calls
- **dotenv**: Environment variable management

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Testing

To run unit tests:
```bash
npm test
```

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 