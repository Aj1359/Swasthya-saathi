import { HeartPulse, CheckCircle2, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const preventionData = [
  {
    type: "Anxiety",
    icon: "🌀",
    prevention: [
      "Limit caffeine intake past 2 PM.",
      "Engage in 15 mins of daily breathing exercises.",
      "Prioritize sunlight exposure within 30 minutes of waking.",
      "Reduce social media scrolling before bed to prevent cognitive overload."
    ],
    management: [
      "Use the 5-4-3-2-1 grounding technique during panic.",
      "Challenge cognitive distortions with real evidence.",
      "Physiological sigh: double inhale and long exhale."
    ]
  },
  {
    type: "Depression",
    icon: "🌧️",
    prevention: [
      "Maintain a strict circadian rhythm (sleep/wake times).",
      "Engage in behavioral activation—do things even when you don't feel like it.",
      "Stay connected with at least one friend deeply.",
      "Set tiny, achievable goals every day."
    ],
    management: [
      "Acknowledge the feeling without judgment.",
      "Engage in immediate, low-barrier physical movement (e.g. 5-min walk).",
      "Consult a healthcare professional if low mood persists > 2 weeks."
    ]
  },
  {
    type: "Burnout",
    icon: "🔥",
    prevention: [
      "Implement the Pomodoro technique (25/5).",
      "Set firm work/study boundaries.",
      "Engage in 'non-productive' hobbies strictly for joy.",
      "Take 10-minute micro-breaks without screens."
    ],
    management: [
      "Take time off to completely disconnect.",
      "Delegate tasks immediately.",
      "Reassess and drop low-priority commitments."
    ]
  }
];

const PreventionTab = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Prevention & Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Tools and strategies to shield your mental well-being before the storm arrives, and manage it when it does.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {preventionData.map((item, idx) => (
          <Card key={idx} className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span> {item.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" /> Prevention
                </h4>
                <ul className="space-y-2">
                  {item.prevention.map((prev, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{prev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 mt-4">
                <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Management
                </h4>
                <ul className="space-y-2">
                  {item.management.map((mgmt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{mgmt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Box */}
      <div className="mt-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Need Immediate Help?</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
          Prevention and management tools are meant for everyday maintenance. If things feel out of control, professional help is the strongest step.
        </p>
        <Button variant="destructive" className="mx-auto flex gap-2 w-full md:w-auto" onClick={() => window.open('tel:+919152987821', '_self')}>
          Call Crisis Helpline: 9152987821
        </Button>
      </div>

    </div>
  );
};

export default PreventionTab;
