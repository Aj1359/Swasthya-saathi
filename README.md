# 🧘 SwasthyaSaathi 2.0 (स्वास्थ्यसाथी)

> **Your Comprehensive AI-Powered Mental Wellness & Health Companion**

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

SwasthyaSaathi (*"Health Companion"* in Hindi) is a next-generation, holistic health and mental wellness platform. Combining multi-modal AI capabilities—including face emotion detection, voice mood analysis, real-time posture tracking, and vector RAG (Retrieval-Augmented Generation)—SwasthyaSaathi empowers users to manage stress, anxiety, posture health, and daily wellness through intelligent companion support, guided yoga/meditation, and location-aware crisis intervention.

![SwasthyaSaathi Banner](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop)

---

## ✨ What's New in SwasthyaSaathi 2.0

- 🎙️ **Voice Mood Analysis**: Real-time voice spectrum and speech emotion analysis to detect mood, stress levels, and vocal cadence.
- 📐 **Posture & Ergonomics Scanner**: AI-driven webcam analysis detecting posture alignment, spine strain, and neck positioning.
- 🧠 **Vector RAG & Long-Term Memory**: AI companion **Ruhi** remembers past conversations and utilizes vector database searches for contextually aware mental health recommendations.
- ☕ **Spring Boot Java Backend Integration**: Production-ready microservices architecture backing crisis routing, user chat state, database migrations (Flyway SQL), and audio processing APIs.
- 🩺 **Preventative Health & Disease Tab**: Interactive self-assessment tools, early warning signals, and wellness advice tailored to daily lifestyle habits.

---

## 🎯 Key Features & Modules

### 🤖 Multi-Modal AI Companion (Ruhi)
- **Empathetic Conversational AI**: Empathetic, supportive AI assistant powered by Gemini & RAG memory.
- **Voice & Speech Integration**: Full Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities.
- **Continuable History**: Session history persisted for continuous conversation threads.

### 🎭 Mood & Body Sensing Suite
- **Face Mood Reader**: Real-time facial emotion recognition with instant emotional wellness logging.
- **Voice Mood Reader**: Audio feature extraction capturing pitch, intensity, and voice warmth.
- **Posture & Ergonomics Tracker**: Camera-assisted posture monitoring providing instant posture correction alerts.

### 🧘 Holistic Wellness Tools
- **Guided Meditation**: Ambient sounds (Ocean Waves, Forest Rain, Tibetan Bowls) with audio duration timers.
- **Interactive Yoga**: Category-driven yoga library with embedded video demonstrations (Diabetes, Hypertension, Back Pain, Anxiety).
- **Breathing Workouts**: Visual breath guides for Anulom Vilom, 4-7-8 technique, and Box Breathing.
- **Mood Journal**: Secure daily journal for emotional expression and stress tracking.
- **Curated Reading**: Verified health books, mental health articles, and self-care resources.

### 🛡️ Crisis Response & Global Awareness
- **Location-Aware Helplines**: Country-specific emergency lines covering 15+ countries (India, USA, UK, Germany, Japan, Australia, Canada, etc.).
- **Live Crisis Feed**: Real-time news aggregation covering global issues, climate anxiety, economic stress, and crisis management.

---

## 🛠️ Architecture & Tech Stack

```
                               ┌────────────────────────────────┐
                               │     React 18 + Vite Frontend   │
                               │  (TypeScript, Tailwind, UI)   │
                               └──────────────┬─────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
┌──────────────────────────────────────┐             ┌──────────────────────────────────┐
│        Supabase Cloud & Edge         │             │    Java Spring Boot REST API      │
│  (Auth, Edge Functions, pgvector)    │             │  (Crisis, Chat, Audio Backend)    │
└──────────────────┬───────────────────┘             └──────────────────┬───────────────┘
                   │                                                    │
                   └──────────────────────────┬─────────────────────────┘
                                              ▼
                               ┌────────────────────────────────┐
                               │   PostgreSQL Database (RLS)    │
                               │   + Flyway Schema Migrations   │
                               └────────────────────────────────┘
```

| Domain | Technology |
|---|---|
| **Frontend Platform** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend Services** | Java 17+, Spring Boot 3.x, Flyway DB Migrations |
| **Database & Cloud** | PostgreSQL, pgvector (RAG storage), Supabase Edge Functions |
| **AI / Machine Learning** | Google Gemini AI Gateway, Web Audio API, MediaPipe / Vision AI |
| **Data & RAG Scripts** | Python 3, Sentence Transformers / Vector Seeding (`seed_knowledge.py`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **Java**: `JDK 17` or higher (for backend)
- **Maven**: `v3.8+` (or use `./mvnw`)
- **Python**: `v3.9+` (for RAG knowledge seeding)

### 1. Frontend Setup
```bash
# Clone repository
git clone https://github.com/Aj1359/Swasthya-saathi.git
cd Swasthya-saathi

# Install dependencies
npm install

# Run Vite dev server
npm run dev
```
The frontend application will launch at `http://localhost:8080`.

### 2. Backend Setup (Java Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
The backend server runs at `http://localhost:8080`.

### 3. Knowledge Vector Seeding (Optional)
```bash
python seed_knowledge.py
```

---

## 📁 Repository Structure

```
Swasthya-saathi/
├── backend/                  # Java Spring Boot backend (REST APIs, DB Migrations)
│   ├── src/main/java/        # Controllers, Services, Models
│   └── src/main/resources/   # Application config & Flyway SQL scripts (V1..V4)
├── src/                      # React Frontend application
│   ├── components/           # UI components (Chat, Mood, Dashboard, Tabs, Yoga)
│   │   ├── mood/             # FaceMoodReader, VoiceMoodReader, PostureDetector
│   │   ├── tabs/             # PreventionTab, BooksTab, MeditationTab, YogaTab
│   │   └── ...
│   ├── contexts/             # Global Auth & State Contexts
│   ├── pages/                # Landing, Dashboard, History, etc.
│   └── integrations/         # Supabase client & auto-generated types
├── supabase/                 # Supabase configuration, Edge Functions, SQL Migrations
│   ├── functions/            # ruhi-chat, face-mood, voice-mood
│   └── migrations/           # PostgreSQL migrations & RAG vector schemas
├── seed_knowledge.py         # RAG knowledge base seeding script
├── README.md                 # Project documentation
└── package.json              # Frontend scripts & dependencies
```

---

## 🔒 Privacy & Security

- **Sensitive Data Isolation**: `.env` configurations, private keys, API secrets, and temporary runtime files are excluded from version control.
- **Row Level Security (RLS)**: PostgreSQL database tables use strict Supabase RLS policies to safeguard personal journal entries and mood logs.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

## 👨‍💻 Author & Maintainer

**Aditya Jha** ([@Aj1359](https://github.com/Aj1359))

---

<p align="center">
  <i>स्वास्थ्यम् परं भाग्यम् | स्वस्थ रहें, खुश रहें 🌿</i><br>
  <i>(Health is the supreme wealth — Stay Healthy, Stay Happy)</i>
</p>
