import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useEffect } from 'react';
import logo from '@/assets/swasthya-saathi-logo.jpeg';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnboarded } = useUser();

  useEffect(() => {
    if (user && isOnboarded) {
      navigate('/dashboard');
    } else if (user) {
      navigate('/onboarding');
    }
  }, [user, isOnboarded, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-primary/10 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-breathe" />
      
      <div className="relative z-10 text-center max-w-2xl animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20">
            <img src={logo} alt="SwasthyaSaathi Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">SwasthyaSaathi</h1>
            <p className="text-sm text-muted-foreground">1.0 by Aditya Jha</p>
          </div>
        </div>

        <div className="glass-card p-8 mb-10">
          <Sparkles className="w-6 h-6 text-secondary mx-auto mb-4" />
          <blockquote className="text-xl md:text-2xl font-display italic text-foreground leading-relaxed">
            "The greatest wealth is health. Take care of your mind, and your body will follow."
          </blockquote>
          <p className="text-muted-foreground mt-4 text-sm">— Your Wellness Journey Begins Here</p>
        </div>

        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Your compassionate AI companion for mental wellness, stress relief, and holistic health.
          Let's walk this path together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Get Started
            <Heart className="ml-2 w-5 h-5" />
          </Button>
          <Button
            onClick={() => navigate('/auth')}
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg rounded-full border-primary/30"
          >
            <LogIn className="mr-2 w-5 h-5" />
            Login
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6 opacity-70">
          Sign in with email • Your data stays private & synced
        </p>
      </div>
    </div>
  );
};

export default Landing;
