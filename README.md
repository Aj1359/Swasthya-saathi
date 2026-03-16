# 🧘 SwasthyaSaathi 2.0

> Your AI-Powered Mental Wellness Companion

[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)

SwasthyaSaathi (स्वास्थ्यसाथी — "Health Companion" in Hindi) is a holistic mental wellness application designed to help users manage stress, anxiety, and depression through guided meditation, yoga, breathing exercises, crisis awareness, and an empathetic AI companion named **Ruhi**.

![SwasthyaSaathi Dashboard](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop)

## ✨ Features

### 🎯 Core Features

- **🧘 Guided Meditation** — Curated ambient music (Ocean Waves, Forest Rain, Tibetan Bowls) with duration tracking
- **🧎 Yoga Poses** — Category-based yoga with in-app video tutorials (popup player)
- **🌬️ Breathing Exercises** — Anulom Vilom, 4-7-8, Box Breathing with visual guides
- **📚 Books & Articles** — Curated wellness resources with valid external links
- **💬 Ruhi AI Companion** — Empathetic AI chatbot with streaming responses, voice I/O, and chat history continuation
- **🛡️ Crisis Support** — Location-aware crisis resources covering 15+ countries with live global crisis news feed

### 📊 Tracking & Analytics

- **Daily Wellness Tracker** — Log water intake, sleep hours, mood, and exercise
- **Happiness & Health Index** — Dynamic indices updated by activities
- **Weekly/Monthly Charts** — Visualize wellness trends with Recharts
- **Personalized Suggestions** — AI-powered recommendations based on activity data
- **Mood Journal** — Reflective journaling with mood tracking
- **Face Mood Reader** — AI-powered facial expression analysis

### 🌍 Crisis & Global Awareness

- **15+ Countries** — India, USA, UK, Ukraine, Palestine, Sudan, Myanmar, Germany, Brazil, Nigeria, China, Japan, Australia, Canada, South Korea, Afghanistan, Syria, Turkey
- **Live Crisis News Feed** — Real-time updates on wars, economic crises, climate disasters, and political instability
- **Local Helplines** — Country-specific emergency and mental health support numbers
- **Coping Strategies** — Expert-backed tips for each crisis type
- **Global Issues** — Climate anxiety, post-pandemic mental health, AI job displacement

### 🎨 User Experience

- **Calming UI** — Sage green palette with gentle animations
- **Dark/Light Mode** — Full theme support
- **Responsive Design** — Optimized for mobile and desktop
- **Personalized Onboarding** — Customized experience based on profile
- **Chat History** — Click any past chat session to continue the conversation
- **Community Support** — Anonymous peer support with sensitive topic categories

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
git clone https://github.com/Aj1359/Swasthya-saathi.git
cd Swasthya-saathi
npm install
npm run dev
```

The app will be available at `http://localhost:8080`

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State** | React Context, TanStack Query |
| **Charts** | Recharts |
| **Backend** | Edge Functions (Lovable Cloud) |
| **AI** | Google Gemini via AI Gateway |
| **Auth** | Email/password authentication |
| **Database** | PostgreSQL with RLS policies |
| **Routing** | React Router v6 |

## 🎯 App Flow

```
Landing → Sign Up → Onboarding → Dashboard
Landing → Log In → Dashboard (directly)
                      ├── Daily Tracker
                      ├── Wellness Charts
                      ├── Crisis Support (location-aware)
                      ├── Meditation Tab (audio player)
                      ├── Yoga Tab (in-app video popup)
                      ├── Breathing Tab
                      ├── Books Tab
                      ├── Mood Journal
                      ├── Face Mood Scanner
                      ├── Community (Peer Support)
                      ├── History (clickable chat sessions)
                      └── Ruhi Chat (Floating, continuable)
```

## 🤖 Ruhi AI Companion

- Uses warm, caring tone with occasional Hindi phrases
- Provides personalized recommendations based on activity data
- Streams responses in real-time via SSE
- Supports voice input (Speech Recognition) and voice output (TTS)
- Chat sessions persist and can be continued from History

## 🏥 Health Categories (Yoga)

| Category | Target | Key Poses |
|----------|--------|-----------|
| **Diabetes** | Blood sugar control | Surya Namaskar, Dhanurasana |
| **Hypertension** | Blood pressure | Shavasana, Viparita Karani |
| **Stress & Anxiety** | Mental wellness | Balasana, Cat-Cow Stretch |
| **Back Pain** | Spinal health | Bhujangasana, Setu Bandhasana |

## 🔧 Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run linting
npm run test     # Run tests
```

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Aditya Jha**

## 🙏 Acknowledgments

- [Pixabay](https://pixabay.com) for ambient audio tracks
- [Unsplash](https://unsplash.com) for images
- [shadcn/ui](https://ui.shadcn.com) for UI components
- [Lucide](https://lucide.dev) for icons

---

<p align="center">
  <i>स्वस्थ रहें, खुश रहें</i> 🌿<br>
  <i>(Stay Healthy, Stay Happy)</i>
</p>
