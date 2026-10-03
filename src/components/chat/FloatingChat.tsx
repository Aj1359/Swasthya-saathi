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

const getSessionId = () => {
  let id = localStorage.getItem('swasthyasaathi_session_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('swasthyasaathi_session_id', id); }
  return id;
};

function generateRuhiLocalResponse(messages: Message[]): string {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const historyText = messages.map(m => m.content.toLowerCase()).join(' ');

  const normalized = lastMsg.toLowerCase()
    .replace(/streesed|stresed|stresd|strssed|stres/g, 'stressed')
    .replace(/timorrow|tomorow|tmrw|tomorrw/g, 'tomorrow')
    .replace(/wjat|wat|wht|wats/g, 'what')
    .replace(/intervew|intervow|intrview|intrvw/g, 'interview')
    .replace(/homesik|homesk/g, 'homesick')
    .replace(/lonley|lonly/g, 'lonely');

  const isInterview = normalized.includes('interview') || historyText.includes('interview');
  const isPlacement = normalized.includes('placement') || historyText.includes('placement');
  const isExam = normalized.includes('exam') || historyText.includes('exam');
  const isStress = normalized.includes('stressed') || normalized.includes('anxious') || normalized.includes('worried') || historyText.includes('stress');
  const isHomesick = normalized.includes('homesick') || historyText.includes('homesick');
  const isUncertain = normalized.includes('dont know') || normalized.includes("don't know") || normalized.includes('confused') || normalized.includes('lost') || normalized.includes('help');

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

  if (isHomesick) {
    return "Missing home is so valid 🏡. It just means you have a place full of love to miss. Call a family member or friend for 5 minutes, or eat a cozy comfort meal today. What usually makes you feel a bit warmer when you're away?";
  }

  if (isExam || isStress) {
    return "Take a slow, deep breath in... and let it out. 🌬️ When stress builds up, breaking things down into tiny 15-minute steps helps. What's one small thing we can tackle right now?";
  }

  return "I hear you 💚. It takes courage to open up about how you're feeling. I'm right here with you — tell me a bit more about what's on your mind?";
}

interface FloatingChatProps {
  initialMessage?: string;
}

export function FloatingChat({ initialMessage }: FloatingChatProps) {
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
  const [hasMemory, setHasMemory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const sessionId = useRef(getSessionId());

  // Preload speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setInput(initialMessage);
      setIsOpen(true);
    }
  }, [initialMessage]);

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

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const startListening = useCallback(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
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
    
    // Clean markdown formatting and emojis for clean speech output
    const cleaned = text
      .replace(/[#*_~`>|]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\p{Extended_Pictographic}/gu, '');

    if (!cleaned.trim()) return;

    const u = new SpeechSynthesisUtterance(cleaned);
    u.rate = 1.0;
    u.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const selectedVoice = voices.find(v => 
        (v.lang.toLowerCase().includes('in')) && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('veena') || v.name.toLowerCase().includes('geeta'))
      ) || voices.find(v => v.lang.toLowerCase().includes('in'))
        || voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'))
        || voices[0];
      
      if (selectedVoice) {
        u.voice = selectedVoice;
        u.lang = selectedVoice.lang;
      }
    }

    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = (e) => { console.warn('TTS error:', e); setIsSpeaking(false); };
    
    window.speechSynthesis.speak(u);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }, []);

  const updateDashboardFromChat = (content: string) => {
    if (!userData) return;
    const l = content.toLowerCase();
    let hd = 0, hed = 0;
    if (/\b(great job|proud of you|awesome|well done|that's wonderful)\b/.test(l)) hd += 2;
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
      try {
        const backendBase = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'https://swasthya-saathi-backend-sbme.onrender.com';
        const backendUrl = `${backendBase}/api/chat`;
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

      if (!assistantContent) {
        const allMsgs = [...messages, userMessage];
        assistantContent = generateRuhiLocalResponse(allMsgs);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
      if (assistantContent) {
        saveMessage('assistant', assistantContent);
        speak(assistantContent);
        updateDashboardFromChat(assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errMsg = "I'm sorry, I couldn't respond right now. Please try again 💚";
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      saveMessage('assistant', errMsg);
    } finally {
      setIsLoading(false);
    }
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
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl relative group ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speak(msg.content)}
                        className="mt-1 text-xs opacity-60 hover:opacity-100 flex items-center gap-1 text-muted-foreground hover:text-primary transition-opacity"
                        title="Listen to message"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                      </button>
                    )}
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
                : ['Feeling stressed 😰', 'Help me relax 🧘', 'I need someone to talk to', 'Wellness tips 🌿']
              ).map((chip, i) => (
                <Button key={i} variant="outline" size="sm" className="whitespace-nowrap text-xs rounded-full border-primary/20 hover:bg-primary/10"
                  onClick={() => { setInput(chip); }}>
                  {chip}
                </Button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              {hasSpeechRecognition && (
                <Button size="icon" variant={isListening ? 'destructive' : 'ghost'} className="h-9 w-9 flex-shrink-0"
                  onClick={isListening ? stopListening : startListening}>
                  {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Talk to Ruhi..."
                className="flex-1 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button size="icon" onClick={sendMessage} disabled={!input.trim() || isLoading} className="h-9 w-9 flex-shrink-0 rounded-full">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <span>Voice & text supported</span>
              <span>•</span>
              <a href="tel:14416" className="underline hover:text-primary">Emergency help</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChat;
