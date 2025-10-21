#  VoiceScape - AI-Powered Voice Chat with Interactive Maps







VoiceScape is a cutting-edge web application that revolutionizes how we interact with maps through **natural voice conversations**. Powered by Google's GenAI Live API and 3D Maps, it enables users to:

- 🎤 **Chat naturally** with AI about locations, restaurants, and activities
- 🗺️ **Explore 3D maps** with real-time voice-controlled navigation
- 🍕 **Plan itineraries** through conversational AI assistance
- 🎯 **Get instant recommendations** based on live Google Maps data
- 🎮 **Play interactive games** like scavenger hunts with location-based clues

### 🌟 Key Features

| Feature | Description |
|---------|-------------|
| **🎙️ Real-time Voice Chat** | Natural conversation with AI using Google GenAI Live API |
| **🗺️ 3D Interactive Maps** | Immersive Google Maps 3D experience with satellite imagery |
| **📍 Smart Location Services** | Geocoding, place search, and real-time location data |
| **🎯 AI-Powered Itinerary Planning** | Collaborative trip planning with voice and text input |
| **🎮 Interactive Games** | Scavenger hunts and location-based challenges |
| **📱 Responsive Design** | Optimized for desktop and mobile experiences |
| **🔊 Multiple Voice Options** | 40+ AI voices with different personalities and tones |
| **⚡ Real-time Audio Processing** | Low-latency audio streaming and transcription |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Google Maps API Key
- Google GenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/adityayaduvanshi/VoiceScape.git
cd voicescape

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Create a `.env.local` file with your API keys:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google GenAI API Key  
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

