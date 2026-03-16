import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Globe, Shield, MapPin, ExternalLink, ChevronDown, ChevronUp, Heart, Radio, Newspaper } from 'lucide-react';
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
      type: 'recession', icon: '📉', title: 'Economic Uncertainty & Job Market Stress',
      description: 'Rising costs, layoffs in tech & startup sectors, and placement anxiety are affecting mental health across India.',
      copingTips: ['Focus on upskilling — free courses on NPTEL, Coursera', 'Build an emergency fund, even small amounts help', 'Talk to career counselors at your institution', 'Limit doom-scrolling financial news to 15 min/day', 'Connect with peers facing similar challenges'],
      helplines: [{ name: 'Vandrevala Foundation', number: '1860-2662-345' }, { name: 'iCall (TISS)', number: '9152987821' }, { name: 'NIMHANS', number: '080-46110007' }],
      articles: [{ title: 'Managing Financial Anxiety — WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response' }, { title: 'Coping with Job Market Stress', url: 'https://www.apa.org/topics/healthy-workplaces/financial-stress' }],
    },
    {
      type: 'political', icon: '🗳️', title: 'Political Polarization & Social Media Stress',
      description: 'Divisive political discourse and social media toxicity can increase anxiety, especially among students.',
      copingTips: ['Set boundaries on political discussions', 'Curate your social media feed mindfully', 'Practice media literacy — verify before reacting', 'Engage in constructive community activities', 'Take regular digital detox breaks'],
      helplines: [{ name: 'Vandrevala Foundation', number: '1860-2662-345' }, { name: 'Snehi', number: '044-24640050' }],
      articles: [{ title: 'Social Media and Mental Health — APA', url: 'https://www.apa.org/topics/social-media-internet/health' }],
    },
  ],
  'Ukraine': [
    {
      type: 'war', icon: '⚠️', title: 'Ongoing Armed Conflict',
      description: 'The war continues to affect millions. PTSD, displacement trauma, and grief are widespread.',
      copingTips: ['Seek safe shelters and stay informed via official channels', 'Practice grounding techniques (5-4-3-2-1 method)', 'Connect with community support groups', 'Allow yourself to grieve — it\'s a natural response', 'Limit exposure to graphic war content'],
      helplines: [{ name: 'Lifeline Ukraine', number: '7333' }, { name: 'WHO Mental Health', number: '+380-800-500-335' }],
      articles: [{ title: 'WHO — Mental Health in Emergencies', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-in-emergencies' }],
    },
  ],
  'Palestine': [
    {
      type: 'war', icon: '⚠️', title: 'Humanitarian Crisis & Conflict',
      description: 'Ongoing conflict has caused widespread trauma, displacement, and loss.',
      copingTips: ['Seek peer and community emotional support', 'Use grounding exercises to manage trauma responses', 'Maintain daily routines as much as possible', 'Connect with humanitarian aid organizations', 'Practice collective healing and storytelling'],
      helplines: [{ name: 'Palestine Red Crescent', number: '101' }, { name: 'UNRWA Hotline', number: '+972-2-589-0400' }],
      articles: [{ title: 'Mental Health in Conflict Zones — MSF', url: 'https://www.msf.org/mental-health' }],
    },
  ],
  'United States': [
    {
      type: 'recession', icon: '📉', title: 'Economic Downturn & Cost of Living Crisis',
      description: 'Inflation, housing costs, and student debt are creating financial stress across demographics.',
      copingTips: ['Use budgeting apps to track spending', 'Access free mental health resources (988 Lifeline)', 'Join community support groups', 'Practice stress management daily', 'Seek financial counseling services'],
      helplines: [{ name: '988 Suicide & Crisis Lifeline', number: '988' }, { name: 'Crisis Text Line', number: 'Text HOME to 741741' }, { name: 'SAMHSA Helpline', number: '1-800-662-4357' }],
      articles: [{ title: 'Financial Stress & Mental Health — APA', url: 'https://www.apa.org/topics/healthy-workplaces/financial-stress' }],
    },
    {
      type: 'political', icon: '🗳️', title: 'Political Division & Social Unrest',
      description: 'Increasing polarization and social tensions are contributing to collective anxiety.',
      copingTips: ['Limit news consumption to trusted sources', 'Engage in local community building', 'Practice empathy across political lines', 'Focus on actions within your control', 'Seek therapy if feeling overwhelmed'],
      helplines: [{ name: '988 Suicide & Crisis Lifeline', number: '988' }],
      articles: [{ title: 'Coping with Political Stress — APA', url: 'https://www.apa.org/topics/election-stress' }],
    },
  ],
  'United Kingdom': [
    {
      type: 'recession', icon: '📉', title: 'Cost of Living Crisis',
      description: 'Rising energy costs and inflation are impacting financial wellbeing and mental health.',
      copingTips: ['Access free NHS mental health services', 'Contact Citizens Advice for financial support', 'Join local community support networks', 'Practice mindfulness to manage worry', 'Use food banks without shame — they exist to help'],
      helplines: [{ name: 'Samaritans', number: '116 123' }, { name: 'Mind', number: '0300 123 3393' }, { name: 'SHOUT', number: 'Text SHOUT to 85258' }],
      articles: [{ title: 'Cost of Living & Mental Health — Mind UK', url: 'https://www.mind.org.uk/information-support/tips-for-everyday-living/money-and-mental-health/' }],
    },
  ],
  'Sudan': [
    {
      type: 'war', icon: '⚠️', title: 'Civil Conflict & Displacement',
      description: 'The ongoing conflict has displaced millions and created a humanitarian emergency.',
      copingTips: ['Seek safe zones and refugee assistance', 'Stay connected with family and community', 'Practice trauma-informed breathing exercises', 'Access UNHCR and Red Cross resources', 'Allow yourself to process grief'],
      helplines: [{ name: 'UNHCR Sudan', number: '+249-187-086-400' }, { name: 'Sudan Red Crescent', number: '+249-183-784-853' }],
      articles: [{ title: 'Displacement & Mental Health — UNHCR', url: 'https://www.unhcr.org/mental-health-psychosocial-support.html' }],
    },
  ],
  'Myanmar': [
    {
      type: 'political', icon: '⚠️', title: 'Political Instability & Civil Unrest',
      description: 'Military governance and civil resistance have created widespread anxiety and displacement.',
      copingTips: ['Stay informed through verified channels only', 'Practice safety planning with trusted contacts', 'Use encrypted communication for safety', 'Access international support organizations', 'Practice self-care despite the circumstances'],
      helplines: [{ name: 'Myanmar Red Cross', number: '+95-1-383-680' }],
      articles: [{ title: 'Mental Health in Political Crisis — WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-in-emergencies' }],
    },
  ],
  'Germany': [
    {
      type: 'recession', icon: '📉', title: 'Industrial Slowdown & Energy Transition Stress',
      description: 'Economic restructuring, energy price hikes, and job insecurity in manufacturing sectors are raising anxiety levels.',
      copingTips: ['Access free counseling through Krankenkasse', 'Explore retraining programs via Agentur für Arbeit', 'Join Selbsthilfegruppen (self-help groups)', 'Practice structured daily routines', 'Limit media consumption on economic doom scenarios'],
      helplines: [{ name: 'Telefonseelsorge', number: '0800 111 0 111' }, { name: 'Deutsche Depressionshilfe', number: '0800 33 44 533' }],
      articles: [{ title: 'Mental Health Support in Germany', url: 'https://www.deutsche-depressionshilfe.de/en' }],
    },
  ],
  'Brazil': [
    {
      type: 'political', icon: '🗳️', title: 'Political Polarization & Social Inequality',
      description: 'Deep political divisions, misinformation, and rising inequality are fueling collective stress and anxiety.',
      copingTips: ['Limit exposure to polarizing content on social media', 'Engage in community solidarity activities', 'Practice breathing exercises for stress relief', 'Seek free SUS mental health services', 'Focus on local community building over national division'],
      helplines: [{ name: 'CVV (Centro de Valorização da Vida)', number: '188' }, { name: 'CAPS Mental Health', number: 'caps.saude.gov.br' }],
      articles: [{ title: 'Mental Health in Latin America — PAHO', url: 'https://www.paho.org/en/topics/mental-health' }],
    },
    {
      type: 'climate', icon: '🌊', title: 'Climate Disasters & Flooding',
      description: 'Devastating floods and climate events in southern Brazil have displaced thousands and caused widespread trauma.',
      copingTips: ['Seek emergency shelter and contact Civil Defense', 'Connect with disaster relief organizations', 'Practice grounding exercises during crisis moments', 'Allow yourself to grieve losses', 'Access community mutual aid networks'],
      helplines: [{ name: 'CVV', number: '188' }, { name: 'Defesa Civil', number: '199' }],
      articles: [{ title: 'Climate Disasters & Mental Health — WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health' }],
    },
  ],
  'Nigeria': [
    {
      type: 'recession', icon: '📉', title: 'Currency Crisis & Inflation',
      description: 'Naira devaluation, rising food prices, and fuel subsidy removal are causing severe financial stress.',
      copingTips: ['Join community savings groups (Ajo/Esusu)', 'Explore digital skills for alternative income', 'Access NGO-provided mental health resources', 'Practice gratitude and stress management', 'Connect with faith-based support networks'],
      helplines: [{ name: 'MANI (Mentally Aware Nigeria)', number: '+234-809-111-6264' }, { name: 'Suicide Prevention Nigeria', number: '+234-806-210-6493' }],
      articles: [{ title: 'Economic Stress & Mental Health — Africa CDC', url: 'https://africacdc.org/mental-health/' }],
    },
    {
      type: 'war', icon: '⚠️', title: 'Security Challenges & Displacement',
      description: 'Ongoing security threats, banditry, and insurgency in the north have displaced millions and caused collective trauma.',
      copingTips: ['Stay informed through official security channels', 'Connect with IDP camp support services', 'Practice community solidarity and mutual support', 'Access UNHCR and Red Cross resources', 'Seek trauma counseling when accessible'],
      helplines: [{ name: 'NEMA (Emergency)', number: '0800-2255-6362' }, { name: 'MANI', number: '+234-809-111-6264' }],
      articles: [{ title: 'Displacement Trauma — UNHCR', url: 'https://www.unhcr.org/mental-health-psychosocial-support.html' }],
    },
  ],
  'China': [
    {
      type: 'recession', icon: '📉', title: 'Youth Unemployment & Economic Pressure',
      description: 'Record youth unemployment, property market stress, and intense academic/work competition are creating widespread anxiety.',
      copingTips: ['Practice self-compassion — external pressures are real', 'Explore alternative career paths and gig opportunities', 'Join online peer support communities', 'Set boundaries on comparison with peers', 'Take breaks from the "996" work culture when possible'],
      helplines: [{ name: 'Beijing Crisis Center', number: '010-82951332' }, { name: 'Lifeline Shanghai', number: '021-62785533' }],
      articles: [{ title: 'Youth Mental Health — Lancet', url: 'https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(22)00036-6/fulltext' }],
    },
  ],
  'Japan': [
    {
      type: 'recession', icon: '📉', title: 'Economic Stagnation & Work Culture Stress',
      description: 'Persistent deflation, overwork culture (karoshi), and social isolation (hikikomori) continue to impact mental health.',
      copingTips: ['Seek support from local community centers', 'Use "Yorisoi Hotline" for free counseling', 'Practice ikigai (purpose-finding) exercises', 'Set work boundaries — leave on time', 'Connect with online communities if socially isolated'],
      helplines: [{ name: 'Yorisoi Hotline', number: '0120-279-338' }, { name: 'TELL Lifeline', number: '03-5774-0992' }],
      articles: [{ title: 'Work Culture & Mental Health — WHO Japan', url: 'https://www.who.int/japan/news/detail/10-10-2023-world-mental-health-day-2023' }],
    },
  ],
  'Australia': [
    {
      type: 'climate', icon: '🔥', title: 'Bushfires, Drought & Climate Anxiety',
      description: 'Recurring natural disasters, extreme heat, and drought are causing eco-grief and displacement trauma across communities.',
      copingTips: ['Access free bushfire recovery mental health programs', 'Connect with Beyond Blue for free support', 'Practice nature immersion when safe', 'Join community rebuilding efforts', 'Allow space for climate grief — it\'s valid'],
      helplines: [{ name: 'Lifeline Australia', number: '13 11 14' }, { name: 'Beyond Blue', number: '1300 22 4636' }, { name: 'Kids Helpline', number: '1800 55 1800' }],
      articles: [{ title: 'Climate & Mental Health — Beyond Blue', url: 'https://www.beyondblue.org.au/the-facts/natural-disaster-mental-health' }],
    },
    {
      type: 'recession', icon: '📉', title: 'Housing Affordability Crisis',
      description: 'Skyrocketing housing costs, rental stress, and cost-of-living pressures are contributing to financial anxiety.',
      copingTips: ['Access Centrelink financial counseling', 'Explore shared housing and co-living options', 'Use budgeting tools to track expenses', 'Seek rental assistance programs', 'Practice self-compassion about financial struggles'],
      helplines: [{ name: 'Lifeline', number: '13 11 14' }, { name: 'Financial Counselling Australia', number: '1800 007 007' }],
      articles: [{ title: 'Housing Stress & Wellbeing', url: 'https://www.aihw.gov.au/reports/australias-welfare/housing-affordability' }],
    },
  ],
  'Canada': [
    {
      type: 'recession', icon: '📉', title: 'Housing Crisis & Inflation',
      description: 'Unaffordable housing, rising costs, and stagnant wages are creating financial distress, especially for young people.',
      copingTips: ['Access free counseling through provincial health services', 'Explore government housing assistance programs', 'Join community mutual aid networks', 'Practice financial wellness planning', 'Limit social comparison on housing milestones'],
      helplines: [{ name: 'Crisis Services Canada', number: '1-833-456-4566' }, { name: 'Kids Help Phone', number: '1-800-668-6868' }, { name: 'Hope for Wellness (Indigenous)', number: '1-855-242-3310' }],
      articles: [{ title: 'Financial Stress & Mental Health — CAMH', url: 'https://www.camh.ca/en/health-info/mental-health-and-covid-19/financial-stress' }],
    },
  ],
  'South Korea': [
    {
      type: 'political', icon: '🗳️', title: 'Geopolitical Tensions & Social Pressure',
      description: 'North Korea tensions, intense academic competition, and social conformity pressures contribute to high stress and suicide rates.',
      copingTips: ['Access free counseling at community mental health centers', 'Practice self-compassion over perfectionism', 'Join peer support communities online', 'Set boundaries on study/work hours', 'Explore creative outlets for expression'],
      helplines: [{ name: 'Korea Suicide Prevention Center', number: '1393' }, { name: 'Mental Health Crisis Line', number: '1577-0199' }],
      articles: [{ title: 'Mental Health in South Korea — WHO', url: 'https://www.who.int/countries/kor' }],
    },
  ],
  'Afghanistan': [
    {
      type: 'war', icon: '⚠️', title: 'Ongoing Conflict & Humanitarian Crisis',
      description: 'Decades of conflict, political instability, and restrictions on women\'s rights have caused widespread trauma.',
      copingTips: ['Seek support from UNHCR and IRC when accessible', 'Stay connected with trusted family and community members', 'Practice breathing exercises for trauma symptoms', 'Access radio-based mental health programs', 'Maintain daily routines for stability'],
      helplines: [{ name: 'Afghanistan Red Crescent', number: '+93-20-230-1676' }, { name: 'UNHCR Afghanistan', number: '+93-79-960-4444' }],
      articles: [{ title: 'Mental Health in Crisis — MSF', url: 'https://www.msf.org/mental-health' }],
    },
  ],
  'Syria': [
    {
      type: 'war', icon: '⚠️', title: 'Post-Conflict Reconstruction & Displacement',
      description: 'Years of civil war have left deep psychological scars. Displacement, loss, and ongoing instability persist.',
      copingTips: ['Connect with UNHCR for refugee support services', 'Practice grounding techniques daily', 'Engage in community rebuilding activities', 'Access telecounseling services when available', 'Focus on small daily achievements'],
      helplines: [{ name: 'Syria Civil Defence', number: '113' }, { name: 'UNHCR Syria', number: '+963-11-331-7755' }],
      articles: [{ title: 'Mental Health After Conflict — WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-in-emergencies' }],
    },
  ],
  'Turkey': [
    {
      type: 'disaster', icon: '🏚️', title: 'Earthquake Recovery & Economic Stress',
      description: 'The devastating 2023 earthquakes and ongoing inflation are creating compound mental health challenges.',
      copingTips: ['Access AFAD disaster recovery support', 'Seek free psychological first aid services', 'Practice community solidarity and mutual support', 'Allow yourself to process grief and trauma', 'Use relaxation techniques for earthquake anxiety'],
      helplines: [{ name: 'ALO 182 (Mental Health)', number: '182' }, { name: 'AFAD Emergency', number: '122' }],
      articles: [{ title: 'Natural Disaster Recovery — WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-in-emergencies' }],
    },
  ],
};

const GLOBAL_ISSUES: CrisisInfo[] = [
  {
    type: 'climate', icon: '🌍', title: 'Climate Anxiety & Eco-Grief',
    description: 'Rising global temperatures, natural disasters, and environmental degradation are causing widespread eco-anxiety.',
    copingTips: ['Channel anxiety into small, actionable steps (recycling, planting)', 'Connect with climate action communities', 'Limit catastrophic news consumption', 'Practice grounding in nature', 'Remember: collective action matters more than individual guilt'],
    helplines: [{ name: 'Climate Psychology Alliance', number: 'climatepsychologyalliance.org' }],
    articles: [{ title: 'Eco-Anxiety — APA Guide', url: 'https://www.apa.org/news/press/releases/2017/03/mental-health-climate.pdf' }],
  },
  {
    type: 'pandemic', icon: '🦠', title: 'Post-Pandemic Mental Health',
    description: 'Long-term effects of COVID-19 including social isolation, grief, and health anxiety continue to affect wellbeing.',
    copingTips: ['Rebuild social connections gradually', 'Acknowledge pandemic grief without judgment', 'Maintain routines that provide structure', 'Seek professional help for persistent symptoms', 'Practice self-compassion — everyone is recovering differently'],
    helplines: [{ name: 'WHO Support Line', number: 'who.int/mental-health' }],
    articles: [{ title: 'Post-Pandemic Mental Health — WHO', url: 'https://www.who.int/campaigns/connecting-for-mental-health' }],
  },
  {
    type: 'recession', icon: '📊', title: 'Global Recession Fears & AI Job Displacement',
    description: 'Rapid AI advancement, global economic uncertainty, and fears of job displacement are creating anxiety about the future of work.',
    copingTips: ['Learn AI literacy — understand rather than fear the technology', 'Focus on uniquely human skills: creativity, empathy, leadership', 'Build financial resilience with emergency savings', 'Seek career counseling for future-proofing your skills', 'Practice present-moment mindfulness over future anxiety'],
    helplines: [{ name: 'International Association for Suicide Prevention', number: 'iasp.info/resources/Crisis_Centres' }],
    articles: [{ title: 'AI, Work & Mental Health — World Economic Forum', url: 'https://www.weforum.org/reports/the-future-of-jobs-report-2023' }],
  },
];

interface NewsItem {
  title: string;
  region: string;
  type: string;
  date: string;
  impact: string;
}

const LIVE_CRISIS_NEWS: NewsItem[] = [
  { title: 'Russia-Ukraine war enters 4th year — mental health toll rises', region: 'Eastern Europe', type: 'war', date: 'Ongoing', impact: 'Millions displaced, widespread PTSD reported' },
  { title: 'Gaza humanitarian crisis deepens amid conflict', region: 'Middle East', type: 'war', date: 'Ongoing', impact: 'Severe trauma among civilians, children most affected' },
  { title: 'Sudan civil war creates world\'s largest displacement crisis', region: 'East Africa', type: 'war', date: 'Ongoing', impact: '10M+ displaced, famine conditions in multiple states' },
  { title: 'Global AI disruption sparks mass job anxiety', region: 'Worldwide', type: 'recession', date: '2025-2026', impact: 'Tech layoffs continue, career anxiety at all-time high' },
  { title: 'Climate disasters intensify — record heat waves worldwide', region: 'Global', type: 'climate', date: '2025-2026', impact: 'Eco-anxiety rising, displacement from extreme weather events' },
  { title: 'South Korea political turmoil after martial law declaration', region: 'East Asia', type: 'political', date: 'Recent', impact: 'Social unrest and collective anxiety among citizens' },
  { title: 'Afghanistan women face mental health crisis under restrictions', region: 'Central Asia', type: 'political', date: 'Ongoing', impact: 'Depression and anxiety rates soar among women and girls' },
  { title: 'Turkey & Syria earthquake survivors face long-term PTSD', region: 'Middle East', type: 'disaster', date: 'Ongoing recovery', impact: 'Hundreds of thousands still in temporary shelters' },
  { title: 'Nigeria currency crisis deepens food insecurity', region: 'West Africa', type: 'recession', date: '2025', impact: 'Financial stress affecting 100M+ people' },
  { title: 'Brazil flooding displaces thousands in Rio Grande do Sul', region: 'South America', type: 'climate', date: 'Recurring', impact: 'Community trauma and displacement continue' },
];

const CrisisSupport = () => {
  const { userData } = useUser();
  const [expandedCrisis, setExpandedCrisis] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showNews, setShowNews] = useState(false);

  const userCountry = userData?.country || 'India';
  const localCrises = GLOBAL_CRISES[userCountry] || [];
  const allCrises = [...localCrises, ...GLOBAL_ISSUES];
  const displayCrises = showAll ? allCrises : allCrises.slice(0, 2);

  const getTypeColor = (type: CrisisInfo['type'] | string) => {
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
          Crisis Support & Global Awareness
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
        {/* Live Crisis News Feed */}
        <div className="rounded-xl border border-destructive/20 overflow-hidden">
          <button
            onClick={() => setShowNews(!showNews)}
            className="w-full p-3 flex items-center gap-3 bg-destructive/5 hover:bg-destructive/10 transition-colors"
          >
            <Radio className="w-4 h-4 text-destructive animate-pulse" />
            <span className="text-sm font-semibold text-foreground flex-1 text-left">Live Global Crisis Feed</span>
            <Badge className="bg-destructive/20 text-destructive text-[10px]">{LIVE_CRISIS_NEWS.length} updates</Badge>
            {showNews ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showNews && (
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {LIVE_CRISIS_NEWS.map((news, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-background/60 border border-border/30 space-y-1">
                  <div className="flex items-start gap-2">
                    <Newspaper className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-foreground leading-snug">{news.title}</p>
                  </div>
                  <div className="flex items-center gap-2 pl-5.5">
                    <Badge className={`text-[9px] px-1.5 py-0 ${getTypeColor(news.type)}`}>{news.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{news.region}</span>
                    <span className="text-[10px] text-muted-foreground">• {news.date}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-5.5">{news.impact}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crisis Topics */}
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
                  <Badge className={`text-[10px] px-1.5 py-0 mt-0.5 ${getTypeColor(crisis.type)}`}>{crisis.type}</Badge>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-4 space-y-3 animate-fade-in">
                  <p className="text-xs text-muted-foreground leading-relaxed">{crisis.description}</p>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-primary" /> Coping Strategies
                    </p>
                    <ul className="space-y-1.5">
                      {crisis.copingTips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-destructive/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-destructive" /> Helplines
                    </p>
                    <div className="space-y-1.5">
                      {crisis.helplines.map((h, i) => (
                        <button key={i} onClick={() => h.number.includes('.') ? window.open(`https://${h.number}`, '_blank') : window.open(`tel:${h.number}`, '_self')}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-background/60 hover:bg-background transition-colors text-xs">
                          <span className="text-foreground font-medium">{h.name}</span>
                          <span className="text-primary font-mono">{h.number}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {crisis.articles.length > 0 && (
                    <div className="space-y-1.5">
                      {crisis.articles.map((a, i) => (
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-foreground">
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
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-muted-foreground hover:text-foreground">
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
