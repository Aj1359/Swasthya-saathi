CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  gender VARCHAR(50),
  age INTEGER,
  occupation VARCHAR(100),
  country VARCHAR(100),
  college_stressors VARCHAR(100) ARRAY,
  happiness_index INTEGER DEFAULT 70,
  health_index INTEGER DEFAULT 70,
  chat_memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voice_analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_stressors (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stressor VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS face_scans (
  id UUID PRIMARY KEY,
  user_id UUID,
  mood VARCHAR(50) NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  wellness_tip TEXT,
  health_flags VARCHAR(100) ARRAY,
  posture_score INTEGER,
  posture_flags VARCHAR(100) ARRAY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voice_mood_scans (
  id UUID PRIMARY KEY,
  user_id UUID,
  mood VARCHAR(50) NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 0,
  transcript TEXT,
  audio_features CLOB,
  mental_state_indicators VARCHAR(100) ARRAY,
  suggested_action TEXT,
  urgency VARCHAR(50) NOT NULL DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY,
  source VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  category VARCHAR(255),
  content TEXT NOT NULL,
  embedding OTHER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
