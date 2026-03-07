import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, History, LogOut, Flame, Heart, Activity, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Calculate streak from localStorage
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `swasthyasaathi_daily_${d.toISOString().split('T')[0]}`;
      const stored = localStorage.getItem(key);
      const dailyKey = localStorage.getItem('swasthyasaathi_daily');
      if (i === 0 && dailyKey) {
        const parsed = JSON.parse(dailyKey);
        if (parsed.date === d.toISOString().split('T')[0]) { count++; continue; }
      }
      if (stored) { count++; } else if (i > 0) break;
    }
    setStreak(Math.max(count, 1));
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const getCondition = () => {
    if (!userData) return { emoji: '😐', label: 'Unknown' };
    const avg = (userData.happinessIndex + userData.healthIndex) / 2;
    if (avg >= 75) return { emoji: '🌟', label: 'Thriving' };
    if (avg >= 55) return { emoji: '🌿', label: 'Balanced' };
    if (avg >= 35) return { emoji: '😔', label: 'Needs Care' };
    return { emoji: '🆘', label: 'Struggling' };
  };

  const condition = getCondition();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <User className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-card border-border">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-foreground">Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-foreground">{userData?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{userData?.occupation?.replace(/_/g, ' ') || 'Wellness Seeker'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <Flame className="w-5 h-5 text-secondary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{streak}</p>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{userData?.happinessIndex || 50}</p>
              <p className="text-[10px] text-muted-foreground">Happiness</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <Activity className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{userData?.healthIndex || 50}</p>
              <p className="text-[10px] text-muted-foreground">Health</p>
            </div>
          </div>

          {/* Current Condition */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <span className="text-2xl">{condition.emoji}</span>
            <div>
              <p className="text-sm font-medium text-foreground">Current: {condition.label}</p>
              <p className="text-xs text-muted-foreground">Based on your wellness indices</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button
              onClick={() => { setOpen(false); navigate('/history'); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-foreground"
            >
              <History className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium">History</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-3 p-3 rounded-xl">
              <span className="text-sm font-medium text-foreground flex-1">Theme</span>
              <ThemeToggle />
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileMenu;
