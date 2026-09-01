import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HappinessCardProps {
  value: number;
  previousValue?: number;
}

const HappinessCard = ({ value, previousValue }: HappinessCardProps) => {
  const delta = previousValue !== undefined ? value - previousValue : 0;

  const getGradient = () => {
    if (value >= 70) return 'from-rose-400 to-pink-500';
    if (value >= 40) return 'from-amber-400 to-orange-400';
    return 'from-slate-400 to-slate-500';
  };

  const getTrackColor = () => {
    if (value >= 70) return '#f43f5e';
    if (value >= 40) return '#f59e0b';
    return '#94a3b8';
  };

  const getMessage = () => {
    if (value >= 80) return "You're doing great! Keep it up!";
    if (value >= 60) return "Good progress! Small steps matter.";
    if (value >= 40) return "Hang in there. I'm here for you.";
    return "Let's work through this together.";
  };

  // SVG radial progress ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="glass-card p-5 space-y-4 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">Happiness Index</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{getMessage()}</p>
        </div>
        {delta !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            delta > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Radial ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor"
              className="text-muted/30" strokeWidth="8" />
            <circle cx="44" cy="44" r={radius} fill="none" stroke={getTrackColor()}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Heart className={`w-4 h-4 bg-gradient-to-br ${getGradient()} text-transparent`}
              style={{ color: getTrackColor() }} />
            <span className="text-lg font-bold text-foreground leading-none mt-0.5">{value}</span>
            <span className="text-[9px] text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Descriptor bars */}
        <div className="flex-1 space-y-2">
          {[
            { label: 'Mood', pct: Math.min(100, value + 5) },
            { label: 'Energy', pct: Math.max(10, value - 8) },
            { label: 'Balance', pct: Math.max(10, value - 3) },
          ].map(({ label, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HappinessCard;
