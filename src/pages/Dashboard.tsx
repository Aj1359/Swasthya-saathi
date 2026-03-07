import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HappinessCard from '@/components/dashboard/HappinessCard';
import HealthCard from '@/components/dashboard/HealthCard';
import WellnessChart from '@/components/dashboard/WellnessChart';
import WeeklyReport from '@/components/dashboard/WeeklyReport';
import MotivationQuote from '@/components/dashboard/MotivationQuote';
import DailyTracker from '@/components/tracking/DailyTracker';
import DashboardSuggestions from '@/components/dashboard/DashboardSuggestions';
import MeditationTab from '@/components/tabs/MeditationTab';
import YogaTab from '@/components/tabs/YogaTab';
import BreathingTab from '@/components/tabs/BreathingTab';
import BooksTab from '@/components/tabs/BooksTab';
import FloatingChat from '@/components/chat/FloatingChat';
import MoodJournal from '@/components/journal/MoodJournal';
import PeerSupport from '@/components/community/PeerSupport';
import FaceMoodReader from '@/components/mood/FaceMoodReader';
import ProfileMenu from '@/components/profile/ProfileMenu';
import StudentMode from '@/components/student/StudentMode';
import CrisisSupport from '@/components/crisis/CrisisSupport';
import { Heart, Music, Flower2, Wind, BookOpen, Phone, Sparkles, Users, Home, Dumbbell, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

type MobileSection = 'home' | 'exercises' | 'books' | 'read';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, isOnboarded, updateIndices } = useUser();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('meditation');
  const [mobileSection, setMobileSection] = useState<MobileSection>('home');
  const [lastFaceScan, setLastFaceScan] = useState<any>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOnboarded) navigate('/onboarding');
  }, [isOnboarded, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem('swasthyasaathi_face_scan');
    if (stored) setLastFaceScan(JSON.parse(stored));
  }, []);

  if (!userData) return null;

  const handleFaceMoodDetected = async (result: any) => {
    const scanData = { ...result, timestamp: Date.now(), date: new Date().toISOString().split('T')[0] };
    localStorage.setItem('swasthyasaathi_face_scan', JSON.stringify(scanData));
    const historyRaw = localStorage.getItem('swasthyasaathi_face_history');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    history.push(scanData);
    if (history.length > 30) history.splice(0, history.length - 30);
    localStorage.setItem('swasthyasaathi_face_history', JSON.stringify(history));
    setLastFaceScan(scanData);

    if (user) {
      await supabase.from('face_scans').insert({
        user_id: user.id, mood: result.mood, confidence: result.confidence,
        description: result.description, wellness_tip: result.wellness_tip, health_flags: result.health_flags || [],
      });
    }

    const moodImpact: Record<string, number> = { happy: 5, neutral: 0, sad: -5, angry: -4, anxious: -6, tired: -3, stressed: -5 };
    const delta = moodImpact[result.mood] || 0;
    const healthDelta = (result.health_flags?.length || 0) > 0 ? -3 : 2;
    const newHappiness = Math.min(100, Math.max(5, userData.happinessIndex + delta));
    const newHealth = Math.min(100, Math.max(5, userData.healthIndex + healthDelta));
    updateIndices(newHappiness, newHealth);

    if (user) {
      await supabase.from('profiles').update({ happiness_index: newHappiness, health_index: newHealth }).eq('user_id', user.id);
    }
  };

  const isStudent = userData.occupation === 'college_student' || userData.occupation === 'school_student';

  const renderHomeSection = () => (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <HappinessCard value={userData.happinessIndex} />
        <HealthCard value={userData.healthIndex} />
      </div>

      {lastFaceScan && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            {lastFaceScan.mood === 'happy' ? '😊' : lastFaceScan.mood === 'sad' ? '😢' : lastFaceScan.mood === 'neutral' ? '😐' : lastFaceScan.mood === 'tired' ? '😴' : lastFaceScan.mood === 'stressed' ? '😣' : lastFaceScan.mood === 'anxious' ? '😰' : '😤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground capitalize">Last Scan: {lastFaceScan.mood}</p>
            <p className="text-xs text-muted-foreground truncate">{lastFaceScan.description}</p>
            {lastFaceScan.health_flags?.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {lastFaceScan.health_flags.map((flag: string, i: number) => (
                  <span key={i} className="text-[10px] bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full">{flag.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}
          </div>
          <FaceMoodReader onMoodDetected={handleFaceMoodDetected} />
        </div>
      )}

      <DailyTracker />
      <CrisisSupport />
      <WeeklyReport />
      <WellnessChart />

      {isStudent && <StudentMode />}

      <DashboardSuggestions onSuggestionClick={(tab) => {
        if (isMobile) setMobileSection('exercises');
        setActiveTab(tab);
      }} />
      <div className="grid lg:grid-cols-2 gap-6">
        <MoodJournal />
        <PeerSupport />
      </div>
    </>
  );

  const renderExercisesSection = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-3 bg-card/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 shadow-lg border border-border/50">
        <TabsTrigger value="meditation" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
          <Music className="w-5 h-5" /><span className="hidden sm:inline font-medium">Meditation</span>
        </TabsTrigger>
        <TabsTrigger value="yoga" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sage data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
          <Flower2 className="w-5 h-5" /><span className="hidden sm:inline font-medium">Yoga</span>
        </TabsTrigger>
        <TabsTrigger value="breathing" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lavender data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
          <Wind className="w-5 h-5" /><span className="hidden sm:inline font-medium">Breathing</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="meditation" className="mt-0"><MeditationTab /></TabsContent>
      <TabsContent value="yoga" className="mt-0"><YogaTab /></TabsContent>
      <TabsContent value="breathing" className="mt-0"><BreathingTab /></TabsContent>
    </Tabs>
  );

  const mobileNavItems: { id: MobileSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'exercises', label: 'Exercises', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'books', label: 'Books', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'read', label: 'Community', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-primary/10">
      <MotivationQuote />

      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-display font-bold text-lg md:text-xl text-foreground">SwasthyaSaathi</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Welcome, {userData.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!lastFaceScan && <FaceMoodReader onMoodDetected={handleFaceMoodDetected} />}
            <Button variant="outline" size="sm" className="hidden md:flex border-primary/30 hover:bg-primary/10"
              onClick={() => window.open('tel:+911234567890', '_self')}>
              <Phone className="w-4 h-4 mr-2 text-primary" /> Consult Doctor
            </Button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className={`container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 ${isMobile ? 'pb-28' : ''}`}>
        {isMobile ? (
          <>
            {mobileSection === 'home' && renderHomeSection()}
            {mobileSection === 'exercises' && renderExercisesSection()}
            {mobileSection === 'books' && <BooksTab />}
            {mobileSection === 'read' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <MoodJournal />
                <PeerSupport />
              </div>
            )}
          </>
        ) : (
          <>
            {renderHomeSection()}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-card/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 shadow-lg border border-border/50">
                <TabsTrigger value="meditation" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <Music className="w-5 h-5" /><span className="hidden sm:inline font-medium">Meditation</span>
                </TabsTrigger>
                <TabsTrigger value="yoga" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sage data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <Flower2 className="w-5 h-5" /><span className="hidden sm:inline font-medium">Yoga</span>
                </TabsTrigger>
                <TabsTrigger value="breathing" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lavender data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <Wind className="w-5 h-5" /><span className="hidden sm:inline font-medium">Breathing</span>
                </TabsTrigger>
                <TabsTrigger value="books" className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-amber data-[state=active]:text-secondary-foreground data-[state=active]:shadow-lg transition-all">
                  <BookOpen className="w-5 h-5" /><span className="hidden sm:inline font-medium">Books</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="meditation" className="mt-0"><MeditationTab /></TabsContent>
              <TabsContent value="yoga" className="mt-0"><YogaTab /></TabsContent>
              <TabsContent value="breathing" className="mt-0"><BreathingTab /></TabsContent>
              <TabsContent value="books" className="mt-0"><BooksTab /></TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
          <div className="flex items-center justify-around py-2 px-2">
            {mobileNavItems.map(item => (
              <button key={item.id} onClick={() => setMobileSection(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  mobileSection === item.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <FloatingChat />
    </div>
  );
};

export default Dashboard;
