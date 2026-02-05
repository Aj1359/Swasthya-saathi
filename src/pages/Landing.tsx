import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { isOnboarded } = useUser();

  useEffect(() => {
    if (isOnboarded) {
      navigate('/dashboard');
    }
  }, [isOnboarded, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-sage/20 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-breathe" />
      
      <div className="relative z-10 text-center max-w-2xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              SwasthyaSaathi
            </h1>
            <p className="text-sm text-muted-foreground">1.0 by Aditya Jha</p>
          </div>
        </div>

        {/* Quote */}
        <div className="glass-card p-8 mb-10">
          <Sparkles className="w-6 h-6 text-secondary mx-auto mb-4" />
          <blockquote className="text-xl md:text-2xl font-display italic text-foreground leading-relaxed">
            "The greatest wealth is health. Take care of your mind, and your body will follow."
          </blockquote>
          <p className="text-muted-foreground mt-4 text-sm">— Your Wellness Journey Begins Here</p>
        </div>

        {/* Subtitle */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Your compassionate AI companion for mental wellness, stress relief, and holistic health. 
          Let's walk this path together.
        </p>

        {/* CTA Button */}
        <Button 
          onClick={() => navigate('/onboarding')}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          Begin Your Journey
          <Heart className="ml-2 w-5 h-5" />
        </Button>

        <p className="text-xs text-muted-foreground mt-6 opacity-70">
          No sign-up required • Your data stays private
        </p>
      </div>
    </div>
  );
};

export default Landing;
