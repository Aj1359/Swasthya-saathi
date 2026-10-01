import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, X, MessageCircle, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import logo from '@/assets/swasthya-saathi-logo.jpeg';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// We use supabase.functions.invoke instead of raw fetch — it attaches the user's JWT automatically.
// CHAT_URL kept as fallback for streaming (supabase SDK doesn't yet stream).
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ruhi-chat`;

const getSessionId = () => {
  let id = localStorage.getItem('swasthyasaathi_session_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('swasthyasaathi_session_id', id); }
  return id;
};

function generateRuhiLocalResponse(messages: Message[]): string {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const historyText = messages.map(m => m.content.toLowerCase()).join(' ');

  // 1. Normalize typos and common slang
  const normalized = lastMsg.toLowerCase()
    .replace(/streesed|stresed|stresd|strssed|stres/g, 'stressed')
    .replace(/timorrow|tomorow|tmrw|tomorrw/g, 'tomorrow')
    .replace(/wjat|wat|wht|wats/g, 'what')
    .replace(/intervew|intervow|intrview|intrvw/g, 'interview')
    .replace(/homesik|homesk/g, 'homesick')
    .replace(/lonley|lonly/g, 'lonely');

  // Detect conversation topics from last message OR history
  const isInterview = normalized.includes('interview') || historyText.includes('interview');
  const isPlacement = normalized.includes('placement') || historyText.includes('placement');
  const isExam = normalized.includes('exam') || historyText.includes('exam');
  const isStress = normalized.includes('stressed') || normalized.includes('anxious') || normalized.includes('worried') || historyText.includes('stress');
  const isHomesick = normalized.includes('homesick') || historyText.includes('homesick');
  const isUncertain = normalized.includes('dont know') || normalized.includes("don't know") || normalized.includes('confused') || normalized.includes('lost') || normalized.includes('help');
  const isSad = normalized.includes('sad') || normalized.includes('down') || normalized.includes('depressed') || normalized.includes('lonely');
  const isPain = normalized.includes('pain') || normalized.includes('headache') || normalized.includes('back');

  const assistantTurnCount = messages.filter(m => m.role === 'assistant').length;

  if (isInterview || (isPlacement && isUncertain)) {
    if (assistantTurnCount <= 1) {
      return "Interviews can feel super intimidating, especially when it's tomorrow! 😟 Deep breath. What's bothering you most — technical prep, HR questions, or just the nerves?";
    } else if (assistantTurnCount === 2 || isUncertain) {
      return "When you don't know where to start, focus on just 3 things tonight:\n\n1️⃣ Re-read your resume bullet points\n2️⃣ Practice a 1-minute intro ('tell me about yourself')\n3️⃣ Get 7 hours of sleep. You got this! 💪\n\nWant to do a quick 2-minute calm breath with me?";
    } else {
      return "Remember, an interview is just a conversation, not an interrogation. They already liked your resume! Sleep well tonight, wear comfortable clothes, and sip water before entering. How are you feeling now? 🌿";
    }
  }

  if (isPlacement || isExam || isStress) {
    if (assistantTurnCount <= 1) {
      return "Placement & exam stress is so real right now 🎢 It's totally valid to feel overwhelmed. Is it a specific company/subject, or just the uncertainty of it all?";
    } else if (isUncertain || assistantTurnCount === 2) {
      return "Break your prep into tiny 15-minute chunks instead of looking at the whole mountain. After each chunk, step away for 3 minutes. Have you tried the Box Breathing tool in our app yet? 🧘‍♂️";
    } else {
      return "One day at a time, yaar. You've prepared more than you realize. I'm right here with you whenever you need a quick reset 💚";
    }
  }

  if (isHomesick) {
    return "Homesickness hits so hard, especially during busy college weeks 🏠 Have you had a chance to call home or talk to someone close today?";
  }

  if (isSad) {
    return "I'm really sorry things feel heavy right now 💚 You don't have to carry it all by yourself. Do you want to vent about it, or would you prefer a quick distraction?";
  }

  if (isPain) {
    return "Physical pain from long study hours is so draining 💆‍♂️ Try doing a quick shoulder roll and check out the Yoga tab in the app for posture stretches!";
  }

  const generalResponses = [
    "I hear you 💚 It's totally okay to feel uncertain sometimes. Tell me a bit more about what's on your mind.",
    "Take a slow breath with me 🌿 When everything feels messy, picking just ONE small thing to do right now can help. What's one tiny step you can take today?",
    "I'm here with you all the way! Remember to be kind to yourself — you're doing the best you can 💪"
  ];

  return generalResponses[(assistantTurnCount - 1) % generalResponses.length];
}

interface FloatingChatProps {
  initialMessage?: string;
  onMessageSent?: () => void;
}

const FloatingChat = ({ initialMessage, onMessageSent }: FloatingChatProps) => {
  const { userData, updateIndices } = useUser();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasMemory, setHasMemory] = useState(false); // true when prior session messages were found
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const sessionId = useRef(getSessionId());

  // Preload speech synthesis voices for sweet female voice selection
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Open and pre-fill if 'Send to Ruhi' was triggered from a scan result
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setInput(initialMessage);
      setIsOpen(true);
    }
  }, [initialMessage]);

  // Open chat if navigated with ?chat=SESSION_ID
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam) {
      sessionId.current = chatParam;
      localStorage.setItem('swasthyasaathi_session_id', chatParam);
      setHistoryLoaded(false);
      setIsOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);


  const getGreeting = useCallback(() => {
    if (!userData) return "Hey! I'm Ruhi 💚";
    const name = userData.name;
    if (userData.occupation === 'college_student') return `Hey ${name}! 💚 I'm Ruhi — your buddy here. College life can be wild, right? 🎢\n\nJust tell me what's up. How are you doing today? Like, *really* doing? 🌿`;
    if (userData.occupation === 'school_student') return `Hey ${name}! 💚 I'm Ruhi — think of me as your cool older sister who gets it.\n\nSchool can be a lot sometimes. What's on your mind? 🌿`;
    if (userData.occupation === 'working_professional') return `Hey ${name}! 💚 I'm Ruhi — your wellness companion.\n\nWork-life balance is real struggle, isn't it? How are you feeling today? 🌿`;
    return `Hey ${name}! 💚 I'm Ruhi — think of me as a friend who actually listens.\n\nWhat's going on with you today? I'm all ears 🌿`;
  }, [userData]);

  const saveMessage = useCallback(async (role: string, content: string) => {
    try {
      await supabase.from('chat_messages').insert({ session_id: sessionId.current, role, content, user_id: user?.id || null });
    } catch (err) {
      console.warn('Could not persist chat message:', err);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      const loadHistory = async () => {
        try {
          const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId.current).order('created_at', { ascending: true }).limit(50);
          if (!error && data && data.length > 0) {
            setMessages(data.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
            setHasMemory(false);
          } else {
            const greeting = getGreeting();
            setMessages([{ role: 'assistant', content: greeting }]);
          }
        } catch {
          const greeting = getGreeting();
          setMessages([{ role: 'assistant', content: greeting }]);
        }
        setHistoryLoaded(true);
      };
      loadHistory();
    }
  }, [isOpen, historyLoaded, user, userData, getGreeting, saveMessage]);

  const getActivityContext = () => { const d = localStorage.getItem('swasthyasaathi_daily'); return d ? JSON.parse(d) : null; };
  const getJournalContext = () => { const s = localStorage.getItem('swasthyasaathi_journal'); if (!s) return []; return Object.values(JSON.parse(s)).sort((a: unknown, b: unknown) => (b as { timestamp: number }).timestamp - (a as { timestamp: number }).timestamp).slice(0, 5); };
  const getFaceScanData = () => { const s = localStorage.getItem('swasthyasaathi_face_scan'); return s ? JSON.parse(s) : null; };
  const getFaceScanHistory = () => { const s = localStorage.getItem('swasthyasaathi_face_history'); return s ? JSON.parse(s).slice(-7) : []; };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const startListening = useCallback(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: (e: { results: Iterable<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: (e: { results: Iterable<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => { setInput(Array.from(e.results).map((item) => item[0].transcript).join('')); };
    r.onend = () => setIsListening(false); r.onerror = () => setIsListening(false);
    r.start(); recognitionRef.current = r; setIsListening(true);
  }, []);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = text.replace(/[#*_~`>|]/g, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/\p{Extended_Pictographic}/gu, '');
    const u = new SpeechSynthesisUtterance(cleaned);
    u.lang = 'en-IN';
    u.rate = 0.93; // Soft, warm speech tempo
    u.pitch = 1.25; // Sweet, friendly female pitch

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const indianFemale = voices.find(v => 
        (v.lang.toLowerCase().includes('in')) && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('veena') || v.name.toLowerCase().includes('geeta'))
      ) || voices.find(v => v.lang.toLowerCase().includes('in'))
        || voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'));
      
      if (indianFemale) u.voice = indianFemale;
    }

    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }, []);

  const updateDashboardFromChat = (content: string) => {
    if (!userData) return;
    const l = content.toLowerCase();
    let hd = 0, hed = 0;
    // Positive signals (Ruhi affirming)
    if (/\b(great job|proud of you|awesome|well done|that's wonderful)\b/.test(l)) hd += 2;
    // Only deduct if not in a negation context
    if (/\b(stressed|overwhelmed|anxious|hopeless)\b/.test(l) && !/\b(not|no longer|less|better|feeling good)\b/.test(l)) hd -= 1;
    if (/\b(meditation|yoga|breathing exercise|pranayama)\b/.test(l)) hed += 1;
    if (hd !== 0 || hed !== 0) {
      const nH = Math.min(100, Math.max(5, userData.happinessIndex + hd));
      const nHe = Math.min(100, Math.max(5, userData.healthIndex + hed));
      updateIndices(nH, nHe);
      if (user) supabase.from('profiles').update({ happiness_index: nH, health_index: nHe }).eq('user_id', user.id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    saveMessage('user', userMessage.content);
    setInput(''); setIsLoading(true);
    let assistantContent = '';

    try {
      // Single Canonical Chat Architecture: Primary dispatch to Spring Boot Chat API orchestrator
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api/chat` : 'http://localhost:8081/api/chat';
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: userMessage.content, sessionId: sessionId.current }),
        });

        if (response.ok) {
          const data = await response.json();
          assistantContent = data.reply || data.content || '';
        }
      } catch (backendErr) {
        console.warn('Spring Boot Chat API unreachable, activating local safety engine fallback:', backendErr);
      }

      // If backend is offline or unreachable, use intelligent Ruhi client safety response engine
      if (!assistantContent) {
        const allMsgs = [...messages, userMessage];
        assistantContent = generateRuhiLocalResponse(allMsgs);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (err) {
      console.error('Error in sendMessage:', err);
    }


      if (assistantContent) { saveMessage('assistant', assistantContent); speak(assistantContent); updateDashboardFromChat(assistantContent); }
    } catch (error) {
      console.error('Chat error:', error);
      const errMsg = "I'm sorry, I couldn't respond right now. Please try again 💚";
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      saveMessage('assistant', errMsg);
    } finally { setIsLoading(false); }
  };

  const clearChat = async () => {
    const newId = crypto.randomUUID();
    localStorage.setItem('swasthyasaathi_session_id', newId);
    sessionId.current = newId;
    const greeting = getGreeting();
    setMessages([{ role: 'assistant', content: greeting }]);
    saveMessage('assistant', greeting);
  };

  const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);

  return (
    <>
      {/* Floating button - positioned above bottom nav on mobile */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed z-50 group" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)', right: '1rem', width: 52, height: 52 }}>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl flex items-center justify-center hover:scale-110 transition-all overflow-hidden border-2 border-primary-foreground/20">
            <img src={logo} alt="Talk to Ruhi" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center shadow-lg border-2 border-card">
            <Sparkles className="w-2.5 h-2.5 text-secondary-foreground" />
          </div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            Talk to Ruhi 💚
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 md:inset-auto md:right-6 md:bottom-6 md:w-[420px] md:h-[620px] flex flex-col bg-card md:rounded-3xl shadow-2xl border border-border overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-sage text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-foreground/30 shadow-lg">
                <img src={logo} alt="Ruhi" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  Ruhi <span className="text-xs font-normal bg-primary-foreground/20 px-2 py-0.5 rounded-full">AI Friend</span>
                </h3>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-secondary animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                  {isSpeaking ? 'Speaking...' : hasMemory ? '🧠 Remembers your last chat' : 'Powered by SwasthyaSaathi'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                onClick={() => { if (voiceEnabled) stopSpeaking(); setVoiceEnabled(!voiceEnabled); }}
                title={voiceEnabled ? 'Mute voice' : 'Enable voice'}>
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                onClick={clearChat} title="New chat">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                onClick={() => { stopSpeaking(); setIsOpen(false); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-1 flex-shrink-0 border border-border">
                      <img src={logo} alt="Ruhi" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-1 flex-shrink-0 border border-border">
                    <img src={logo} alt="Ruhi" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Ruhi is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {messages.length <= 1 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto">
              {(userData?.occupation === 'college_student'
                ? ['I feel homesick 🏠', 'Placement stress 😰', 'Feeling lonely', 'I have back pain']
                : userData?.occupation === 'school_student'
                ? ['Exam pressure 📝', 'Parents expect too much', 'Feeling stressed', 'Can\'t focus']
                : userData?.occupation === 'working_professional'
                ? ['Burnout at work 🔥', 'Work-life balance', 'Imposter syndrome', 'Feeling exhausted']
                : ['I feel stressed', 'I have headaches', 'Help me sleep', 'Feeling low']
              ).map(text => (
                <button key={text} onClick={() => { setInput(text); setTimeout(() => { document.getElementById('chat-submit-btn')?.click(); }, 50); }}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm whitespace-nowrap hover:bg-primary/20 transition-colors border border-primary/20">
                  {text}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border bg-card">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-center">
              {hasSpeechRecognition && (
                <Button type="button" size="icon" variant={isListening ? 'default' : 'ghost'}
                  onClick={isListening ? stopListening : startListening}
                  className={`rounded-full h-10 w-10 shrink-0 ${isListening ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                  disabled={isLoading}>
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Talk to Ruhi...'}
                className="flex-1 bg-muted border-0 rounded-full" disabled={isLoading} />
              <Button id="chat-submit-btn" type="submit" size="icon" disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 rounded-full w-10 h-10 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isListening ? '🎙️ Speak now...' : 'Voice & text supported • '}
              <button className="text-primary underline" onClick={() => window.open('tel:+911234567890', '_self')}>
                Emergency help
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
