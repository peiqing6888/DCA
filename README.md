# DCA AI Strategy Application

A Mac OS 8 style Dollar-Cost Averaging (DCA) strategy application built with Next.js and FastAPI, featuring AI-powered market analysis.

![DCA AI Strategy App Screenshot]

## Features

- 🖥️ Mac OS 8 style user interface
  - Window management (drag, resize, minimize, maximize)
  - Classic menu bar with dropdown menus
  - System sounds and animations
  - Pixel-perfect recreation of classic UI elements
- 📈 DCA Strategy Analysis
  - Real-time asset price tracking
  - Technical indicators (SMA50, SMA200)
  - DeepSeek AI-powered market analysis
  - Smart notifications and insights
  - Strategy history tracking
- 🤖 AI Features
  - Market sentiment analysis
  - Price trend predictions
  - Risk assessment
  - Automated trading suggestions
- 🎨 Modern Development Stack
  - Next.js 14 with App Router
  - FastAPI backend with real-time data
  - Tailwind CSS for styling
  - Framer Motion for animations

## Getting Started

### Prerequisites

- Node.js 18+ and npm/bun
- Python 3.11+
- pip
- DeepSeek API key

### Frontend Setup

```bash
# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

### Backend Setup

```bash
# Create and activate virtual environment
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure DeepSeek API
# Create a .env file in the api directory with your API key:
echo "DEEPSEEK_API_KEY=your_api_key_here" > .env

# Start the FastAPI server
./start.sh
# or manually:
uvicorn main:app --reload
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

The following environment variables are required for the backend:

```env
DEEPSEEK_API_KEY=your_api_key_here  # Required for AI market analysis
```

Make sure to create a `.env` file in the `api` directory with these variables before starting the server.

## Project Structure

```
.
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── lib/              # Utilities and API clients
│   └── ...
├── api/                   # FastAPI backend
│   ├── main.py           # API endpoints
│   ├── .env              # Environment variables (not in git)
│   └── requirements.txt   # Python dependencies
└── public/               # Static assets
```

## Development

- Frontend runs on port 3000
- Backend API runs on port 8000
- Hot reloading enabled for both frontend and backend
- Tailwind CSS for styling with Mac OS 8 theme
- Sound effects for interactions
- Real-time AI market analysis updates every 5 minutes

## Security Notes

- Never commit your `.env` files or API keys to version control
- The `.env` file is automatically ignored by git
- Keep your DeepSeek API key secure and rotate it regularly
- Use environment variables for all sensitive configuration

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Powered by DeepSeek's AI technology
- Inspired by Mac OS 8's iconic design
- Built with modern web technologies
- Uses DefiLlama API for real-time market data
