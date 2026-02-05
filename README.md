# 🧘 SwasthyaSaathi 1.0  
### Your AI-Powered Mental Wellness Companion  

SwasthyaSaathi (स्वास्थ्यसाथी — *Health Companion* in Hindi) is a holistic mental wellness web application designed to help users manage stress, anxiety, and overall well-being through guided meditation, yoga, breathing exercises, wellness tracking, and an empathetic AI companion named **Ruhi**.

---

## ✨ Features

### 🎯 Core Wellness Features
- **🧘 Guided Meditation**  
  Curated ambient audio tracks (Ocean Waves, Forest Rain, Tibetan Bowls, etc.) with real-time duration tracking.

- **🧎 Yoga Poses**  
  Category-based yoga postures for diabetes, hypertension, stress, anxiety, and back pain with step-by-step guidance.

- **🌬️ Breathing Exercises**  
  Anulom Vilom, 4-7-8 technique, Box Breathing, and Energizing Breath with visual cues and animations.

- **📚 Books & Health Facts**  
  Inspirational wellness book recommendations and interesting health facts.

- **💬 Ruhi — AI Wellness Companion**  
  An empathetic AI chatbot that provides personalized mental-wellness guidance and emotional support.

---

## 📊 Tracking & Analytics
- **Daily Wellness Tracker**  
  Log water intake, sleep hours, mood, meditation, and exercise.

- **Happiness & Health Index**  
  Dynamic indices (0–100) calculated from daily habits and activities.

- **Weekly / Monthly Charts**  
  Visualize wellness trends and personal progress.

- **Personalized Suggestions**  
  AI-powered recommendations based on activity patterns.

---

## 🎨 User Experience
- **Calming UI** with soft sage-green palette and gentle animations  
- **Fully Responsive** — optimized for desktop and mobile  
- **Personalized Onboarding** based on age, mood, and preferences  
- **Floating Chat Interface** for instant access to Ruhi anywhere in the app  

---

## 🧠 Ruhi AI Companion
## 🌸 Why “Ruhi”?

The name **Ruhi** comes from the word *“Ruh”*, which means **soul**.

Mental wellness is deeply personal — it’s not just about habits, data, or scores, but about how a person *feels* on the inside. Ruhi represents the gentle inner voice that listens without judgment, understands emotions, and offers support with compassion.

Rather than acting like a clinical assistant or command-based chatbot, **Ruhi is designed to feel like a caring presence — a companion that speaks to the soul**.

Ruhi is an empathetic AI wellness assistant that:
- Uses a warm, non-judgmental tone with gentle Hindi phrases  
- Understands user mood, habits, and wellness data  
- Suggests relevant meditation tracks, yoga poses, and breathing exercises  
- Offers crisis-support guidance when needed  
- Celebrates wellness milestones and positive habits  

### Personality Traits
- 💚 Empathetic and supportive  
- 🙏 Gentle Hindi warmth (“aapka”, “bilkul”, “shanti se”)  
- ✨ Validates emotions before giving suggestions  
- 🧘 Deeply aware of all app features  

---

## 📊 Wellness Indices

### Happiness Index
Calculated using:
- Daily mood logging (1–5 scale)
- Meditation duration
- Breathing exercises completed

### Health Index
Calculated using:
- Water intake (8-glass goal)
- Sleep duration (7–9 hours optimal)
- Yoga practice
- Breathing exercises

---

## 🏥 Yoga Health Categories

| Category | Target Conditions | Key Poses |
|--------|------------------|-----------|
| **Diabetes Management** | Blood sugar control | Surya Namaskar, Dhanurasana |
| **Hypertension Control** | Blood pressure | Shavasana, Viparita Karani |
| **Stress & Anxiety** | Mental wellness | Balasana, Cat-Cow Stretch |
| **Back Pain Relief** | Spinal health | Bhujangasana, Setu Bandhasana |

---

## 🛠️ Tech Stack

| Category | Technology |
|--------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State Management** | React Context, TanStack Query |
| **Charts** | Recharts |
| **Backend** | Supabase Edge Functions |
| **AI** | Google Gemini API |
| **Routing** | React Router v6 |

---

## 📁 Project Structure

swasthyasaathi/
├── src/
│ ├── components/
│ │ ├── chat/ # Ruhi AI chatbot
│ │ ├── dashboard/ # Dashboard cards & charts
│ │ ├── tabs/ # Meditation, Yoga, Breathing, Books
│ │ ├── tracking/ # Daily wellness tracker
│ │ └── ui/ # Reusable UI components
│ ├── contexts/ # React Context providers
│ ├── hooks/ # Custom hooks
│ ├── integrations/ # Supabase configuration
│ ├── lib/ # Utility functions
│ └── pages/ # Route pages
├── supabase/
│ └── functions/ # AI edge functions
└── public/ # Static assets


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/swasthyasaathi.git

# Navigate to project directory
cd swasthyasaathi

# Install dependencies
npm install

# Start development server
npm run dev

🔐 Environment Variables

Create a .env file in the root directory:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
🔧 Development Scripts
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run linting
npm run test      # Run tests

🤝 Contributing

Fork the repository

Create your feature branch

git checkout -b feature/YourFeature


Commit your changes

git commit -m "Add your feature"


Push to the branch

Open a Pull Request

📄 License

This project is licensed under the MIT License.

👨‍💻 Author

Aditya Jha
Built with ❤️ for mental wellness and mindful living.

🙏 Acknowledgments

Pixabay — Ambient meditation audio

Unsplash — Yoga & wellness imagery

shadcn/ui — UI components

Lucide — Icon set

<p align="center"> <i>स्वस्थ रहें, खुश रहें</i> 🌿<br> <i>(Stay Healthy, Stay Happy)</i> </p> ```




