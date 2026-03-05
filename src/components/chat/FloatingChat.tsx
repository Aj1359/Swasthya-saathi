import { useState, useRef, useEffect, useCallback } from 'react';
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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ruhi-chat`;

const getSessionId = () => {
  let id = localStorage.getItem('swasthyasaathi_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('swasthyasaathi_session_id', id);
  }
  return id;
};

const FloatingChat = () => {
  const { userData, updateIndices } = useUser();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      const loadHistory = async () => {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId.current)
          .order('created_at', { ascending: true })
          .limit(50);

        if (data && data.length > 0) {
          setMessages(data.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
        } else if (userData) {
          const greeting = getGreeting();
          setMessages([{ role: 'assistant', content: greeting }]);
          saveMessage('assistant', greeting);
        }
        setHistoryLoaded(true);
      };
      loadHistory();
    }
  }, [isOpen, historyLoaded]);

  const getGreeting = () => {
    if (!userData) return "Hey! I'm Ruhi 💚";
    const name = userData.name;
    if (userData.occupation === 'college_student') {
      return `Hey ${name}! 💚 I'm Ruhi — your buddy here. College life can be wild, right? 🎢\n\nJust tell me what's up. How are you doing today? Like, *really* doing? 🌿`;
    }
    return `Hey ${name}! 💚 I'm Ruhi — think of me as a friend who actually listens.\n\nWhat's going on with you today? I'm all ears 🌿`;
  };

  const saveMessage = async (role: string, content: string) => {
    await supabase.from('chat_messages').insert({
      session_id: sessionId.current,
      role,
      content,
      user_id: user?.id || null,
    });
  };

  const getActivityContext = () => {
    const dailyData = localStorage.getItem('swasthyasaathi_daily');
    return dailyData ? JSON.parse(dailyData) : null;
  };

  const getJournalContext = () => {
    const stored = localStorage.getItem('swasthyasaathi_journal');
    if (!stored) return [];
    return Object.values(JSON.parse(stored)).sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 5);
  };

  const getFaceScanData = () => {
    const stored = localStorage.getItem('swasthyasaathi_face_scan');
    return stored ? JSON.parse(stored) : null;
  };

  const getFaceScanHistory = () => {
    const stored = localStorage.getItem('swasthyasaathi_face_history');
    return stored ? JSON.parse(stored).slice(-7) : [];
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = text.replace(/[#*_~`>|]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const updateDashboardFromChat = (assistantContent: string) => {
    if (!userData) return;
    const lower = assistantContent.toLowerCase();
    let happinessDelta = 0;
    let healthDelta = 0;
    
    // Detect positive/negative sentiment in Ruhi's response context
    if (lower.includes('great job') || lower.includes('proud') || lower.includes('awesome')) {
      happinessDelta += 2;
    }
    if (lower.includes('stressed') || lower.includes('overwhelmed') || lower.includes('anxious')) {
      happinessDelta -= 1;
    }
    if (lower.includes('meditation') || lower.includes('yoga') || lower.includes('breathing')) {
      healthDelta += 1;
    }

    if (happinessDelta !== 0 || healthDelta !== 0) {
      const newH = Math.min(100, Math.max(5, userData.happinessIndex + happinessDelta));
      const newHe = Math.min(100, Math.max(5, userData.healthIndex + healthDelta));
      updateIndices(newH, newHe);
      if (user) {
        supabase.from('profiles').update({ happiness_index: newH, health_index: newHe }).eq('user_id', user.id);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    saveMessage('user', userMessage.content);
    setInput('');
    setIsLoading(true);
    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userData: {
            ...userData,
            activityData: getActivityContext(),
            journalEntries: getJournalContext(),
            faceScanData: getFaceScanData(),
            faceScanHistory: getFaceScanHistory(),
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
        if (response.status === 402) throw new Error('AI service unavailable.');
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        saveMessage('assistant', assistantContent);
        speak(assistantContent);
        updateDashboardFromChat(assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errMsg = "I'm sorry, I couldn't respond right now. Please try again 💚";
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
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

  const hasSpeechRecognition = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-4 sm:right-6 z-50 group" style={{ width: 64, height: 64 }}>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl flex items-center justify-center hover:scale-110 transition-all overflow-hidden border-2 border-primary-foreground/20">
            <img src={logo} alt="Talk to Ruhi" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center shadow-lg border-2 border-card">
            <Sparkles className="w-3 h-3 text-secondary-foreground" />
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
                  Ruhi
                  <span className="text-xs font-normal bg-primary-foreground/20 px-2 py-0.5 rounded-full">AI Friend</span>
                </h3>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-secondary animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                  {isSpeaking ? 'Speaking...' : 'Powered by SwasthyaSaathi'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                onClick={() => { voiceEnabled ? stopSpeaking() : null; setVoiceEnabled(!voiceEnabled); }}
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
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
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
                : ['I feel stressed', 'I have headaches', 'Help me sleep', 'Feeling low']
              ).map((text) => (
                <button key={text} onClick={() => setInput(text)}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm whitespace-nowrap hover:bg-primary/20 transition-colors border border-primary/20">
                  {text}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border bg-card">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-center">
              {hasSpeechRecognition && (
                <Button type="button" size="icon"
                  variant={isListening ? 'default' : 'ghost'}
                  onClick={isListening ? stopListening : startListening}
                  className={`rounded-full h-10 w-10 shrink-0 ${isListening ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                  disabled={isLoading}>
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Talk to Ruhi...'}
                className="flex-1 bg-muted border-0 rounded-full" disabled={isLoading} />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}
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
