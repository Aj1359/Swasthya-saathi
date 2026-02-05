import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Phone, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/UserContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ruhi-chat`;

const FloatingChat = () => {
  const { userData } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get activity data for context
  const getActivityContext = () => {
    const dailyData = localStorage.getItem('swasthyasaathi_daily');
    if (dailyData) {
      const data = JSON.parse(dailyData);
      return {
        meditationMinutes: data.meditationMinutes || 0,
        breathingMinutes: data.breathingMinutes || 0,
        yogaMinutes: data.yogaMinutes || 0,
        waterIntake: data.waterIntake || 0,
        sleepHours: data.sleepHours || 7,
        mood: data.mood || 3,
      };
    }
    return null;
  };

  useEffect(() => {
    if (isOpen && messages.length === 0 && userData) {
      const activityData = getActivityContext();
      let greeting = `Hey ${userData.name}! 💚 `;
      
      if (activityData) {
        if (activityData.mood <= 2) {
          greeting += "I sense you might be having a tough day. I'm here for you. ";
        } else if (activityData.mood >= 4) {
          greeting += "You seem to be in good spirits today! That's wonderful. ";
        }
        
        if (activityData.meditationMinutes > 0 || activityData.yogaMinutes > 0) {
          greeting += "I see you've been taking care of yourself with some wellness activities. Great job! ";
        }
      }
      
      greeting += "How are you feeling right now? I'm Ruhi, your wellness companion - here to listen and support you. 🌿";
      
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [isOpen, userData, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const activityData = getActivityContext();

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
            activityData,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment.');
        }
        if (response.status === 402) {
          throw new Error('AI service unavailable. Please try again later.');
        }
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
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
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
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I couldn't respond right now. Please try again in a moment. 💚",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group"
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <MessageCircle className="w-7 h-7 relative z-10" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-foreground" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:inset-auto md:right-6 md:bottom-6 md:w-[400px] md:h-[600px] flex flex-col bg-card md:rounded-3xl shadow-2xl border border-border overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-sage text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🧘</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Ruhi</h3>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Your wellness companion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/20"
                onClick={() => window.open('tel:+911234567890', '_self')}
                title="Call a doctor"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto">
              {['I feel stressed', 'Suggest meditation', 'Help me sleep'].map((text) => (
                <button
                  key={text}
                  onClick={() => setInput(text)}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm whitespace-nowrap hover:bg-primary/20 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share how you're feeling..."
                className="flex-1 bg-muted border-0 rounded-full"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 rounded-full w-10 h-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Need immediate help?{' '}
              <button className="text-primary underline" onClick={() => window.open('tel:+911234567890', '_self')}>
                Call a professional
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
