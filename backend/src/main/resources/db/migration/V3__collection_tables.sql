-- ============ COLLECTION TABLES FOR ELEMENTCOLLECTIONS ============

CREATE TABLE IF NOT EXISTS public.profile_stressors (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stressor   VARCHAR(255) NOT NULL,
  PRIMARY KEY (profile_id, stressor)
);

CREATE TABLE IF NOT EXISTS public.face_scan_health_flags (
  face_scan_id UUID REFERENCES public.face_scans(id) ON DELETE CASCADE,
  health_flag  VARCHAR(255) NOT NULL,
  PRIMARY KEY (face_scan_id, health_flag)
);

CREATE TABLE IF NOT EXISTS public.face_scan_posture_flags (
  face_scan_id UUID REFERENCES public.face_scans(id) ON DELETE CASCADE,
  posture_flag VARCHAR(255) NOT NULL,
  PRIMARY KEY (face_scan_id, posture_flag)
);

CREATE TABLE IF NOT EXISTS public.voice_scan_indicators (
  voice_scan_id UUID REFERENCES public.voice_mood_scans(id) ON DELETE CASCADE,
  indicator     VARCHAR(255) NOT NULL,
  PRIMARY KEY (voice_scan_id, indicator)
);
