import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Globe, Shield, MapPin, ExternalLink, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';

interface CrisisInfo {
  type: 'war' | 'recession' | 'disaster' | 'political' | 'pandemic' | 'climate';
  icon: string;
  title: string;
  description: string;
  copingTips: string[];
  helplines: { name: string; number: string }[];
  articles: { title: string; url: string }[];
}

const GLOBAL_CRISES: Record<string, CrisisInfo[]> = {
  'India': [
    {
      type: 'recession',
      icon: '📉',
      title: 'Economic Uncertainty & Job Market Stress',
      description: 'Rising costs, layoffs in tech & startup sectors, and placement anxiety are affecting mental health across India.',
      copingTips: [
        'Focus on upskilling — free courses on NPTEL, Coursera',
        'Build an emergency fund, even small amounts help',
        'Talk to career counselors at your institution',
        'Limit doom-scrolling financial news to 15 min/day',
        'Connect with peers facing similar challenges'
      ],
      helplines: [
        { name: 'Vandrevala Foundation', number: '1860-2662-345' },
        { name: 'iCall (TISS)', number: '9152987821' },
        { name: 'NIMHANS', number: '080-46110007' },
      ],
      articles: [
        { title: 'Managing Financial Anxiety — WHO Guide', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response' },
        { title: 'Coping with Job Market Stress', url: 'https://www.apa.org/topics/healthy-workplaces/financial-stress' },
      ],
    },
    {
      type: 'political',
      icon: '🗳️',
      title: 'Political Polarization & Social Media Stress',
      description: 'Divisive political discourse and social media toxicity can increase anxiety, especially among students.',
      copingTips: [
        'Set boundaries on political discussions',
        'Curate your social media feed mindfully',
        'Practice media literacy — verify before reacting',
        'Engage in constructive community activities',
        'Take regular digital detox breaks'
      ],
      helplines: [
        { name: 'Vandrevala Foundation', number: '1860-2662-345' },
        { name: 'Snehi', number: '044-24640050' },
      ],
      articles: [
        { title: 'Social Media and Mental Health — APA', url: 'https://www.apa.org/topics/social-media-internet/health' },
      ],
    },
  ],
  'Ukraine': [
    {
      type: 'war',
      icon: '⚠️',
      title: 'Ongoing Armed Conflict',
      description: 'The war continues to affect millions. PTSD, displacement trauma, and grief are widespread.',
      copingTips: [
        'Seek safe shelters and stay informed via official channels',
        'Practice grounding techniques (5-4-3-2-1 method)',
        'Connect with community support groups',
        'Allow yourself to grieve — it\'s a natural response',
        'Limit exposure to graphic war content'
      ],
      helplines: [
        { name: 'Lifeline Ukraine', number: '7333' },
        { name: 'WHO Mental Health Support', number: '+380-800-500-335' },
      ],
      articles: [
        { title: 'WHO — Mental Health in Emergencies', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-in-emergencies' },
      ],
    },
  ],
  'Palestine': [
    {
      type: 'war',
      icon: '⚠️',
      title: 'Humanitarian Crisis & Conflict',
      description: 'Ongoing conflict has caused widespread trauma, displacement, and loss. Solidarity and support are vital.',
      copingTips: [
        'Seek peer and community emotional support',
        'Use grounding exercises to manage trauma responses',
        'Maintain daily routines as much as possible',
        'Connect with humanitarian aid organizations',
        'Practice collective healing and storytelling'
      ],
      helplines: [
        { name: 'Palestine Red Crescent', number: '101' },
        { name: 'UNRWA Hotline', number: '+972-2-589-0400' },
      ],
      articles: [
        { title: 'Mental Health in Conflict Zones — MSF', url: 'https://www.msf.org/mental-health' },
      ],
    },
  ],
  'United States': [
    {
      type: 'recession',
      icon: '📉',
      title: 'Economic Downturn & Cost of Living Crisis',
      description: 'Inflation, housing costs, and student debt are creating financial stress across demographics.',
      copingTips: [
        'Use budgeting apps to track spending',
        'Access free mental health resources (988 Lifeline)',
        'Join community support groups',
        'Practice stress management daily',
        'Seek financial counseling services'
      ],
      helplines: [
        { name: '988 Suicide & Crisis Lifeline', number: '988' },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741' },
        { name: 'SAMHSA Helpline', number: '1-800-662-4357' },
      ],
      articles: [
        { title: 'Financial Stress & Mental Health — APA', url: 'https://www.apa.org/topics/healthy-workplaces/financial-stress' },
      ],
    },
    {
      type: 'political',
      icon: '🗳️',
      title: 'Political Division & Social Unrest',
      description: 'Increasing polarization and social tensions are contributing to collective anxiety.',
      copingTips: [
        'Limit news consumption to trusted sources',
        'Engage in local community building',
        'Practice empathy across political lines',
        'Focus on actions within your control',
        'Seek therapy if feeling overwhelmed'
      ],
      helplines: [
        { name: '988 Suicide & Crisis Lifeline', number: '988' },
      ],
      articles: [
        { title: 'Coping with Political Stress — APA', url: 'https://www.apa.org/topics/election-stress' },
      ],
    },
  ],
  'United Kingdom': [
    {
      type: 'recession',
      icon: '📉',
      title: 'Cost of Living Crisis',
      description: 'Rising energy costs and inflation are impacting financial wellbeing and mental health.',
      copingTips: [
        'Access free NHS mental health services',
        'Contact Citizens Advice for financial support',
        'Join local community support networks',
        'Practice mindfulness to manage worry',
        'Use food banks without shame — they exist to help'
      ],
      helplines: [
        { name: 'Samaritans', number: '116 123' },
        { name: 'Mind', number: '0300 123 3393' },
        { name: 'SHOUT', number: 'Text SHOUT to 85258' },
      ],
      articles: [
        { title: 'Cost of Living & Mental Health — Mind UK', url: 'https://www.mind.org.uk/information-support/tips-for-everyday-living/money-and-mental-health/' },
      ],
    },
  ],
  'Sudan': [
    {
      type: 'war',
      icon: '⚠️',
      title: 'Civil Conflict & Displacement',
      description: 'The ongoing conflict has displaced millions and created a humanitarian emergency.',
      copingTips: [
        'Seek safe zones and refugee assistance',
        'Stay connected with family and community',
        'Practice trauma-informed breathing exercises',
        'Access UNHCR and Red Cross resources',
        'Allow yourself to process grief'
      ],
      helplines: [
        { name: 'UNHCR Sudan', number: '+249-187-086-400' },
        { name: 'Sudan Red Crescent', number: '+249-183-784-853' },
      ],
      articles: [
        { title: 'Displacement & Mental Health — UNHCR', url: 'https://www.unhcr.org/mental-health-psychosocial-support.html' },
      ],
    },
  ],
  'Myanmar': [
    {
      type: 'political',
      icon: '⚠️',
      title: 'Political Instability & Civil Unrest',
      description: 'Military governance and civil resistance have created widespread anxiety and displacement.',
      copingTips: [
        'Stay informed through verified channels only',
        'Practice safety planning with trusted contacts',
        'Use encrypted communication for safety',
        'Access international support organizations',
        'Practice self-care despite the circumstances'
      ],
      helplines: [
        { name: 'Myanmar Red Cross', number: '+95-1-383-680' },
      ],
      articles: [
        { title: 'Mental Health in Political Crisis — WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-in-emergencies' },
      ],
    },
  ],
};

// Default global crises that affect everyone
const GLOBAL_ISSUES: CrisisInfo[] = [
  {
    type: 'climate',
    icon: '🌍',
    title: 'Climate Anxiety & Eco-Grief',
    description: 'Rising global temperatures, natural disasters, and environmental degradation are causing widespread eco-anxiety.',
    copingTips: [
      'Channel anxiety into small, actionable steps (recycling, planting)',
      'Connect with climate action communities',
      'Limit catastrophic news consumption',
      'Practice grounding in nature',
      'Remember: collective action matters more than individual guilt'
    ],
    helplines: [
      { name: 'Climate Psychology Alliance', number: 'climatepsychologyalliance.org' },
    ],
    articles: [
      { title: 'Eco-Anxiety — APA Guide', url: 'https://www.apa.org/news/press/releases/2017/03/mental-health-climate.pdf' },
    ],
  },
  {
    type: 'pandemic',
    icon: '🦠',
    title: 'Post-Pandemic Mental Health',
    description: 'Long-term effects of COVID-19 including social isolation, grief, and health anxiety continue to affect wellbeing.',
    copingTips: [
      'Rebuild social connections gradually',
      'Acknowledge pandemic grief without judgment',
      'Maintain routines that provide structure',
      'Seek professional help for persistent symptoms',
      'Practice self-compassion — everyone is recovering differently'
    ],
    helplines: [
      { name: 'WHO Support Line', number: 'who.int/mental-health' },
    ],
    articles: [
      { title: 'Post-Pandemic Mental Health — WHO', url: 'https://www.who.int/campaigns/connecting-for-mental-health' },
    ],
  },
];

const CrisisSupport = () => {
  const { userData } = useUser();
  const [expandedCrisis, setExpandedCrisis] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const userCountry = userData?.country || 'India';

  const localCrises = GLOBAL_CRISES[userCountry] || [];
  const allCrises = [...localCrises, ...GLOBAL_ISSUES];
  const displayCrises = showAll ? allCrises : allCrises.slice(0, 2);

  const getTypeColor = (type: CrisisInfo['type']) => {
    switch (type) {
      case 'war': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'recession': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      case 'disaster': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'political': return 'bg-lavender/10 text-lavender-foreground border-lavender/20';
      case 'pandemic': return 'bg-primary/10 text-primary border-primary/20';
      case 'climate': return 'bg-sage/10 text-sage-foreground border-sage/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-destructive/10 via-secondary/10 to-primary/10 pb-4">
        <CardTitle className="font-display text-lg flex items-center gap-2 text-foreground">
          <Shield className="w-5 h-5 text-primary" />
          Crisis Support & Awareness
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>Showing for: <strong className="text-foreground">{userCountry}</strong></span>
          <Badge variant="outline" className="text-[10px]">
            <Globe className="w-2.5 h-2.5 mr-1" />
            + Global
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {displayCrises.map((crisis, idx) => {
          const key = `${crisis.type}-${idx}`;
          const isExpanded = expandedCrisis === key;

          return (
            <div key={key} className="rounded-xl border border-border/40 overflow-hidden transition-all">
              <button
                onClick={() => setExpandedCrisis(isExpanded ? null : key)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-xl shrink-0">{crisis.icon}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{crisis.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={`text-[10px] px-1.5 py-0 ${getTypeColor(crisis.type)}`}>
                      {crisis.type}
                    </Badge>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-4 space-y-3 animate-fade-in">
                  <p className="text-xs text-muted-foreground leading-relaxed">{crisis.description}</p>

                  {/* Coping Tips */}
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-primary" />
                      Coping Strategies
                    </p>
                    <ul className="space-y-1.5">
                      {crisis.copingTips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Helplines */}
                  <div className="bg-destructive/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-destructive" />
                      Helplines
                    </p>
                    <div className="space-y-1.5">
                      {crisis.helplines.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => h.number.includes('.') ? window.open(`https://${h.number}`, '_blank') : window.open(`tel:${h.number}`, '_self')}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-background/60 hover:bg-background transition-colors text-xs"
                        >
                          <span className="text-foreground font-medium">{h.name}</span>
                          <span className="text-primary font-mono">{h.number}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Articles */}
                  {crisis.articles.length > 0 && (
                    <div className="space-y-1.5">
                      {crisis.articles.map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-foreground"
                        >
                          <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{a.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {allCrises.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll ? 'Show Less' : `Show All ${allCrises.length} Topics`}
            {showAll ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        )}

        <div className="text-center pt-2">
          <p className="text-[10px] text-muted-foreground">
            💚 If you're in immediate danger, please call your local emergency services.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrisisSupport;
