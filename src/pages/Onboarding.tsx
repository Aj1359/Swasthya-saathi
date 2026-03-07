import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, ArrowLeft, Heart, GraduationCap, Briefcase, MapPin, Stethoscope, School } from 'lucide-react';

const professions = [
  { value: 'college_student', label: 'College Student', icon: GraduationCap },
  { value: 'working_professional', label: 'Working Professional', icon: Briefcase },
  { value: 'school_student', label: 'School Student', icon: School },
  { value: 'other', label: 'Other', icon: Stethoscope },
];

const stressorsByOccupation: Record<string, { value: string; label: string; desc: string }[]> = {
  college_student: [
    { value: 'homesickness', label: '🏠 Homesickness', desc: 'Missing family & home' },
    { value: 'placement_anxiety', label: '💼 Placement Stress', desc: 'Career & job worries' },
    { value: 'loneliness', label: '😔 Loneliness', desc: 'Feeling disconnected' },
    { value: 'breakup', label: '💔 Breakup', desc: 'Relationship pain' },
    { value: 'academic_pressure', label: '📚 Academic Pressure', desc: 'Studies & exams' },
    { value: 'financial_stress', label: '💰 Financial Stress', desc: 'Money worries' },
    { value: 'peer_pressure', label: '👥 Peer Pressure', desc: 'Social comparison' },
    { value: 'identity_crisis', label: '🪞 Identity Crisis', desc: 'Self-discovery' },
  ],
  working_professional: [
    { value: 'work_life_balance', label: '⚖️ Work-Life Balance', desc: 'Struggling to disconnect' },
    { value: 'burnout', label: '🔥 Burnout', desc: 'Exhaustion from overwork' },
    { value: 'toxic_workplace', label: '☠️ Toxic Environment', desc: 'Unhealthy workplace culture' },
    { value: 'job_insecurity', label: '😰 Job Insecurity', desc: 'Fear of layoffs' },
    { value: 'imposter_syndrome', label: '🎭 Imposter Syndrome', desc: 'Feeling like a fraud' },
    { value: 'financial_pressure', label: '💰 Financial Pressure', desc: 'EMIs, bills, savings' },
    { value: 'relationship_strain', label: '💔 Relationship Strain', desc: 'Work affecting relationships' },
    { value: 'career_stagnation', label: '📉 Career Stagnation', desc: 'Lack of growth' },
  ],
  school_student: [
    { value: 'exam_pressure', label: '📝 Exam Pressure', desc: 'Board exams & tests' },
    { value: 'parent_expectations', label: '👨‍👩‍👧 Parent Expectations', desc: 'Pressure to perform' },
    { value: 'bullying', label: '😢 Bullying', desc: 'Being picked on' },
    { value: 'social_media', label: '📱 Social Media', desc: 'Online pressure & comparison' },
    { value: 'body_image', label: '🪞 Body Image', desc: 'Self-image concerns' },
    { value: 'friendship_issues', label: '👫 Friendship Issues', desc: 'Social conflicts' },
    { value: 'future_anxiety', label: '🔮 Future Anxiety', desc: 'What comes after school?' },
    { value: 'screen_addiction', label: '🎮 Screen Time', desc: 'Gaming/phone addiction' },
  ],
  other: [
    { value: 'loneliness', label: '😔 Loneliness', desc: 'Feeling disconnected' },
    { value: 'health_anxiety', label: '🏥 Health Anxiety', desc: 'Worried about health' },
    { value: 'relationship_issues', label: '💔 Relationships', desc: 'Family or partner issues' },
    { value: 'financial_stress', label: '💰 Financial Stress', desc: 'Money worries' },
    { value: 'purpose', label: '🧭 Lack of Purpose', desc: 'Feeling directionless' },
    { value: 'grief', label: '🕊️ Grief / Loss', desc: 'Processing loss' },
  ],
};

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'South Korea', 'China',
  'Brazil', 'Mexico', 'Singapore', 'UAE', 'Saudi Arabia',
  'South Africa', 'Nigeria', 'Kenya', 'Nepal', 'Sri Lanka',
  'Bangladesh', 'Pakistan', 'Indonesia', 'Thailand', 'Vietnam',
  'Russia', 'Italy', 'Spain', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'New Zealand', 'Ireland',
  'Malaysia', 'Philippines', 'Turkey', 'Egypt', 'Israel',
];

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
  const { user } = useAuth();
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

  const hasStressors = formData.occupation && stressorsByOccupation[formData.occupation];
  const totalSteps = hasStressors ? 6 : 5;

  const getActualStep = (s: number) => {
    if (!hasStressors && s >= 4) return s + 1;
    return s;
  };

  const actualStep = getActualStep(step);
  const handleNext = () => { if (step < totalSteps) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const calculateScores = () => {
    const answers = formData.wellnessAnswers;
    let happinessTotal = 0, healthTotal = 0, count = 0;
    wellnessQuestions.forEach(q => {
      const selected = answers[q.id] || [];
      selected.forEach(ans => {
        const idx = q.options.indexOf(ans);
        if (idx >= 0) {
          const score = q.scores[idx];
          if (['sleep_quality', 'energy_level', 'physical_health'].includes(q.id)) healthTotal += score;
          else happinessTotal += score;
          count++;
        }
      });
    });
    const happiness = count > 0 ? Math.round((happinessTotal / (count * 5)) * 100) : 50;
    const health = count > 0 ? Math.round((healthTotal / (count * 5)) * 100) : 60;
    return { happiness: Math.min(100, Math.max(10, happiness)), health: Math.min(100, Math.max(10, health)) };
  };

  const handleSubmit = async () => {
    const { happiness, health } = calculateScores();
    const data = {
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      mood: 'okay',
      aboutYourself: '',
      occupation: formData.occupation,
      country: formData.country,
      collegeStressors: formData.collegeStressors,
      happinessIndex: happiness,
      healthIndex: health,
    };
    setUserData(data);

    // Save to profile in DB
    if (user) {
      await supabase.from('profiles').update({
        name: formData.name,
        gender: formData.gender,
        age: formData.age,
        occupation: formData.occupation,
        country: formData.country,
        college_stressors: formData.collegeStressors,
        happiness_index: happiness,
        health_index: health,
        wellness_answers: formData.wellnessAnswers,
      }).eq('user_id', user.id);
    }

    navigate('/dashboard');
  };

  const toggleStressor = (s: string) => {
    setFormData(prev => ({
      ...prev,
      collegeStressors: prev.collegeStressors.includes(s)
        ? prev.collegeStressors.filter(x => x !== s)
        : [...prev.collegeStressors, s],
    }));
  };

  const toggleWellnessAnswer = (qId: string, answer: string, multi = false) => {
    setFormData(prev => {
      const current = prev.wellnessAnswers[qId] || [];
      if (multi) {
        const updated = current.includes(answer) ? current.filter(a => a !== answer) : [...current, answer];
        return { ...prev, wellnessAnswers: { ...prev.wellnessAnswers, [qId]: updated } };
      }
      return { ...prev, wellnessAnswers: { ...prev.wellnessAnswers, [qId]: [answer] } };
    });
  };

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
    if (actualStep === 5 && currentWellnessQ < wellnessQuestions.length - 1) {
      setCurrentWellnessQ(currentWellnessQ + 1);
      return;
    }
    if (step === totalSteps) handleSubmit();
    else handleNext();
  };

  const handleStepBack = () => {
    if (actualStep === 5 && currentWellnessQ > 0) {
      setCurrentWellnessQ(currentWellnessQ - 1);
      return;
    }
    handleBack();
  };

  const currentStressors = stressorsByOccupation[formData.occupation] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-primary/10 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: actualStep === 5 ? totalSteps + wellnessQuestions.length - 1 : totalSteps }, (_, i) => {
            const filled = actualStep < 5 ? i + 1 <= step : (i < step - 1) || (i >= step - 1 && i < step - 1 + currentWellnessQ + 1);
            return <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${filled ? 'bg-primary' : 'bg-muted'}`} />;
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
                <Input id="name" placeholder="Enter your name" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-lg py-6 bg-background/50 border-border" />
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
                <RadioGroup value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })} className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Other'].map(g => (
                    <div key={g} className="relative">
                      <RadioGroupItem value={g.toLowerCase()} id={g} className="peer sr-only" />
                      <Label htmlFor={g} className="flex items-center justify-center p-4 rounded-xl border-2 border-border bg-background/50 cursor-pointer transition-all hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10">
                        {g}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-4">
                <Label className="text-foreground font-medium">Age: {formData.age}</Label>
                <Slider value={[formData.age]} onValueChange={([v]) => setFormData({ ...formData, age: v })} min={10} max={100} step={1} className="py-4" />
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
                {professions.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.value} onClick={() => setFormData({ ...formData, occupation: p.value, collegeStressors: [] })}
                      className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 flex flex-col items-center gap-2 ${
                        formData.occupation === p.value ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-background/50 hover:border-primary/50'
                      }`}>
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
                <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                  <SelectTrigger className="bg-background/50 border-border">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {actualStep === 4 && hasStressors && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">What's been on your mind?</h2>
                <p className="text-muted-foreground mt-2">Select all that apply — no judgment here 💚</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {currentStressors.map(s => (
                  <button key={s.value} onClick={() => toggleStressor(s.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.collegeStressors.includes(s.value) ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-background/50 hover:border-primary/50'
                    }`}>
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
                <h2 className="text-xl font-display font-bold text-foreground">{wellnessQuestions[currentWellnessQ].question}</h2>
              </div>
              <div className="space-y-3">
                {wellnessQuestions[currentWellnessQ].options.map((option, idx) => {
                  const qId = wellnessQuestions[currentWellnessQ].id;
                  const isMulti = wellnessQuestions[currentWellnessQ].multiSelect;
                  const selected = (formData.wellnessAnswers[qId] || []).includes(option);
                  return (
                    <button key={idx} onClick={() => toggleWellnessAnswer(qId, option, isMulti)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selected ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-background/50 hover:border-primary/40'
                      }`}>
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
              <h2 className="text-2xl font-display font-bold text-foreground">You're all set, {formData.name}! 🌿</h2>
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
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button onClick={handleStepAction} disabled={!canProceed()} className="flex-1 bg-primary hover:bg-primary/90">
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
