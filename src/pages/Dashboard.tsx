import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import HappinessCard from '@/components/dashboard/HappinessCard';
import HealthCard from '@/components/dashboard/HealthCard';
import WellnessChart from '@/components/dashboard/WellnessChart';
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
import { Heart, Music, Flower2, Wind, BookOpen, Phone, LogOut, Sparkles, Users, Camera, Home, Dumbbell } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type MobileSection = 'home' | 'exercises' | 'books' | 'read';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, isOnboarded, updateIndices } = useUser();
  const [activeTab, setActiveTab] = useState('meditation');
  const [mobileSection, setMobileSection] = useState<MobileSection>('home');
  const [lastFaceScan, setLastFaceScan] = useState<any>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOnboarded) {
      navigate('/');
    }
  }, [isOnboarded, navigate]);

  // Load last face scan
  useEffect(() => {
    const stored = localStorage.getItem('swasthyasaathi_face_scan');
    if (stored) setLastFaceScan(JSON.parse(stored));
  }, []);

  if (!userData) return null;

  const handleLogout = () => {
    localStorage.removeItem('swasthyasaathi_user');
    localStorage.removeItem('swasthyasaathi_daily');
    window.location.href = '/';
  };

  const handleFaceMoodDetected = (result: any) => {
    // Store the scan result with timestamp
    const scanData = { ...result, timestamp: Date.now(), date: new Date().toISOString().split('T')[0] };
    localStorage.setItem('swasthyasaathi_face_scan', JSON.stringify(scanData));
    
    // Store scan history
    const historyRaw = localStorage.getItem('swasthyasaathi_face_history');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    history.push(scanData);
    // Keep last 30 scans
    if (history.length > 30) history.splice(0, history.length - 30);
    localStorage.setItem('swasthyasaathi_face_history', JSON.stringify(history));

    setLastFaceScan(scanData);

    // Adjust happiness based on mood
    const moodImpact: Record<string, number> = {
      happy: 5, neutral: 0, sad: -5, angry: -4, anxious: -6, tired: -3, stressed: -5,
    };
    const delta = moodImpact[result.mood] || 0;
    const healthDelta = (result.health_flags?.length || 0) > 0 ? -3 : 2;
    
    updateIndices(
      Math.min(100, Math.max(5, userData.happinessIndex + delta)),
      Math.min(100, Math.max(5, userData.healthIndex + healthDelta)),
    );
  };

  // Desktop layout sections
  const renderHomeSection = () => (
    <>
      {/* Index Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <HappinessCard value={userData.happinessIndex} />
        <HealthCard value={userData.healthIndex} />
      </div>

      {/* Face Scan Summary */}
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
                  <span key={i} className="text-[10px] bg-amber/20 text-amber-foreground px-2 py-0.5 rounded-full">
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
          <FaceMoodReader onMoodDetected={handleFaceMoodDetected} />
        </div>
      )}

      {/* Daily Tracker */}
      <DailyTracker />

      {/* Wellness Progress Chart */}
      <WellnessChart />

      {/* Personalized Suggestions */}
      <DashboardSuggestions onSuggestionClick={(tab) => {
        if (isMobile) {
          setMobileSection('exercises');
        }
        setActiveTab(tab);
      }} />

      {/* Mood Journal & Peer Support */}
      <div className="grid lg:grid-cols-2 gap-6">
        <MoodJournal />
        <PeerSupport />
      </div>
    </>
  );

  const renderExercisesSection = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-3 bg-card/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 shadow-lg border border-border/50">
        <TabsTrigger 
          value="meditation" 
          className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
        >
          <Music className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Meditation</span>
        </TabsTrigger>
        <TabsTrigger 
          value="yoga" 
          className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sage data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
        >
          <Flower2 className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Yoga</span>
        </TabsTrigger>
        <TabsTrigger 
          value="breathing" 
          className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lavender data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
        >
          <Wind className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Breathing</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="meditation" className="mt-0"><MeditationTab /></TabsContent>
      <TabsContent value="yoga" className="mt-0"><YogaTab /></TabsContent>
      <TabsContent value="breathing" className="mt-0"><BreathingTab /></TabsContent>
    </Tabs>
  );

  const renderBooksSection = () => <BooksTab />;

  const renderReadSection = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      <MoodJournal />
      <PeerSupport />
    </div>
  );

  // Mobile bottom bar items
  const mobileNavItems: { id: MobileSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'exercises', label: 'Exercises', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'books', label: 'Books', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'read', label: 'Community', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-sage/20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg md:text-xl text-foreground">SwasthyaSaathi</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Welcome, {userData.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!lastFaceScan && <FaceMoodReader onMoodDetected={handleFaceMoodDetected} />}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex border-primary/30 hover:bg-primary/10"
              onClick={() => window.open('tel:+911234567890', '_self')}
            >
              <Phone className="w-4 h-4 mr-2 text-primary" />
              Consult Doctor
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`container mx-auto px-4 py-6 space-y-6 ${isMobile ? 'pb-24' : ''}`}>
        {isMobile ? (
          // Mobile: Show section based on bottom nav
          <>
            {mobileSection === 'home' && renderHomeSection()}
            {mobileSection === 'exercises' && renderExercisesSection()}
            {mobileSection === 'books' && renderBooksSection()}
            {mobileSection === 'read' && renderReadSection()}
          </>
        ) : (
          // Desktop: Show everything
          <>
            {renderHomeSection()}

            {/* Tabs for exercises */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-card/80 backdrop-blur-xl p-1.5 rounded-2xl mb-6 shadow-lg border border-border/50">
                <TabsTrigger 
                  value="meditation" 
                  className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                >
                  <Music className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Meditation</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="yoga" 
                  className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sage data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                >
                  <Flower2 className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Yoga</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="breathing" 
                  className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lavender data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                >
                  <Wind className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Breathing</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="books" 
                  className="flex items-center gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-amber data-[state=active]:text-secondary-foreground data-[state=active]:shadow-lg transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Books</span>
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
          <div className="flex items-center justify-around py-2 px-2">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setMobileSection(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  mobileSection === item.id
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
};

export default Dashboard;
