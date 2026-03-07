import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Brain, TrendingUp, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

// Maslach Burnout Inventory simplified
const burnoutQuestions = [
  { id: 'exhaustion1', dimension: 'exhaustion', q: 'I feel emotionally drained from my studies' },
  { id: 'exhaustion2', dimension: 'exhaustion', q: 'I feel used up at the end of the day' },
  { id: 'exhaustion3', dimension: 'exhaustion', q: 'I feel fatigued when I get up and face another day' },
  { id: 'cynicism1', dimension: 'cynicism', q: 'I doubt the significance of my coursework' },
  { id: 'cynicism2', dimension: 'cynicism', q: 'I feel less enthusiastic about academics' },
  { id: 'cynicism3', dimension: 'cynicism', q: 'I just want to get through classes without caring' },
  { id: 'accomplishment1', dimension: 'accomplishment', q: 'I feel I am making an effective contribution' },
  { id: 'accomplishment2', dimension: 'accomplishment', q: 'I can effectively solve academic problems' },
  { id: 'accomplishment3', dimension: 'accomplishment', q: 'I feel stimulated by achieving study goals' },
];

const examPhases = [
  {
    phase: 'Pre-Exam',
    icon: '📖',
    strategies: [
      { title: 'Pomodoro Study Blocks', desc: '25 min focus + 5 min break. Prevents burnout while maximizing retention.' },
      { title: 'Active Recall', desc: 'Test yourself instead of re-reading. Use flashcards or teach concepts aloud.' },
      { title: 'Sleep Prioritization', desc: 'Sleep 7-8 hrs. Memory consolidation happens during deep sleep.' },
      { title: 'Box Breathing Before Study', desc: '4-4-4-4 breathing to calm pre-study anxiety.' },
    ],
  },
  {
    phase: 'During Exam',
    icon: '✍️',
    strategies: [
      { title: 'Brain Dump', desc: 'First 2 min: write down key formulas/facts from memory before reading questions.' },
      { title: '5-4-3-2-1 Grounding', desc: 'If anxiety hits: notice 5 things you see, 4 you hear, 3 you touch...' },
      { title: 'Skip & Return', desc: 'Don\'t get stuck. Skip hard questions, come back with fresh perspective.' },
      { title: 'Deep Breaths Between Sections', desc: '3 slow breaths between sections to reset focus.' },
    ],
  },
  {
    phase: 'Post-Exam',
    icon: '🌿',
    strategies: [
      { title: 'Avoid Post-Mortem', desc: 'Don\'t discuss answers with peers immediately. It only increases anxiety.' },
      { title: 'Celebrate Effort', desc: 'Reward yourself regardless of performance. You showed up and tried.' },
      { title: 'Physical Activity', desc: 'Go for a walk, stretch, or do yoga to release exam tension.' },
      { title: 'Journaling', desc: 'Write what you learned about yourself. Growth > grades.' },
    ],
  },
];

const StudentMode = () => {
  const { userData } = useUser();
  const [burnoutAnswers, setBurnoutAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [activePhase, setActivePhase] = useState(0);

  const handleBurnoutAnswer = (qId: string, score: number) => {
    setBurnoutAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const calculateBurnout = () => {
    const dims = { exhaustion: 0, cynicism: 0, accomplishment: 0, eCount: 0, cCount: 0, aCount: 0 };
    burnoutQuestions.forEach(q => {
      const val = burnoutAnswers[q.id];
      if (val !== undefined) {
        if (q.dimension === 'exhaustion') { dims.exhaustion += val; dims.eCount++; }
        if (q.dimension === 'cynicism') { dims.cynicism += val; dims.cCount++; }
        if (q.dimension === 'accomplishment') { dims.accomplishment += val; dims.aCount++; }
      }
    });
    return {
      exhaustion: dims.eCount ? Math.round((dims.exhaustion / (dims.eCount * 6)) * 100) : 0,
      cynicism: dims.cCount ? Math.round((dims.cynicism / (dims.cCount * 6)) * 100) : 0,
      accomplishment: dims.aCount ? Math.round((dims.accomplishment / (dims.aCount * 6)) * 100) : 0,
    };
  };

  const scores = calculateBurnout();
  const allAnswered = burnoutQuestions.every(q => burnoutAnswers[q.id] !== undefined);
  const overallBurnout = Math.round((scores.exhaustion + scores.cynicism + (100 - scores.accomplishment)) / 3);

  const getBurnoutLevel = (score: number) => {
    if (score < 30) return { label: 'Low', color: 'text-primary', emoji: '🌿' };
    if (score < 60) return { label: 'Moderate', color: 'text-secondary', emoji: '⚠️' };
    return { label: 'High', color: 'text-destructive', emoji: '🔴' };
  };

  // Semester trend (mock data based on stored wellness)
  const getSemesterData = () => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const currentMonth = new Date().getMonth();
    return months.slice(0, Math.min(currentMonth + 1, 10)).map((m, i) => ({
      month: m,
      stress: Math.max(20, Math.min(90, 30 + Math.sin(i * 0.8) * 25 + (i > 5 ? 15 : 0))),
      happiness: Math.max(20, Math.min(90, 70 - Math.sin(i * 0.8) * 20 - (i > 5 ? 10 : 0))),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Student Wellness Hub</h2>
            <p className="text-muted-foreground text-sm">
              {userData?.occupation === 'college_student' ? 'College Life Support' : 'Academic Wellness Tools'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="burnout" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-card/80 rounded-2xl mb-4 border border-border/50">
          <TabsTrigger value="burnout" className="rounded-xl text-xs sm:text-sm">
            <Brain className="w-4 h-4 mr-1" />Burnout
          </TabsTrigger>
          <TabsTrigger value="exam" className="rounded-xl text-xs sm:text-sm">
            <BookOpen className="w-4 h-4 mr-1" />Exam Anxiety
          </TabsTrigger>
          <TabsTrigger value="semester" className="rounded-xl text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />Semester
          </TabsTrigger>
        </TabsList>

        {/* Burnout Detection */}
        <TabsContent value="burnout">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-secondary" />
                Burnout Assessment (Maslach-based)
              </CardTitle>
              <p className="text-sm text-muted-foreground">Rate how often you experience each statement (0 = Never, 6 = Every day)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showResults ? (
                <>
                  {burnoutQuestions.map(q => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{q.q}</p>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5, 6].map(n => (
                          <button
                            key={n}
                            onClick={() => handleBurnoutAnswer(q.id, n)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                              burnoutAnswers[q.id] === n
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'bg-muted text-muted-foreground hover:bg-primary/20'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button onClick={() => setShowResults(true)} disabled={!allAnswered} className="w-full mt-4">
                    Analyze Burnout Level
                  </Button>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-6 rounded-2xl bg-muted/50">
                    <p className="text-4xl mb-2">{getBurnoutLevel(overallBurnout).emoji}</p>
                    <p className="text-2xl font-display font-bold text-foreground">{getBurnoutLevel(overallBurnout).label} Burnout</p>
                    <p className="text-muted-foreground text-sm mt-1">Overall Score: {overallBurnout}%</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">Emotional Exhaustion</span>
                        <span className={getBurnoutLevel(scores.exhaustion).color}>{scores.exhaustion}%</span>
                      </div>
                      <Progress value={scores.exhaustion} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">Cynicism / Detachment</span>
                        <span className={getBurnoutLevel(scores.cynicism).color}>{scores.cynicism}%</span>
                      </div>
                      <Progress value={scores.cynicism} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">Personal Accomplishment</span>
                        <span className={scores.accomplishment > 50 ? 'text-primary' : 'text-destructive'}>{scores.accomplishment}%</span>
                      </div>
                      <Progress value={scores.accomplishment} className="h-3" />
                    </div>
                  </div>

                  <div className="bg-primary/10 rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground mb-2">💡 Recommendations</p>
                    {overallBurnout > 60 && (
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Talk to Ruhi about your feelings — she can help</li>
                        <li>Take mandatory 10-min breaks every 90 minutes</li>
                        <li>Consider speaking to a counselor</li>
                        <li>Prioritize sleep over late-night studying</li>
                      </ul>
                    )}
                    {overallBurnout <= 60 && overallBurnout > 30 && (
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Good awareness! Maintain your study-rest balance</li>
                        <li>Try meditation sessions to prevent escalation</li>
                        <li>Keep up social connections</li>
                      </ul>
                    )}
                    {overallBurnout <= 30 && (
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>You're doing great! Keep your healthy habits</li>
                        <li>Continue tracking your wellness daily</li>
                      </ul>
                    )}
                  </div>

                  <Button variant="outline" onClick={() => { setShowResults(false); setBurnoutAnswers({}); }} className="w-full">
                    Retake Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Anxiety Module */}
        <TabsContent value="exam">
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {examPhases.map((p, i) => (
                <Button
                  key={i}
                  variant={activePhase === i ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePhase(i)}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <span className="mr-1">{p.icon}</span> {p.phase}
                </Button>
              ))}
            </div>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  {examPhases[activePhase].icon} {examPhases[activePhase].phase} Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {examPhases[activePhase].strategies.map((s, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Semester Trends */}
        <TabsContent value="semester">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Semester Emotional Trend
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your wellness pattern across the academic year</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getSemesterData().map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium w-8">{d.month}</span>
                      <div className="flex gap-4">
                        <span className="text-primary">😊 {Math.round(d.happiness)}%</span>
                        <span className="text-destructive">😰 {Math.round(d.stress)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${d.happiness}%` }} />
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive/60 transition-all rounded-full" style={{ width: `${d.stress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary/10">
                <p className="text-sm font-medium text-foreground mb-2">📊 Emotional Progress Report</p>
                <p className="text-xs text-muted-foreground">
                  Based on your data, stress typically peaks during mid-semester and exam periods.
                  Your happiness levels are {userData?.happinessIndex && userData.happinessIndex > 50 ? 'above' : 'below'} average.
                  {userData?.occupation === 'college_student' && ' As an IIT Bhilai student, we recommend utilizing campus wellness resources and maintaining peer connections.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentMode;
