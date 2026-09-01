import urllib.request
import json
import psycopg2
import os
import time

# Google Gemini API Settings
api_key = os.getenv("GEMINI_API_KEY", "")
embed_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"

# Database credentials
db_host = os.getenv("DB_HOST", "aws-1-ap-southeast-2.pooler.supabase.com")
db_port = int(os.getenv("DB_PORT", "5432"))
db_name = os.getenv("DB_NAME", "postgres")
db_user = os.getenv("DB_USER", "postgres.lgcojtbcokecqmtyvsey")
db_password = os.getenv("DB_PASSWORD", "")

# Seed documents
# Seed documents from Developer Sourcing & Ingestion Guide
documents = [
    {
        "category": "crisis",
        "title": "Tele-MANAS National Mental Health Helpline",
        "content": "Tele-MANAS is India's free, 24/7 national mental health helpline, reachable at 14416 or 1-800-891-4416, available in 20 languages, run by the Ministry of Health & Family Welfare with NIMHANS as the nodal body. It provides first-level counselling and can refer callers to further psychiatric or psychological care, including video consultation where needed.",
        "tags": ["crisis", "helpline", "telemanas", "emergency"],
        "source": "crisis_directory_national"
    },
    {
        "category": "psychoeducation",
        "title": "Stress vs Anxiety: Understanding the Difference",
        "content": "Stress is usually tied to a specific situation — an exam, a deadline, a conflict — and tends to ease once that situation passes. Anxiety can persist even without a clear trigger, and often comes with physical signs like a racing heart, tight chest, or restless energy. Both are normal human responses, but when they interfere with daily functioning for more than two weeks, it's worth talking to someone.",
        "tags": ["stress", "anxiety", "psychoeducation"],
        "source": "psychoed_stress_vs_anxiety"
    },
    {
        "category": "psychoeducation",
        "title": "Understanding Burnout and Its Signs",
        "content": "Burnout typically shows up as three things together: feeling emotionally drained, becoming cynical or detached from things you used to care about, and a drop in your sense of effectiveness or accomplishment. It's common among students during exam periods and among people in demanding jobs, and it usually needs rest and boundary-setting to recover, not just willpower.",
        "tags": ["burnout", "stress", "exhaustion"],
        "source": "psychoed_burnout"
    },
    {
        "category": "psychoeducation",
        "title": "Masked Distress and Somatic Symptoms",
        "content": "Some people express distress through their body or behavior rather than words — a flat or monotone voice, social withdrawal, or physical complaints like headaches and fatigue can sometimes be signs of emotional strain, especially in people who've grown up in environments where naming feelings directly wasn't encouraged.",
        "tags": ["distress", "voice", "somatic", "symptoms"],
        "source": "psychoed_masked_distress"
    },
    {
        "category": "intervention",
        "title": "The 5-4-3-2-1 Grounding Technique",
        "content": "The 5-4-3-2-1 grounding technique for anxiety spikes: Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This shifts attention from racing thoughts to the present moment and typically takes 2-3 minutes.",
        "tags": ["grounding", "anxiety", "panic", "cbt"],
        "source": "intervention_grounding_54321"
    },
    {
        "category": "intervention",
        "title": "Behavioral Activation: Action Before Motivation",
        "content": "When motivation is very low, start with one small, concrete action rather than a big goal — making your bed, stepping outside for two minutes, or drinking a glass of water. Behavioral activation works on the principle that action can come before motivation, not just after it.",
        "tags": ["depression", "activation", "motivation", "cbt"],
        "source": "intervention_behavioral_activation"
    },
    {
        "category": "intervention",
        "title": "Box Breathing for Stress Reduction",
        "content": "Box breathing: inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds. Repeat for 4-5 cycles. This is commonly used to reduce acute physiological stress response and can be done discreetly anywhere, including during a stressful class or meeting.",
        "tags": ["breathing", "stress", "calm", "box_breathing"],
        "source": "intervention_box_breathing"
    },
    {
        "category": "intervention",
        "title": "Active Posture Reset for Screen Time",
        "content": "For forward-head posture and rounded shoulders from long study or screen sessions: sit tall, roll shoulders back and down, perform 3 slow chin tucks (drawing the chin straight back, not down), and take 3 deep breaths expanding the ribcage. Repeat every 45-60 minutes of screen time.",
        "tags": ["posture", "ergonomics", "reset", "neck_pain"],
        "source": "intervention_posture_reset"
    },
    {
        "category": "intervention",
        "title": "Cognitive Reframing for Catastrophizing",
        "content": "Catastrophizing is when a single setback (a bad exam, a rejection) feels like proof that everything will go wrong. A simple reframe: ask 'what would I tell a friend in this exact situation?' — people are often far more compassionate and realistic when advising someone else than when judging themselves.",
        "tags": ["catastrophizing", "cbt", "reframing", "thought_patterns"],
        "source": "intervention_cognitive_reframe_catastrophizing"
    },
    {
        "category": "persona",
        "title": "Ruhi Persona and Tone Guide",
        "content": "Ruhi speaks warmly and simply, like a caring older friend, not a clinician. Ruhi avoids diagnostic language ('you have anxiety') and instead reflects what it's noticing ('you seem a bit more tense than usual today'). Ruhi never claims certainty about someone's internal state — it offers observations and invitations, not conclusions.",
        "tags": ["persona", "tone", "guide"],
        "source": "ruhi_persona_tone_guide"
    },
    {
        "category": "persona",
        "title": "Ruhi Opening Template for Low Mood",
        "content": "When a scan indicates low mood or fatigue, Ruhi can open with something like: 'Hey, I noticed things seem a little heavier for you today. No pressure to talk about it — but I'm here if you want to, or we could just do a quick two-minute reset together.'",
        "tags": ["opening", "low_mood", "response"],
        "source": "ruhi_opening_low_mood"
    },
    {
        "category": "persona",
        "title": "Ruhi Crisis Response Template",
        "content": "When a crisis signal is detected, Ruhi's first response must include the Tele-MANAS number (14416) clearly and calmly, without alarming language, followed by a grounding offer: 'I want to make sure you have real support right now — Tele-MANAS (14416) is free and available right now, 24/7, in your language. Would it help if I stayed here with you while you decide what to do next?'",
        "tags": ["crisis", "response", "protocol"],
        "source": "ruhi_crisis_response_template"
    },
    {
        "category": "research",
        "title": "Research Context: Student Stress in India",
        "content": "National surveys have documented elevated rates of psychological distress among Indian college students, particularly around examination periods, with under-utilization of formal counseling services often linked to stigma and limited availability in smaller cities. (Reference: National Mental Health Survey of India, NIMHANS)",
        "tags": ["research", "student_stress", "india"],
        "source": "research_context_student_stress_india"
    }
]

def get_embedding(text, retries=3, delay=1):
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{"text": text}]
        }
    }
    req = urllib.request.Request(
        embed_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                return res_data["embedding"]["values"]
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {e}")
            if attempt < retries - 1:
                sleep_time = delay * (2 ** attempt)
                print(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                if hasattr(e, 'read'):
                    try:
                        print(e.read().decode('utf-8'))
                    except Exception:
                        pass
                return None

def main():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        cur = conn.cursor()
        
        # Clear existing knowledge documents to prevent duplicates
        print("Clearing existing records...")
        cur.execute("DELETE FROM public.knowledge_documents;")
        
        print(f"Starting seeding of {len(documents)} documents...")
        for i, doc in enumerate(documents):
            print(f"Embedding document {i+1}/{len(documents)}: {doc['title']}...")
            # Embed both title and content combined for better retrieval relevance
            text_to_embed = f"{doc['title']}\n{doc['content']}"
            embedding = get_embedding(text_to_embed)
            if not embedding:
                print(f"Skipping document '{doc['title']}' due to embedding failure.")
                continue
            
            time.sleep(1) # Rate limit delay
            
            print(f"Inserting into database...")
            cur.execute(
                """
                INSERT INTO public.knowledge_documents (category, title, content, tags, source, embedding)
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (doc["category"], doc["title"], doc["content"], doc["tags"], doc["source"], embedding)
            )
        
        conn.commit()
        print("Seeding complete! Verifying database records...")
        cur.execute("SELECT count(*) FROM public.knowledge_documents;")
        count = cur.fetchone()[0]
        print(f"Total documents successfully seeded: {count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print("Database error:", e)

if __name__ == "__main__":
    main()
