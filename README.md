# DCA AI Strategy Application

A Mac OS 8 style Dollar-Cost Averaging (DCA) strategy application built with Next.js and FastAPI.

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
  - AI-enhanced investment recommendations
  - Strategy history tracking
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

# Start the FastAPI server
uvicorn main:app --reload
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
.
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── lib/              # Utilities and API clients
│   └── ...
├── api/                   # FastAPI backend
│   ├── main.py           # API endpoints
│   └── requirements.txt   # Python dependencies
└── public/               # Static assets
```

## Development

- Frontend runs on port 3000
- Backend API runs on port 8000
- Hot reloading enabled for both frontend and backend
- Tailwind CSS for styling with Mac OS 8 theme
- Sound effects for interactions

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Inspired by Mac OS 8's iconic design
- Built with modern web technologies
- Uses Yahoo Finance API for real-time data
