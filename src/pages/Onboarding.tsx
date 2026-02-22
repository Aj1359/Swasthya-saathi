import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useUser } from '@/contexts/UserContext';
import { ArrowRight, ArrowLeft, Heart, GraduationCap, Briefcase, MapPin, Camera, Stethoscope } from 'lucide-react';

const professions = [
  { value: 'college_student', label: 'College Student', icon: GraduationCap },
  { value: 'working_professional', label: 'Working Professional', icon: Briefcase },
  { value: 'school_student', label: 'School Student', icon: GraduationCap },
  { value: 'other', label: 'Other', icon: Stethoscope },
];

const collegeStressorOptions = [
  { value: 'homesickness', label: '🏠 Homesickness', desc: 'Missing family & home' },
  { value: 'placement_anxiety', label: '💼 Placement Stress', desc: 'Career & job worries' },
  { value: 'loneliness', label: '😔 Loneliness', desc: 'Feeling disconnected' },
  { value: 'breakup', label: '💔 Breakup', desc: 'Relationship pain' },
  { value: 'academic_pressure', label: '📚 Academic Pressure', desc: 'Studies & exams' },
  { value: 'financial_stress', label: '💰 Financial Stress', desc: 'Money worries' },
  { value: 'peer_pressure', label: '👥 Peer Pressure', desc: 'Social comparison' },
  { value: 'identity_crisis', label: '🪞 Identity Crisis', desc: 'Self-discovery' },
];

// Psychology-based wellness questionnaire
const wellnessQuestions = [
  {
    id: 'sleep_quality',
    question: 'How would you rate your sleep quality recently?',
    options: ['Very poor — I barely sleep', 'Poor — I wake up tired', 'Average — it could be better', 'Good — I feel rested', 'Excellent — I sleep deeply'],
    scores: [1, 2, 3, 4, 5],
  },
  {
    id: 'energy_level',
    question: 'How are your energy levels throughout the day?',
    options: ['Constantly exhausted', 'Low energy, need caffeine', 'Up and down', 'Generally good', 'Full of energy!'],
    scores: [1, 2, 3, 4, 5],
  },
  {
    id: 'social_connection',
    question: 'How connected do you feel to people around you?',
    options: ['Very isolated & lonely', 'Somewhat disconnected', 'Neutral — could be better', 'I have a few close ones', 'Strong support system'],
    scores: [1, 2, 3, 4, 5],
  },
  {
    id: 'stress_level',
    question: 'How often do you feel overwhelmed or stressed?',
    options: ['Almost always', 'Most days', 'A few times a week', 'Occasionally', 'Rarely'],
    scores: [1, 2, 3, 4, 5],
  },
  {
    id: 'physical_health',
    question: 'Any physical discomfort bothering you lately?',
    options: ['Back pain / body aches', 'Headaches / migraines', 'Lethargy / fatigue', 'Digestive issues', 'I feel physically fine'],
    scores: [2, 2, 1, 2, 5],
    multiSelect: true,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: 20,
    occupation: '',
    country: '',
    collegeStressors: [] as string[],
    wellnessAnswers: {} as Record<string, string[]>,
  });

  const isCollegeStudent = formData.occupation === 'college_student';
  // Steps: 1-Name, 2-Gender/Age, 3-Occupation/Country, 4-CollegeStressors(conditional), 5-Wellness questionnaire, 6-Summary
  const totalSteps = isCollegeStudent ? 6 : 5;

  const getActualStep = (s: number) => {
    if (!isCollegeStudent && s >= 4) return s + 1; // skip college stressors step
    return s;
  };

  const actualStep = getActualStep(step);

  const handleNext = () => { if (step < totalSteps) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const calculateScores = () => {
    const answers = formData.wellnessAnswers;
    let happinessTotal = 0;
    let healthTotal = 0;
    let count = 0;

    wellnessQuestions.forEach((q) => {
      const selected = answers[q.id] || [];
      selected.forEach((ans) => {
        const idx = q.options.indexOf(ans);
        if (idx >= 0) {
          const score = q.scores[idx];
          if (['sleep_quality', 'energy_level', 'physical_health'].includes(q.id)) {
            healthTotal += score;
          } else {
            happinessTotal += score;
          }
          count++;
        }
      });
    });

    const happiness = count > 0 ? Math.round((happinessTotal / (count * 5)) * 100) : 50;
    const health = count > 0 ? Math.round((healthTotal / (count * 5)) * 100) : 60;
    return { happiness: Math.min(100, Math.max(10, happiness)), health: Math.min(100, Math.max(10, health)) };
  };

  const handleSubmit = () => {
    const { happiness, health } = calculateScores();
    setUserData({
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      mood: 'okay', // derived from questionnaire
      aboutYourself: '',
      occupation: formData.occupation,
      country: formData.country,
      collegeStressors: formData.collegeStressors,
      happinessIndex: happiness,
      healthIndex: health,
    });
    navigate('/dashboard');
  };

  const toggleStressor = (stressor: string) => {
    setFormData(prev => ({
      ...prev,
      collegeStressors: prev.collegeStressors.includes(stressor)
        ? prev.collegeStressors.filter(s => s !== stressor)
        : [...prev.collegeStressors, stressor],
    }));
  };

  const toggleWellnessAnswer = (questionId: string, answer: string, multi = false) => {
    setFormData(prev => {
      const current = prev.wellnessAnswers[questionId] || [];
      if (multi) {
        const updated = current.includes(answer) ? current.filter(a => a !== answer) : [...current, answer];
        return { ...prev, wellnessAnswers: { ...prev.wellnessAnswers, [questionId]: updated } };
      }
      return { ...prev, wellnessAnswers: { ...prev.wellnessAnswers, [questionId]: [answer] } };
    });
  };

  // Current wellness question index (0-based)
  const wellnessQIdx = actualStep === 5 ? 0 : -1;
  const [currentWellnessQ, setCurrentWellnessQ] = useState(0);

  const canProceed = () => {
    switch (actualStep) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.gender.length > 0 && formData.age > 0;
      case 3: return formData.occupation.length > 0 && formData.country.length > 0;
      case 4: return formData.collegeStressors.length > 0;
      case 5: {
        const q = wellnessQuestions[currentWellnessQ];
        return (formData.wellnessAnswers[q.id] || []).length > 0;
      }
      case 6: return true;
      default: return false;
    }
  };

  const handleStepAction = () => {
    if (actualStep === 5) {
      if (currentWellnessQ < wellnessQuestions.length - 1) {
        setCurrentWellnessQ(currentWellnessQ + 1);
        return;
      }
    }
    if (step === totalSteps) {
      handleSubmit();
    } else {
      handleNext();
    }
  };

  const handleStepBack = () => {
    if (actualStep === 5 && currentWellnessQ > 0) {
      setCurrentWellnessQ(currentWellnessQ - 1);
      return;
    }
    handleBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-sage/20 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: actualStep === 5 ? totalSteps + wellnessQuestions.length - 1 : totalSteps }, (_, i) => {
            const filled = actualStep < 5 ? i + 1 <= step : (i < step - 1) || (i >= step - 1 && i < step - 1 + currentWellnessQ + 1);
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${filled ? 'bg-primary' : 'bg-muted'}`}
              />
            );
          })}
        </div>

        <div className="glass-card p-8 animate-fade-in" key={`${actualStep}-${currentWellnessQ}`}>
          {actualStep === 1 && (
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

          {actualStep === 2 && (
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

          {actualStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground">What do you do?</h2>
                <p className="text-muted-foreground mt-2">This helps us tailor your journey</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {professions.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setFormData({ ...formData, occupation: p.value })}
                      className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 flex flex-col items-center gap-2 ${
                        formData.occupation === p.value
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border bg-background/50 hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-8 h-8 text-primary" />
                      <p className="font-medium text-sm text-foreground">{p.label}</p>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3 mt-4">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Where are you from?
                </Label>
                <Input
                  placeholder="Country / City"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="bg-background/50 border-border"
                />
              </div>
            </div>
          )}

          {actualStep === 4 && isCollegeStudent && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">What's been on your mind?</h2>
                <p className="text-muted-foreground mt-2">Select all that apply — no judgment here 💚</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {collegeStressorOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleStressor(s.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.collegeStressors.includes(s.value)
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-background/50 hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {actualStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-xs text-primary font-medium mb-2">Question {currentWellnessQ + 1} of {wellnessQuestions.length}</p>
                <h2 className="text-xl font-display font-bold text-foreground">
                  {wellnessQuestions[currentWellnessQ].question}
                </h2>
              </div>
              <div className="space-y-3">
                {wellnessQuestions[currentWellnessQ].options.map((option, idx) => {
                  const qId = wellnessQuestions[currentWellnessQ].id;
                  const isMulti = wellnessQuestions[currentWellnessQ].multiSelect;
                  const selected = (formData.wellnessAnswers[qId] || []).includes(option);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleWellnessAnswer(qId, option, isMulti)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border bg-background/50 hover:border-primary/40'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{option}</p>
                    </button>
                  );
                })}
              </div>
              {wellnessQuestions[currentWellnessQ].multiSelect && (
                <p className="text-xs text-muted-foreground text-center">You can select multiple options</p>
              )}
            </div>
          )}

          {actualStep === 6 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-primary animate-breathe" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                You're all set, {formData.name}! 🌿
              </h2>
              <p className="text-muted-foreground">
                I've personalized your wellness journey based on your responses. 
                Ruhi, your AI companion, is ready to talk whenever you need.
              </p>
              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm text-foreground"><strong>💡 Tip:</strong> You can talk to Ruhi anytime using text or voice — she remembers your conversations!</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {(step > 1 || (actualStep === 5 && currentWellnessQ > 0)) && (
              <Button onClick={handleStepBack} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleStepAction}
              disabled={!canProceed()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {actualStep === 6 ? 'Start My Journey' : actualStep === 5 && currentWellnessQ < wellnessQuestions.length - 1 ? 'Next Question' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
