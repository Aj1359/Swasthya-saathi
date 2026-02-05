import { Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface HealthCardProps {
  value: number;
}

const HealthCard = ({ value }: HealthCardProps) => {
  const getColor = () => {
    if (value >= 70) return 'text-primary';
    if (value >= 40) return 'text-accent';
    return 'text-amber';
  };

  const getMessage = () => {
    if (value >= 80) return "Your health is thriving!";
    if (value >= 60) return "Keep nurturing your body.";
    if (value >= 40) return "Let's focus on your wellness.";
    return "Time to prioritize your health.";
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
          <Activity className={`w-6 h-6 ${getColor()}`} />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Health Index</h3>
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

export default HealthCard;
