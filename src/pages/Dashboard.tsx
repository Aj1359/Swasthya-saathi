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
import { Heart, Music, Flower2, Wind, BookOpen, Phone, LogOut, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, isOnboarded } = useUser();
  const [activeTab, setActiveTab] = useState('meditation');

  useEffect(() => {
    if (!isOnboarded) {
      navigate('/');
    }
  }, [isOnboarded, navigate]);

  if (!userData) return null;

  const handleLogout = () => {
    localStorage.removeItem('swasthyasaathi_user');
    localStorage.removeItem('swasthyasaathi_daily');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-sage/20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">SwasthyaSaathi</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Welcome back, {userData.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Index Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <HappinessCard value={userData.happinessIndex} />
          <HealthCard value={userData.healthIndex} />
        </div>

        {/* Daily Tracker */}
        <DailyTracker />

        {/* Wellness Progress Chart */}
        <WellnessChart />

        {/* Personalized Suggestions */}
        <DashboardSuggestions onSuggestionClick={setActiveTab} />

        {/* Tabs */}
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

          <TabsContent value="meditation" className="mt-0">
            <MeditationTab />
          </TabsContent>
          <TabsContent value="yoga" className="mt-0">
            <YogaTab />
          </TabsContent>
          <TabsContent value="breathing" className="mt-0">
            <BreathingTab />
          </TabsContent>
          <TabsContent value="books" className="mt-0">
            <BooksTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
};

export default Dashboard;
