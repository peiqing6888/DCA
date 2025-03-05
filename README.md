# DCA AI Strategy Application

A NERV-themed (Neon Genesis Evangelion) Dollar-Cost Averaging (DCA) strategy application built with Next.js and FastAPI, featuring AI-powered market analysis.

## Demo

![DCA AI Strategy Demo](demo1.png)

https://x.com/peiqing6888/status/1897141400615166090

Watch the demo video to see the NERV-themed DCA Strategy app in action, featuring:

- Real-time market analysis with DeepSeek AI
- Dynamic price charts and indicators
- Retro-futuristic NERV UI design
- Smart notifications and insights

## Features

- 🎨 NERV-inspired UI Design
  - Neon green/orange text on dark background
  - Grid patterns and scanning effects
  - OCR-A font for retro-tech feel
  - Glowing elements and hexagonal decorations
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
- 🛠️ Modern Development Stack
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

Create a `.env` file in the `api` directory with:

```env
DEEPSEEK_API_KEY=your_api_key_here  # Required for AI market analysis
```

## Project Structure

```
.
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── lib/              # Utilities and API clients
│   └── ...
├── api/                   # FastAPI backend
│   ├── main.py           # API endpoints
│   ├── .env              # Environment variables
│   └── requirements.txt   # Python dependencies
└── public/               # Static assets
    ├── fonts/           # Custom fonts (OCR-A)
    └── demo.mov         # Demo video
```

## Development

- Frontend runs on port 3000
- Backend API runs on port 8000
- Hot reloading enabled for both frontend and backend
- Tailwind CSS with NERV theme
- Real-time AI market analysis updates

## Security Notes

- Never commit `.env` files or API keys
- Keep your DeepSeek API key secure
- Use environment variables for sensitive data

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Inspired by NERV UI from Neon Genesis Evangelion
- Powered by DeepSeek's AI technology
- Uses DefiLlama API for market data
