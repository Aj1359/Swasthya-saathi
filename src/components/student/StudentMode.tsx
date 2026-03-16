import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

import {
  GraduationCap,
  Brain,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ChevronRight
} from "lucide-react";

import { useUser } from "@/contexts/UserContext";

/* Burnout Questions */

const burnoutQuestions = [
  { id: "ex1", dimension: "exhaustion", q: "I feel emotionally drained from my studies" },
  { id: "ex2", dimension: "exhaustion", q: "I feel used up at the end of the study day" },
  { id: "ex3", dimension: "exhaustion", q: "I feel fatigued when I start another study day" },

  { id: "cy1", dimension: "cynicism", q: "I doubt the significance of my coursework" },
  { id: "cy2", dimension: "cynicism", q: "I feel less enthusiastic about academics" },
  { id: "cy3", dimension: "cynicism", q: "I just try to get through classes without caring" },

  { id: "ac1", dimension: "accomplishment", q: "I feel I am making academic progress" },
  { id: "ac2", dimension: "accomplishment", q: "I can solve academic problems effectively" },
  { id: "ac3", dimension: "accomplishment", q: "I feel stimulated by achieving study goals" }
];

/* Exam Strategies */

const examPhases = [
  {
    phase: "Pre-Exam",
    icon: "📖",
    strategies: [
      { title: "Pomodoro Study Blocks", desc: "25 min focus + 5 min break to prevent burnout." },
      { title: "Active Recall", desc: "Test yourself instead of rereading notes." },
      { title: "Sleep Priority", desc: "Sleep 7-8 hrs for memory consolidation." },
      { title: "Breathing Reset", desc: "Use 4-4-4-4 breathing before studying." }
    ]
  },
  {
    phase: "During Exam",
    icon: "✍️",
    strategies: [
      { title: "Brain Dump", desc: "Write formulas from memory first." },
      { title: "Skip Hard Questions", desc: "Return later with fresh focus." },
      { title: "Grounding Technique", desc: "Use 5-4-3-2-1 grounding if anxious." },
      { title: "Deep Breathing", desc: "Take 3 slow breaths between sections." }
    ]
  },
  {
    phase: "Post-Exam",
    icon: "🌿",
    strategies: [
      { title: "Avoid Answer Comparison", desc: "Post-exam discussions increase anxiety." },
      { title: "Celebrate Effort", desc: "Reward effort, not just results." },
      { title: "Physical Reset", desc: "Walk, stretch, or exercise." },
      { title: "Reflect", desc: "Journal what you learned." }
    ]
  }
];

const StudentMode = () => {

  const { userData } = useUser();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [activePhase, setActivePhase] = useState(0);

  /* Exam Month Detection */

  const examMonths = [4,5,10,11]; 
  const month = new Date().getMonth();
  const isExamSeason = examMonths.includes(month);

  /* Answer Handler */

  const answer = (id: string, value: number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  /* Burnout Calculation */

  const calculateScores = () => {

    let ex=0,cy=0,ac=0;
    let exC=0,cyC=0,acC=0;

    burnoutQuestions.forEach(q=>{
      const v = answers[q.id];

      if(v!==undefined){

        if(q.dimension==="exhaustion"){
          ex+=v; exC++;
        }

        if(q.dimension==="cynicism"){
          cy+=v; cyC++;
        }

        if(q.dimension==="accomplishment"){
          ac+=v; acC++;
        }

      }

    });

    return{
      exhaustion:Math.round((ex/(exC*6))*100),
      cynicism:Math.round((cy/(cyC*6))*100),
      accomplishment:Math.round((ac/(acC*6))*100)
    };

  };

  const scores = calculateScores();

  /* Burnout Adjustment during Exams */

  const examAdjustment = isExamSeason ? 10 : 0;

  const overallBurnout = Math.max(
    0,
    Math.round(
      (scores.exhaustion + scores.cynicism + (100 - scores.accomplishment)) / 3 - examAdjustment
    )
  );

  /* Student Situation Analysis */

  const analyzeState = () => {

    if(isExamSeason && scores.exhaustion>55){
      return{
        emoji:"📚",
        label:"Exam Stress Detected",
        tips:[
          "Use Pomodoro study blocks",
          "Take breaks every 90 minutes",
          "Sleep at least 7 hours",
          "Avoid last-minute cramming"
        ]
      };
    }

    if(scores.exhaustion>65){
      return{
        emoji:"🔥",
        label:"Burnout Risk",
        tips:[
          "Reduce study hours today",
          "Take a 30-minute walk",
          "Talk to a friend or mentor",
          "Sleep before midnight"
        ]
      };
    }

    if(scores.cynicism>60){
      return{
        emoji:"🧠",
        label:"Academic Detachment",
        tips:[
          "Reconnect with why you chose your field",
          "Study with peers",
          "Change study environment"
        ]
      };
    }

    if(scores.accomplishment<40){
      return{
        emoji:"🎯",
        label:"Low Academic Confidence",
        tips:[
          "Break tasks into smaller goals",
          "Focus on one topic at a time",
          "Celebrate small wins"
        ]
      };
    }

    return{
      emoji:"🌿",
      label:"Healthy Balance",
      tips:[
        "Maintain your study-rest balance",
        "Continue healthy habits"
      ]
    };

  };

  const state = analyzeState();

  const allAnswered = burnoutQuestions.every(q=>answers[q.id]!==undefined);

  /* Semester Trend Mock */

  const months=["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];

  const semesterData = months.map((m,i)=>({
    month:m,
    stress:Math.max(20,Math.min(90,30+Math.sin(i*0.8)*25+(i>5?15:0))),
    happiness:Math.max(20,Math.min(90,70-Math.sin(i*0.8)*20-(i>5?10:0)))
  }));

  return(

    <div className="space-y-6">

      {/* Header */}

      <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-secondary/10">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary"/>
          </div>

          <div>
            <h2 className="text-xl font-bold">Student Wellness Hub</h2>
            <p className="text-muted-foreground text-sm">
              {userData?.occupation==="college_student" ? "College Life Support" : "Academic Wellness Tools"}
            </p>
          </div>

        </div>

      </div>

      {/* Exam Banner */}

      {isExamSeason && (
        <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-300 text-sm">
          📚 <strong>Exam Season Detected</strong>
          <p className="text-xs mt-1 text-muted-foreground">
            Stress often rises during exams. Focus on sleep, hydration,
            and short focused study sessions instead of cramming.
          </p>
        </div>
      )}

      {/* Tabs */}

      <Tabs defaultValue="burnout">

        <TabsList className="grid grid-cols-3 mb-4">

          <TabsTrigger value="burnout">
            <Brain className="w-4 h-4 mr-1"/>Burnout
          </TabsTrigger>

          <TabsTrigger value="exam">
            <BookOpen className="w-4 h-4 mr-1"/>Exam
          </TabsTrigger>

          <TabsTrigger value="semester">
            <TrendingUp className="w-4 h-4 mr-1"/>Semester
          </TabsTrigger>

        </TabsList>

        {/* Burnout Tab */}

        <TabsContent value="burnout">

          <Card>

            <CardHeader>
              <CardTitle className="flex gap-2">
                <AlertTriangle className="w-5 h-5"/>
                Burnout Assessment
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              {!showResults ? (

                <>
                  {burnoutQuestions.map(q=>(
                    <div key={q.id}>

                      <p className="text-sm mb-2">{q.q}</p>

                      <div className="flex gap-1">
                        {[0,1,2,3,4,5,6].map(n=>(
                          <button
                            key={n}
                            onClick={()=>answer(q.id,n)}
                            className={`w-9 h-9 rounded-lg ${
                              answers[q.id]===n
                                ? "bg-primary text-white"
                                : "bg-muted"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>

                    </div>
                  ))}

                  <Button
                    disabled={!allAnswered}
                    onClick={()=>setShowResults(true)}
                    className="w-full"
                  >
                    Analyze Burnout
                  </Button>

                </>

              ) : (

                <div className="space-y-6">

                  <div className="text-center p-6 rounded-xl bg-muted">

                    <p className="text-4xl">{state.emoji}</p>
                    <p className="text-xl font-bold">{state.label}</p>

                    <p className="text-sm text-muted-foreground">
                      Burnout Score: {overallBurnout}%
                    </p>

                  </div>

                  <div className="space-y-3">

                    <div>
                      Emotional Exhaustion
                      <Progress value={scores.exhaustion}/>
                    </div>

                    <div>
                      Cynicism
                      <Progress value={scores.cynicism}/>
                    </div>

                    <div>
                      Personal Accomplishment
                      <Progress value={scores.accomplishment}/>
                    </div>

                  </div>

                  <div className="bg-primary/10 p-4 rounded-xl">

                    <p className="font-medium mb-2">Suggested Actions</p>

                    <ul className="text-sm list-disc list-inside space-y-1">
                      {state.tips.map((t,i)=>(
                        <li key={i}>{t}</li>
                      ))}
                    </ul>

                  </div>

                  <Button
                    variant="outline"
                    onClick={()=>{setShowResults(false);setAnswers({})}}
                    className="w-full"
                  >
                    Retake Test
                  </Button>

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>

        {/* Exam Tab */}

        <TabsContent value="exam">

          <div className="space-y-4">

            <div className="flex gap-2">

              {examPhases.map((p,i)=>(
                <Button
                  key={i}
                  variant={activePhase===i?"default":"outline"}
                  onClick={()=>setActivePhase(i)}
                >
                  {p.icon} {p.phase}
                </Button>
              ))}

            </div>

            <Card>

              <CardContent className="space-y-4 pt-6">

                {examPhases[activePhase].strategies.map((s,i)=>(
                  <div key={i} className="flex gap-3 p-3 bg-muted rounded-lg">

                    <ChevronRight className="w-4 h-4 mt-1"/>

                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>

                  </div>
                ))}

              </CardContent>

            </Card>

          </div>

        </TabsContent>

        {/* Semester Tab */}

        <TabsContent value="semester">

          <Card>

            <CardHeader>
              <CardTitle>Semester Emotional Trend</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              {semesterData.map((d,i)=>(
                <div key={i}>

                  <div className="flex justify-between text-xs">
                    <span>{d.month}</span>

                    <span>
                      😊 {Math.round(d.happiness)}%
                      {" "}
                      😰 {Math.round(d.stress)}%
                    </span>
                  </div>

                  <Progress value={d.happiness}/>

                </div>
              ))}

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>

    </div>

  );

};

export default StudentMode;