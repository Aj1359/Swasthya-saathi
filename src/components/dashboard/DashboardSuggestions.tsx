import { Sparkles, Music, Flower2, Wind, BookOpen } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface Suggestion {
  icon: React.ReactNode;
  title: string;
  description: string;
  tab: string;
  color: string;
}

interface DashboardSuggestionsProps {
  onSuggestionClick: (tab: string) => void;
}

const DashboardSuggestions = ({ onSuggestionClick }: DashboardSuggestionsProps) => {
  const { userData } = useUser();
  
  const getSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    
    if (!userData) return suggestions;

    // Based on happiness index
    if (userData.happinessIndex < 40) {
      suggestions.push({
        icon: <Music className="w-5 h-5" />,
        title: 'Calm Your Mind',
        description: 'Try "Ocean Waves" meditation for deep relaxation',
        tab: 'meditation',
        color: 'from-sky to-accent',
      });
      suggestions.push({
        icon: <Wind className="w-5 h-5" />,
        title: '4-7-8 Breathing',
        description: 'A quick technique to reduce anxiety',
        tab: 'breathing',
        color: 'from-lavender to-primary',
      });
    }

    // Based on health index
    if (userData.healthIndex < 50) {
      suggestions.push({
        icon: <Flower2 className="w-5 h-5" />,
        title: 'Energizing Yoga',
        description: 'Try Surya Namaskar for better energy',
        tab: 'yoga',
        color: 'from-sage to-primary',
      });
    }

    // Based on mood
    if (userData.mood === 'stressed' || userData.mood === 'anxious') {
      suggestions.push({
        icon: <Wind className="w-5 h-5" />,
        title: 'Box Breathing',
        description: 'Perfect for stress relief',
        tab: 'breathing',
        color: 'from-secondary to-amber',
      });
    }

    if (userData.mood === 'sad' || userData.mood === 'low') {
      suggestions.push({
        icon: <BookOpen className="w-5 h-5" />,
        title: 'Inspiring Read',
        description: 'Uplifting quotes to brighten your day',
        tab: 'books',
        color: 'from-primary to-sage',
      });
    }

    // Default suggestions if nothing specific
    if (suggestions.length === 0) {
      suggestions.push({
        icon: <Music className="w-5 h-5" />,
        title: 'Daily Meditation',
        description: 'Start your day with peaceful sounds',
        tab: 'meditation',
        color: 'from-primary to-accent',
      });
    }

    return suggestions.slice(0, 3);
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber" />
        <h3 className="font-display font-bold text-foreground">Personalized For You</h3>
      </div>
      
      <div className="grid gap-3">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion.tab)}
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r hover:scale-[1.02] transition-all text-left group"
            style={{
              background: `linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)`,
            }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center text-white shrink-0`}>
              {suggestion.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{suggestion.title}</p>
              <p className="text-sm text-muted-foreground truncate">{suggestion.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardSuggestions;
