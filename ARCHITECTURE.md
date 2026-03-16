# 🏗️ SwasthyaSaathi Architecture

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
├─────────────────────────────────────────────────────────────────────┤
│  Pages:                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Landing  │ │   Auth   │ │Onboarding│ │Dashboard │ │ History  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────┬─────┘ └──────────┘ │
│                                               │                      │
│  Dashboard Components:                        │                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────┴─────┐              │
│  │Happiness │ │ Health   │ │ Wellness │ │ Crisis   │              │
│  │  Card    │ │  Card    │ │  Chart   │ │ Support  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                      │
│  Feature Tabs:                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │Meditation│ │Yoga+Video│ │Breathing │ │Books/PDF │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                      │
│  Floating: Daily Tracker | Ruhi Chat | Profile Menu                  │
│  Special: Face Mood Reader | Mood Journal | Peer Support | Student   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Lovable Cloud)                        │
├─────────────────────────────────────────────────────────────────────┤
│  Edge Functions:                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │  ruhi-chat        │  │  face-mood        │                        │
│  │  AI conversation  │  │  Facial analysis  │                        │
│  │  SSE streaming    │  │  Mood detection   │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                      │
│  Database (PostgreSQL + RLS):                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │  profiles   │ │chat_messages│ │face_scans  │ │activity_logs│      │
│  │  journal_   │ │peer_posts  │ │peer_replies│ │knowledge_  │      │
│  │  entries    │ │            │ │            │ │documents   │      │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
│                                                                      │
│  Auth: Email/password with session management                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  AI Gateway     │  │    Pixabay      │  │   YouTube       │     │
│  │  (Gemini API)   │  │  (Audio CDN)    │  │ (Yoga Videos)   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🧩 Component Tree

```
src/
├── components/
│   ├── chat/FloatingChat.tsx          # AI chatbot, streaming, voice, history continuation
│   ├── community/PeerSupport.tsx      # Anonymous peer support + taboo topics
│   ├── crisis/CrisisSupport.tsx       # Location-aware crisis resources + live news feed
│   ├── dashboard/
│   │   ├── HappinessCard.tsx          # Happiness index display
│   │   ├── HealthCard.tsx             # Health index display
│   │   ├── WellnessChart.tsx          # Weekly/monthly trends
│   │   ├── DashboardSuggestions.tsx   # Personalized tips
│   │   ├── MotivationQuote.tsx        # Daily motivation
│   │   └── WeeklyReport.tsx           # Weekly summary
│   ├── journal/MoodJournal.tsx        # Reflective journaling
│   ├── mood/FaceMoodReader.tsx        # AI facial analysis
│   ├── profile/ProfileMenu.tsx        # User menu + history link
│   ├── student/StudentMode.tsx        # Student-specific features
│   ├── tabs/
│   │   ├── MeditationTab.tsx          # Audio player (CDN tracks)
│   │   ├── YogaTab.tsx                # Poses + in-app video popup
│   │   ├── BreathingTab.tsx           # Visual breathing guides
│   │   └── BooksTab.tsx               # PDFs & articles
│   ├── tracking/DailyTracker.tsx      # Water, sleep, mood logging
│   └── ui/                            # shadcn/ui components
├── contexts/
│   ├── AuthContext.tsx                 # Auth state + sign in/up/out
│   └── UserContext.tsx                 # User profile + indices
├── pages/
│   ├── Landing.tsx                     # Public landing page
│   ├── Auth.tsx                        # Login → dashboard, Signup → onboarding
│   ├── Onboarding.tsx                  # Profile setup flow
│   ├── Dashboard.tsx                   # Main app (protected)
│   └── History.tsx                     # Clickable chat/scan/activity history
└── integrations/supabase/             # Auto-generated client + types
```

## 🔄 Key Data Flows

### Authentication Flow
```
Sign Up → Onboarding → Dashboard
Log In  → Dashboard (directly)
```

### Chat History Continuation
```
History Page → Click chat session → navigate('/dashboard?chat=SESSION_ID')
  → FloatingChat reads ?chat param → loads session → opens chat → user continues
```

### Crisis Support Flow
```
User profile.country → Match GLOBAL_CRISES[country]
  → Display local crises + global issues
  → Live news feed with 10+ current global events
  → Helplines, coping tips, articles
```

### Activity → Index Updates
```
User activity (meditation, yoga, etc.)
  → Log to activity_logs table
  → Recalculate happiness/health indices
  → Update profiles table
  → UI reflects new indices
```

## 🔐 Security

- Row-Level Security (RLS) on all user tables
- Email/password auth with session persistence
- JWT validation on edge functions
- No sensitive data in client-side storage
- CORS configured on all edge functions

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| react 18 | UI framework |
| react-router-dom 6 | Routing + search params |
| @tanstack/react-query | Data fetching |
| recharts | Charts & visualization |
| react-markdown | Markdown rendering |
| lucide-react | Icons |
| @supabase/supabase-js | Backend client |

## 👨‍💻 Author

**Aditya Jha**

---

*Architecture Document v2.0 — SwasthyaSaathi*
