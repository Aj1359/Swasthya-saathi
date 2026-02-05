import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useUser } from '@/contexts/UserContext';
import { ArrowRight, ArrowLeft, Heart, Smile, Meh, Frown, CloudRain } from 'lucide-react';

const moods = [
  { value: 'great', label: 'Great', icon: Smile, color: 'text-primary' },
  { value: 'okay', label: 'Okay', icon: Meh, color: 'text-secondary' },
  { value: 'low', label: 'Low', icon: Frown, color: 'text-amber' },
  { value: 'struggling', label: 'Struggling', icon: CloudRain, color: 'text-muted-foreground' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: 25,
    mood: '',
    aboutYourself: '',
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const moodToHappiness: Record<string, number> = {
      'great': 85,
      'okay': 65,
      'low': 40,
      'struggling': 25,
    };

    setUserData({
      ...formData,
      happinessIndex: moodToHappiness[formData.mood] || 50,
      healthIndex: 60,
    });
    navigate('/dashboard');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.gender.length > 0 && formData.age > 0;
      case 3: return formData.mood.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-sage/20 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="glass-card p-8 animate-fade-in" key={step}>
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4 animate-breathe" />
                <h2 className="text-2xl font-display font-bold text-foreground">Welcome, Friend</h2>
                <p className="text-muted-foreground mt-2">Let's get to know you better</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="name" className="text-foreground font-medium">What should I call you?</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-lg py-6 bg-background/50 border-border"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground">Tell me about yourself</h2>
                <p className="text-muted-foreground mt-2">This helps personalize your experience</p>
              </div>
              
              <div className="space-y-4">
                <Label className="text-foreground font-medium">Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  className="grid grid-cols-3 gap-3"
                >
                  {['Male', 'Female', 'Other'].map((g) => (
                    <div key={g} className="relative">
                      <RadioGroupItem value={g.toLowerCase()} id={g} className="peer sr-only" />
                      <Label
                        htmlFor={g}
                        className="flex items-center justify-center p-4 rounded-xl border-2 border-border bg-background/50 cursor-pointer transition-all hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                      >
                        {g}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-foreground font-medium">Age: {formData.age}</Label>
                <Slider
                  value={[formData.age]}
                  onValueChange={(value) => setFormData({ ...formData, age: value[0] })}
                  min={10}
                  max={100}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground">How are you feeling today?</h2>
                <p className="text-muted-foreground mt-2">There's no wrong answer</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {moods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setFormData({ ...formData, mood: m.value })}
                      className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                        formData.mood === m.value
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border bg-background/50 hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-10 h-10 mx-auto mb-2 ${m.color}`} />
                      <p className="font-medium text-foreground">{m.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground">Anything else to share?</h2>
                <p className="text-muted-foreground mt-2">This is optional but helps me understand you</p>
              </div>
              
              <Textarea
                placeholder="Tell me about what's on your mind, any challenges you're facing, or what brings you here today..."
                value={formData.aboutYourself}
                onChange={(e) => setFormData({ ...formData, aboutYourself: e.target.value })}
                className="min-h-[150px] bg-background/50 border-border"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={step === 4 ? handleSubmit : handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {step === 4 ? 'Start My Journey' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
