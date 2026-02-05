import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Flower2, Play, Check, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyTracker } from '@/components/tracking/DailyTracker';
import { useUser } from '@/contexts/UserContext';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const yogaCategories = [
  {
    category: 'Diabetes Management',
    color: 'from-primary to-sage',
    icon: '🩺',
    poses: [
      { 
        name: 'Surya Namaskar', 
        video: 'https://www.youtube.com/watch?v=AbPufvvYiSw', 
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
        steps: ['Stand straight with feet together', 'Raise arms overhead while inhaling', 'Bend forward touching the floor', 'Complete the 12-step sequence'],
        duration: 30,
        healthBoost: 5
      },
      { 
        name: 'Dhanurasana (Bow Pose)', 
        video: 'https://www.youtube.com/watch?v=Nuk94YJTKOQ', 
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        steps: ['Lie on stomach', 'Bend knees and hold ankles', 'Lift chest and thighs off the floor', 'Hold for 15-20 seconds'],
        duration: 30,
        healthBoost: 4
      },
      { 
        name: 'Paschimottanasana', 
        video: 'https://www.youtube.com/watch?v=4Ejz7IgODlU', 
        image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=300&fit=crop',
        steps: ['Sit with legs extended', 'Inhale and raise arms', 'Exhale and bend forward', 'Hold your toes and breathe'],
        duration: 30,
        healthBoost: 3
      },
    ],
  },
  {
    category: 'Hypertension Control',
    color: 'from-accent to-sky',
    icon: '❤️',
    poses: [
      { 
        name: 'Shavasana (Corpse Pose)', 
        video: 'https://www.youtube.com/watch?v=1VYlOKUdylM', 
        image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400&h=300&fit=crop',
        steps: ['Lie flat on your back', 'Keep arms by sides, palms up', 'Close eyes and relax completely', 'Focus on deep breathing for 10 min'],
        duration: 30,
        healthBoost: 5
      },
      { 
        name: 'Sukhasana', 
        video: 'https://www.youtube.com/watch?v=u4tPNWSrpNg', 
        image: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=300&fit=crop',
        steps: ['Sit cross-legged', 'Keep spine straight', 'Rest hands on knees', 'Breathe deeply and meditate'],
        duration: 30,
        healthBoost: 4
      },
      { 
        name: 'Viparita Karani', 
        video: 'https://www.youtube.com/watch?v=ZqjPmNmqxHE', 
        image: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=400&h=300&fit=crop',
        steps: ['Lie near a wall', 'Raise legs up against the wall', 'Keep arms relaxed at sides', 'Stay for 5-10 minutes'],
        duration: 30,
        healthBoost: 4
      },
    ],
  },
  {
    category: 'Stress & Anxiety',
    color: 'from-lavender to-primary',
    icon: '🧘',
    poses: [
      { 
        name: 'Balasana (Child Pose)', 
        video: 'https://www.youtube.com/watch?v=2MJGg-dUKh0', 
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
        steps: ['Kneel on the floor', 'Sit back on heels', 'Bend forward, arms extended', 'Rest forehead on ground, breathe'],
        duration: 30,
        healthBoost: 5
      },
      { 
        name: 'Uttanasana', 
        video: 'https://www.youtube.com/watch?v=6bQMnO0IfTA', 
        image: 'https://images.unsplash.com/photo-1573590330099-d6c7355ec595?w=400&h=300&fit=crop',
        steps: ['Stand with feet hip-width apart', 'Bend forward from hips', 'Let head hang heavy', 'Hold ankles or touch floor'],
        duration: 30,
        healthBoost: 4
      },
      { 
        name: 'Cat-Cow Stretch', 
        video: 'https://www.youtube.com/watch?v=kqnua4rHVVA', 
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
        steps: ['Start on hands and knees', 'Inhale, arch back (cow)', 'Exhale, round spine (cat)', 'Repeat 10-15 times'],
        duration: 30,
        healthBoost: 4
      },
    ],
  },
  {
    category: 'Back Pain Relief',
    color: 'from-secondary to-amber',
    icon: '🦴',
    poses: [
      { 
        name: 'Bhujangasana (Cobra)', 
        video: 'https://www.youtube.com/watch?v=fOdrW7nf-YY', 
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
        steps: ['Lie face down', 'Place palms under shoulders', 'Inhale and lift chest', 'Keep elbows slightly bent'],
        duration: 30,
        healthBoost: 5
      },
      { 
        name: 'Marjaryasana', 
        video: 'https://www.youtube.com/watch?v=kqnua4rHVVA', 
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        steps: ['Start on all fours', 'Round your back upward', 'Tuck chin to chest', 'Hold for a few breaths'],
        duration: 30,
        healthBoost: 4
      },
      { 
        name: 'Setu Bandhasana (Bridge)', 
        video: 'https://www.youtube.com/watch?v=SVz8_IrGvl0', 
        image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=300&fit=crop',
        steps: ['Lie on back, knees bent', 'Lift hips toward ceiling', 'Clasp hands under body', 'Hold for 30 seconds'],
        duration: 30,
        healthBoost: 5
      },
    ],
  },
];

const YogaTab = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedPose, setExpandedPose] = useState<string | null>(null);
  const [tryingAsana, setTryingAsana] = useState<string | null>(null);
  const [asanaTimer, setAsanaTimer] = useState(30);
  const [asanaComplete, setAsanaComplete] = useState<string[]>([]);
  const { addActivity } = useDailyTracker();
  const { updateIndices, userData } = useUser();

  const startTryAsana = (poseName: string, duration: number) => {
    setTryingAsana(poseName);
    setAsanaTimer(duration);
    
    const interval = setInterval(() => {
      setAsanaTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTryingAsana(null);
          setAsanaComplete(prev => [...prev, poseName]);
          addActivity('yoga', 1);
          
          // Boost health index
          if (userData) {
            const newHealth = Math.min(userData.healthIndex + 3, 100);
            updateIndices(userData.happinessIndex, newHealth);
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-sage/20 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Flower2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Yoga for Wellness</h2>
            <p className="text-muted-foreground">Poses sorted by health conditions • Try asanas to boost health!</p>
          </div>
        </div>
      </div>

      {/* Try Asana Overlay */}
      {tryingAsana && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-8 p-8">
            <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-primary to-sage flex items-center justify-center animate-breathe">
              <span className="text-6xl font-bold text-white">{asanaTimer}</span>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                Hold: {tryingAsana}
              </h3>
              <p className="text-muted-foreground">Breathe deeply and maintain the pose</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Timer className="w-5 h-5 animate-pulse" />
              <span>Keep going!</span>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {yogaCategories.map((cat) => (
        <div key={cat.category} className="glass-card overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === cat.category ? null : cat.category)}
            className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-lg`}>
                {cat.icon}
              </div>
              <div className="text-left">
                <span className="font-semibold text-foreground text-lg block">{cat.category}</span>
                <span className="text-sm text-muted-foreground">{cat.poses.length} poses available</span>
              </div>
            </div>
            {expanded === cat.category ? (
              <ChevronUp className="w-6 h-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          
          {expanded === cat.category && (
            <div className="border-t border-border">
              {cat.poses.map((pose) => (
                <div key={pose.name} className="border-b border-border last:border-0">
                  <button
                    onClick={() => setExpandedPose(expandedPose === pose.name ? null : pose.name)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {asanaComplete.includes(pose.name) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                      <span className="text-foreground font-medium">{pose.name}</span>
                    </div>
                    {expandedPose === pose.name ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedPose === pose.name && (
                    <div className="px-4 pb-6 space-y-4">
                      {/* Posture Image */}
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <AspectRatio ratio={16/9}>
                          <img 
                            src={pose.image} 
                            alt={pose.name}
                            className="w-full h-full object-cover"
                          />
                        </AspectRatio>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(pose.video, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Watch Tutorial
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-primary/90"
                          onClick={() => startTryAsana(pose.name, pose.duration)}
                          disabled={asanaComplete.includes(pose.name)}
                        >
                          {asanaComplete.includes(pose.name) ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Try Asana (30s)
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Health Boost Info */}
                      <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg">💪</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Health Boost</p>
                          <p className="text-xs text-muted-foreground">+{pose.healthBoost}% health index on completion</p>
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">📋</span>
                          How to do it:
                        </p>
                        <ol className="space-y-2">
                          {pose.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                                {i + 1}
                              </span>
                              <span className="pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default YogaTab;
