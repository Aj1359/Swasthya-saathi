import { Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface HappinessCardProps {
  value: number;
}

const HappinessCard = ({ value }: HappinessCardProps) => {
  const getColor = () => {
    if (value >= 70) return 'text-primary';
    if (value >= 40) return 'text-secondary';
    return 'text-amber';
  };

  const getMessage = () => {
    if (value >= 80) return "You're doing great! Keep it up!";
    if (value >= 60) return "Good progress! Small steps matter.";
    if (value >= 40) return "Hang in there. I'm here for you.";
    return "Let's work through this together.";
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Heart className={`w-6 h-6 ${getColor()}`} />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Happiness Index</h3>
          <p className="text-sm text-muted-foreground">{getMessage()}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Your level</span>
          <span className={`font-bold ${getColor()}`}>{value}%</span>
        </div>
        <Progress value={value} className="h-3" />
      </div>
    </div>
  );
};

export default HappinessCard;
