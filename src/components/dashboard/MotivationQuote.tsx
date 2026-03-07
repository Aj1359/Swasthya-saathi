import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const quotes = [
  { text: "The greatest wealth is health.", author: "Virgil" },
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author: "Oprah Winfrey" },
  { text: "Self-care is not self-indulgence, it is self-preservation.", author: "Audre Lorde" },
  { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi" },
  { text: "Be gentle with yourself. You're doing the best you can.", author: "Unknown" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.", author: "Glenn Close" },
  { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", author: "Sophia Bush" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
  { text: "Mental health is not a destination but a process. It's about how you drive, not where you're going.", author: "Noam Shpancer" },
  { text: "It's okay to not be okay — as long as you are not giving up.", author: "Karen Salmansohn" },
  { text: "The sun himself is weak when he first rises, and gathers strength and courage as the day gets on.", author: "Charles Dickens" },
];

const MotivationQuote = () => {
  const [show, setShow] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    const lastShown = localStorage.getItem('swasthyasaathi_quote_date');
    const today = new Date().toISOString().split('T')[0];
    if (lastShown !== today) {
      const idx = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[idx]);
      setShow(true);
      localStorage.setItem('swasthyasaathi_quote_date', today);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[90%] max-w-md glass-card p-8 relative animate-scale-in">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center space-y-4">
          <Sparkles className="w-8 h-8 text-secondary mx-auto animate-breathe" />
          <p className="text-xs text-primary font-medium uppercase tracking-wider">Today's Inspiration</p>
          <blockquote className="text-xl font-display italic text-foreground leading-relaxed">
            "{quote.text}"
          </blockquote>
          <p className="text-sm text-muted-foreground">— {quote.author}</p>

          <Button onClick={() => setShow(false)} className="mt-4">
            Start My Day 🌿
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MotivationQuote;
