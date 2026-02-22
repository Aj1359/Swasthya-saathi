import { useState } from 'react';
import { Quote, Heart, Brain, ExternalLink, FileText, Sparkles, ChevronRight, Star, Play, Youtube, X, Clock, BookOpen, Lightbulb, ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Article {
  id: number;
  category: string;
  tag: string;
  tagColor: string;
  title: string;
  excerpt: string;
  image: string;
  readTime: string;
  featured: boolean;
  link: string;
  pdf: string | null;
  expert: string | null;
  synopsis: {
    intro: string;
    sections: { heading: string; body: string }[];
    keyTakeaways: string[];
  };
}

// ── Article Data ──────────────────────────────────────────────────────────────

const articles: Article[] = [
  {
    id: 1, category: 'depression', tag: 'Depression', tagColor: '#6366f1', featured: false,
    title: 'The Hidden Face of High-Functioning Depression',
    excerpt: 'You can smile, hold a job, seem fine — and still be drowning inside.',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80',
    readTime: '7 min read', link: 'https://www.verywellmind.com/high-functioning-depression-5323687', pdf: null, expert: null,
    synopsis: {
      intro: 'High-functioning depression is one of the most misunderstood mental health conditions. Unlike classic depression, it doesn\'t stop you from going to work, showing up for friends, or even smiling. But underneath, the exhaustion and emptiness are just as real — and often harder to treat because nobody, including the person themselves, recognizes it.',
      sections: [
        { heading: 'What does it actually look like?', body: 'People with high-functioning depression often appear successful and together from the outside. They meet deadlines, maintain relationships, and keep their commitments. But internally, they experience persistent sadness, a sense of emptiness, low self-worth, and a feeling that nothing brings genuine joy — a symptom called anhedonia. They may describe feeling like they\'re "going through the motions" or watching their life from behind glass.' },
        { heading: 'Why is it so hard to recognize?', body: 'Because high-functioning depression doesn\'t match our cultural image of someone who is depressed — someone who can\'t get out of bed — it goes undiagnosed for years. Sufferers often minimize their experience ("other people have it worse"), feel shame about being sad "despite having a good life," or genuinely don\'t know that what they feel is a treatable condition rather than just their personality.' },
        { heading: 'The danger of leaving it untreated', body: 'The ability to function despite depression can actually delay help-seeking by years. Over time, the condition can worsen, erode relationships from the inside, and significantly increase the risk of a more severe depressive episode or burnout. Chronic mild depression (dysthymia) lasting 2+ years has serious long-term health consequences.' },
        { heading: 'What actually helps?', body: 'Therapy — specifically CBT (Cognitive Behavioural Therapy) and compassion-focused therapy — has strong evidence behind it. So does behavioral activation: intentionally scheduling small pleasurable activities even when you don\'t feel like it, to break the withdrawal cycle. Lifestyle factors (sleep consistency, exercise, sunlight) move the needle more than most people expect. Medication can be appropriate and is nothing to fear.' },
      ],
      keyTakeaways: [
        'Functioning well on the outside does not mean you are okay on the inside',
        'High-functioning depression is real, diagnosable, and very treatable',
        'The longer it goes unaddressed, the harder it becomes to shift',
        'You don\'t need to "earn" the right to feel depressed or seek help',
        'CBT, behavioral activation, and lifestyle changes have strong evidence',
      ],
    },
  },
  {
    id: 2, category: 'anxiety', tag: 'Anxiety', tagColor: '#f59e0b', featured: false,
    title: "Why Your Brain Catastrophises — and How to Stop It",
    excerpt: "Cognitive distortions aren't weakness. They're your nervous system trying to protect you.",
    image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80',
    readTime: '5 min read', link: 'https://www.psychologytoday.com/us/blog/in-practice/201301/cognitive-distortions-and-anxiety', pdf: null, expert: null,
    synopsis: {
      intro: 'Catastrophising — imagining the worst possible outcome and believing it\'s likely — is one of the most common features of anxiety. It\'s not irrational weakness; it\'s your threat-detection system doing exactly what it evolved to do. Understanding the mechanism is the first step to interrupting it.',
      sections: [
        { heading: 'The neuroscience of "what if"', body: 'Your amygdala — the brain\'s alarm system — cannot distinguish between a real threat and an imagined one. When you think "what if I lose my job" with enough emotional intensity, your body responds with the same cortisol and adrenaline spike as if it were actually happening right now. The anxious thought loop isn\'t a character flaw; it\'s a misfiring survival system.' },
        { heading: 'Common cognitive distortions in anxiety', body: 'Fortune-telling (assuming you know the bad outcome), mind-reading (assuming others think negatively of you), all-or-nothing thinking (it\'s either perfect or a disaster), and catastrophising (the worst case is not only possible but inevitable) are the most common distortions. Most people have 2-3 they default to under stress.' },
        { heading: 'The "realistic probability" technique', body: 'When a catastrophic thought appears, ask three questions: What is the realistic probability this happens? If it does happen, how long will it actually affect me? What resources do I have to cope if it does? This isn\'t toxic positivity — it\'s accuracy. Anxiety almost always inflates probability and deflates your coping ability.' },
        { heading: 'Grounding the body first', body: 'Because anxiety is physiological before it\'s cognitive, you need to regulate the nervous system before cognitive techniques work. The physiological sigh (double inhale through the nose, long exhale through the mouth) is the fastest evidence-backed method to down-regulate the stress response — faster than meditation, according to Stanford research.' },
      ],
      keyTakeaways: [
        'Catastrophising is a misfiring threat-detection system, not a personality flaw',
        'The amygdala responds to imagined threats as if they were real',
        'Challenge the probability of the worst case, not just the thought itself',
        'Body regulation (breathing) must come before cognitive reframing',
        'Identifying your personal distortion patterns makes them easier to catch',
      ],
    },
  },
  {
    id: 3, category: 'love', tag: 'Love & Loss', tagColor: '#ec4899', featured: false,
    title: 'Grief That No One Talks About: Losing Someone Who Is Still Alive',
    excerpt: 'Estrangement, breakups, friendships that quietly end. Ambiguous grief is real.',
    image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=600&q=80',
    readTime: '9 min read', link: 'https://www.psychologytoday.com/us/blog/the-grief-toolbox/201804/ambiguous-loss', pdf: null, expert: null,
    synopsis: {
      intro: 'We have rituals for death — funerals, condolences, time off work. But what about the grief of a friend who ghosted you, a parent who is estranged, a relationship that ended without closure, or a version of someone you loved who changed beyond recognition? This grief is just as real — and society offers almost no support for it.',
      sections: [
        { heading: 'What is ambiguous loss?', body: 'Psychologist Pauline Boss coined the term "ambiguous loss" to describe losses that lack a clear ending or social recognition. There are two types: physical absence with psychological presence (a missing person, an estranged parent you still think about daily) and psychological absence with physical presence (a parent with dementia who is alive but gone, or a partner who has emotionally checked out). Both are devastating, and both are largely invisible.' },
        { heading: 'Why it\'s harder than death', body: 'With death, there is finality — painful, but defined. With ambiguous loss, hope and grief exist simultaneously and indefinitely. You can\'t properly mourn someone who might come back. You can\'t move on because you don\'t know if there\'s something to move on from. This ambiguity creates a chronic, unresolved grief state that often looks like depression or anxiety.' },
        { heading: 'The social invisibility problem', body: 'Society validates grief for death. But "I\'m grieving my estrangement from my father" or "I\'m grieving the end of my friendship" is met with "have you tried reaching out?" or "you\'ll find new friends." The lack of social recognition means people often feel shame for how much pain they\'re in, which compounds the grief itself.' },
        { heading: 'How to move through it', body: 'Boss\'s research shows the path forward is not resolution — it\'s resilience within ambiguity. This means: naming the loss explicitly (the ritual aspect of grief), finding meaning without closure, building a new relationship with the person in your mind (accepting who they are now, not who they were), and allowing yourself to hold both love and grief simultaneously without needing to choose.' },
      ],
      keyTakeaways: [
        'Ambiguous grief over living people is just as valid as grief over death',
        'The lack of finality makes it chronically harder to process',
        'Society offers almost no ritual or language for this kind of loss',
        'You don\'t need closure to heal — you need to build meaning within the uncertainty',
        'Holding love and grief simultaneously is the goal, not resolving one',
      ],
    },
  },
  {
    id: 9, category: 'dopamine', tag: 'Dopamine Detox', tagColor: '#7c3aed', featured: true,
    title: 'Dopamine Detox: The Science Behind Digital Overstimulation',
    excerpt: 'Dr. Anna Lembke explains how every scroll hijacks your reward system.',
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
    readTime: '8 min read', link: 'https://www.hubermanlab.com/newsletter/controlling-your-dopamine-for-motivation-focus-and-satisfaction', pdf: null, expert: 'Dr. Anna Lembke · Stanford Medicine',
    synopsis: {
      intro: 'Your brain was not designed for the internet. Every notification, every scroll, every "like" is a micro-hit of dopamine — and your brain responds by raising the baseline required to feel okay. Dr. Anna Lembke, Stanford psychiatrist and author of "Dopamine Nation," explains why modern life has created a generation running from a deficit they don\'t know they have.',
      sections: [
        { heading: 'How dopamine actually works', body: 'Dopamine is not the pleasure chemical — it\'s the anticipation and motivation chemical. It spikes before you get the reward, during the seeking. This is why scrolling Instagram is more compelling than reading — every scroll is a potential reward. The brain learns to crave the seeking itself, not the finding. Over time, the same stimulus produces less dopamine, requiring more stimulation to feel normal.' },
        { heading: 'The pleasure-pain balance', body: 'Dr. Lembke describes a "pleasure-pain balance" in the brain: every pleasure is followed by a pain of equal and opposite magnitude (a "come down"). With low-grade, constant pleasures — social media, junk food, pornography — the brain tilts toward the pain side chronically. The result is baseline anxiety, restlessness, difficulty concentrating, and inability to enjoy simple pleasures.' },
        { heading: 'What a dopamine detox actually is', body: 'A proper dopamine detox is not sitting in a white room staring at the wall. It\'s a structured 24-48 hour (or longer) abstention from your highest-dopamine behaviours — specifically social media, gaming, pornography, and junk food. During this time, the brain\'s reward pathway begins to recalibrate. Most people report feeling worse in the first 4-6 hours, then noticeably better by hour 24.' },
        { heading: 'The protocol', body: 'Identify your top 3 dopamine sources. Abstain completely for 24 hours minimum. Fill the time with low-dopamine activities: walking, journaling, cooking, reading physical books. When the detox ends, reintroduce behaviours selectively with time limits. The goal is not permanent abstinence — it\'s resetting the baseline so ordinary life becomes pleasurable again.' },
      ],
      keyTakeaways: [
        'Dopamine is about seeking and anticipation, not pleasure itself',
        'Every pleasure has an equal and opposite pain response — chronic micro-pleasures create chronic low-grade pain',
        'Modern digital life is specifically engineered to exploit this system',
        'A 24-48hr detox from high-dopamine behaviors measurably resets baseline',
        'The goal is not abstinence but recalibration — so ordinary things feel good again',
      ],
    },
  },
  {
    id: 10, category: 'dopamine', tag: 'Procrastination', tagColor: '#7c3aed', featured: true,
    title: "The Real Reason You Procrastinate (It's Not Laziness)",
    excerpt: "Dr. Tim Pychyl's research shows procrastination is emotion regulation, not time management.",
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80',
    readTime: '6 min read', link: 'https://www.psychologytoday.com/us/blog/dont-delay/201203/procrastination-self-regulation-failure', pdf: null, expert: 'Dr. Tim Pychyl · Carleton University',
    synopsis: {
      intro: 'For decades, procrastination was treated as a time management problem. Buy a planner, set deadlines, use a timer. None of it works long-term because Dr. Tim Pychyl\'s 20+ years of research reveals that procrastination is fundamentally an emotion regulation problem — a way of avoiding negative feelings associated with a task, not the task itself.',
      sections: [
        { heading: 'What you\'re actually avoiding', body: 'When you procrastinate, you\'re not avoiding the task — you\'re avoiding the emotion the task triggers: boredom, self-doubt, anxiety about failure, resentment, perfectionism-induced paralysis. The task becomes paired with a negative emotional state, and the brain seeks immediate relief by doing something that feels better right now. This provides short-term mood repair at the cost of long-term wellbeing.' },
        { heading: 'The "just get started" paradox', body: 'The biggest lie procrastination tells you is that you need to feel motivated to begin. Research consistently shows the opposite: motivation follows action, not the other way around. Once you start a task — even for just 2 minutes — your brain becomes emotionally involved (the Zeigarnik effect: incomplete tasks stay active in working memory), and motivation naturally rises. You don\'t wait to feel ready. You act to become ready.' },
        { heading: 'The role of self-compassion', body: 'Counterintuitively, self-criticism after procrastinating makes future procrastination more likely, not less. Dr. Kristin Neff\'s research shows that self-compassion after a procrastination episode — genuinely forgiving yourself rather than beating yourself up — breaks the shame-avoidance cycle and leads to significantly less procrastination in subsequent tasks.' },
        { heading: 'Practical interruptions', body: 'The most effective evidence-backed techniques are: implementation intentions ("I will do X at time Y in location Z" — shown to double follow-through), temptation bundling (pairing disliked tasks with something enjoyable, like a specific playlist), and the 2-minute rule (if it takes less than 2 minutes, do it immediately to prevent it entering the avoidance queue at all).' },
      ],
      keyTakeaways: [
        'Procrastination is emotion avoidance, not laziness or poor time management',
        'You\'re avoiding the feeling associated with the task, not the task itself',
        'Motivation follows action — you don\'t need to feel ready to start',
        'Self-compassion after procrastinating reduces future procrastination',
        'Implementation intentions (when/where/what) double the rate of follow-through',
      ],
    },
  },
  {
    id: 12, category: 'morning', tag: 'Morning Routine', tagColor: '#f97316', featured: false,
    title: "The Art of Waking Up: What the First 10 Minutes Do to Your Brain",
    excerpt: 'Huberman Lab research: sunlight within 30 min of waking sets your entire day.',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&q=80',
    readTime: '9 min read', link: 'https://www.hubermanlab.com/newsletter/using-light-for-health', pdf: null, expert: 'Dr. Andrew Huberman · Stanford Neuroscience',
    synopsis: {
      intro: 'The first 30 minutes after waking set the biological clock for your entire day — your mood, alertness, focus, and even how easily you\'ll fall asleep 16 hours later. Most people spend those minutes on their phones, which is one of the most counterproductive things you can do to your brain\'s morning chemistry.',
      sections: [
        { heading: 'The cortisol morning pulse', body: 'Within minutes of waking, your brain triggers a cortisol spike — not the "stress cortisol" of panic, but a healthy, focused arousal that primes your immune system, metabolism, and motivation. The timing and intensity of this pulse determines how alert, focused, and emotionally stable you are for the next 8-12 hours. Bright morning light (ideally outdoor sunlight) amplifies this pulse significantly.' },
        { heading: 'Why morning light is non-negotiable', body: 'The suprachiasmatic nucleus — your master circadian clock — is reset every day by the wavelength of light that enters your eyes. Morning sunlight (even on an overcast day) contains a specific ratio of blue-to-yellow light that signals dawn. Viewing this light within 30 minutes of waking sets the 24-hour clock: your cortisol peak, your melatonin release time 12-14 hours later, and the depth of your sleep that night. 10-30 minutes outdoors is enough. Sunglasses block the effect.' },
        { heading: 'What to avoid in the first hour', body: 'Phone use immediately after waking sends your visual system into high-frequency stimulation before it\'s calibrated, raises cortisol through social stress rather than the healthy morning pulse, and establishes a reactive rather than intentional mental state. Caffeine should ideally wait 90-120 minutes after waking — consuming it too early blocks adenosine (the sleep pressure molecule) before it\'s fully cleared, causing the afternoon crash.' },
        { heading: 'The optimal morning stack', body: 'Wake without an alarm if possible, or use a gradual light alarm. Immediately get outdoor light exposure. Delay caffeine 90 minutes. Do a brief physical movement (even a 5-minute walk counts). Delay screens for 30-60 minutes. This protocol, followed consistently, produces measurably better mood, focus, and sleep quality within 2 weeks according to Huberman\'s lab data.' },
      ],
      keyTakeaways: [
        'The first 30 minutes post-waking sets your biological clock for the entire day',
        'Morning sunlight (10-30 min outdoors) is the single highest-leverage morning habit',
        'Phone use immediately after waking disrupts healthy cortisol calibration',
        'Delay caffeine 90-120 minutes to avoid the afternoon crash',
        'Consistent morning light exposure improves sleep quality within 2 weeks',
      ],
    },
  },
  {
    id: 14, category: 'energy', tag: 'Energy', tagColor: '#0ea5e9', featured: false,
    title: 'Preserving Mental Energy: The Science of Cognitive Load',
    excerpt: 'Decision fatigue degrades willpower and judgment — here\'s how to protect it.',
    image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&q=80',
    readTime: '7 min read', link: 'https://hbr.org/2016/11/have-we-been-thinking-about-willpower-the-wrong-way-for-30-years', pdf: null, expert: 'Roy Baumeister · Florida State University',
    synopsis: {
      intro: 'Willpower is not a moral quality — it\'s a limited metabolic resource. Roy Baumeister\'s landmark ego depletion research shows that every decision, every act of self-control, and every task requiring sustained concentration draws from the same finite cognitive reserve. Understanding how to manage that reserve is one of the highest-leverage productivity and wellbeing skills you can develop.',
      sections: [
        { heading: 'What decision fatigue actually is', body: 'The brain uses glucose as its primary fuel. Mental effort — especially decisions, self-regulation, and complex reasoning — depletes glucose reserves in ways that measurably impair subsequent cognitive performance. This is not metaphorical: judges give worse parole decisions later in the day, doctors prescribe more antibiotics (the easy default) in the afternoon, and people make worse financial choices when cognitively depleted.' },
        { heading: 'The myth of working harder', body: 'Most productivity advice assumes the problem is motivation or discipline — do more, push harder. But if the underlying issue is cognitive depletion, pushing harder accelerates the depletion without solving it. The research-backed approach is exactly the opposite: protect your peak cognitive hours, reduce the number of low-stakes decisions you make, and build recovery into your schedule rather than treating rest as laziness.' },
        { heading: 'Structural energy protection', body: 'High performers preserve energy through structure, not willpower. Pre-making decisions (meal prep, laying out clothes, establishing routines) eliminates entire categories of daily decisions. Scheduling cognitively demanding work in the first 4 hours after waking — when the morning cortisol peak provides natural focus — means you\'re doing your most important work with full resources, not the dregs.' },
        { heading: 'Recovery is productive', body: 'The ultradian rhythm research shows the brain naturally cycles between high-focus and rest states every 90 minutes. Fighting the rest phase (pushing through with caffeine and willpower) degrades performance in the next cycle. A 10-20 minute break — even just sitting quietly — fully restores the next 90-minute block. A nap of 20 minutes restores more cognitive performance than caffeine.' },
      ],
      keyTakeaways: [
        'Willpower is a limited metabolic resource that depletes across the day',
        'Every small decision draws from the same reserve as major self-control',
        'Protect your morning peak hours for your highest-cognitive work',
        'Pre-decisions and routines eliminate entire categories of energy-draining choices',
        'Real breaks (not scrolling) every 90 minutes restore the next work block fully',
      ],
    },
  },
  {
    id: 16, category: 'love', tag: 'Real Love', tagColor: '#ec4899', featured: false,
    title: "What Is Real Love? Neuroscience vs. the Movies",
    excerpt: "Helen Fisher's fMRI shows romantic love is a drive, not an emotion. This changes everything.",
    image: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=600&q=80',
    readTime: '10 min read', link: 'https://www.ted.com/talks/helen_fisher_the_brain_in_love', pdf: null, expert: 'Dr. Helen Fisher · Rutgers University',
    synopsis: {
      intro: 'We\'ve been told love is an emotion. Dr. Helen Fisher\'s fMRI research at Rutgers — scanning the brains of people newly in love, long-term couples, and the recently heartbroken — reveals something more fundamental: romantic love is a drive, like hunger or thirst. It lives not in the emotional centers of the brain, but in the reward and motivation system. This changes everything about how we understand it.',
      sections: [
        { heading: 'The three brain systems of love', body: 'Fisher identifies three distinct brain systems that often get conflated. Lust — driven by testosterone and estrogen — is the craving for sexual gratification with any suitable partner. Romantic attraction — driven by dopamine and norepinephrine — is the obsessive focus on one specific person, the "can\'t eat, can\'t sleep" state. Attachment — driven by oxytocin and vasopressin — is the deep calm, comfort, and security of long-term bonding. These three can operate independently and often do.' },
        { heading: 'Why heartbreak feels like withdrawal', body: 'When Fisher scanned people who had just been rejected in love, the activated brain regions were identical to those of cocaine addicts in withdrawal — specifically the nucleus accumbens and ventral tegmental area. Romantic love is a genuine addiction in the neurochemical sense: withdrawal is real, the craving can overwhelm rational thought, and the obsession intensifies with unavailability (the variable reward effect).' },
        { heading: 'What lust is vs. what love is', body: 'Lust and love activate different brain regions and serve different evolutionary purposes. Lust evolved for mating; love evolved for pair bonding and child-rearing. You can feel deep love without lust, and intense lust without love. Cultural and religious narratives often conflate them, creating shame around lust and unrealistic expectations of love. Understanding them as separate systems reduces this confusion significantly.' },
        { heading: 'Long-term love and the brain', body: 'Fisher\'s scanning of couples together 20+ years who reported still being intensely in love showed something remarkable: their brains looked more like early romantic love than settled companionate attachment — the dopamine system was still highly active. The difference from new love: the anxiety was gone and the calm was there too. Long-term romantic love is biologically achievable — it requires novelty, challenge, and continued investment.' },
      ],
      keyTakeaways: [
        'Romantic love is a drive (like hunger), not just an emotion — it lives in the motivation system',
        'Lust, attraction, and attachment are three separate brain systems that can operate independently',
        'Heartbreak activates the same brain regions as drug withdrawal — the pain is neurologically real',
        'Lust is not love — conflating them creates shame and unrealistic expectations',
        'Long-term romantic love (not just companionate comfort) is biologically possible with effort',
      ],
    },
  },
  {
    id: 17, category: 'love', tag: 'Controlling Lust', tagColor: '#ec4899', featured: false,
    title: "Controlling Sexual Impulses: What Brain Science Says",
    excerpt: "Lust isn't a moral failing — it's dopamine at work. Here's how to regain control without shame.",
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80',
    readTime: '8 min read', link: 'https://www.hubermanlab.com/episode/controlling-your-dopamine-for-motivation-focus-and-satisfaction', pdf: null, expert: 'Dr. Andrew Huberman · Stanford Neuroscience',
    synopsis: {
      intro: 'Sexual desire is one of the most powerful drives in the human brain — evolutionarily designed to override rational thought. Understanding the neurochemistry does not excuse harmful behavior, but it does replace shame-based approaches (which consistently fail) with mechanism-based tools that actually work.',
      sections: [
        { heading: 'The neurochemistry of lust', body: 'Sexual arousal is primarily driven by testosterone (in both men and women) and dopamine. Testosterone sensitizes dopamine receptors in the reward pathway, which is why sexual stimuli can hijack attention so powerfully. The seeking circuit — wanting — is often stronger than the liking circuit, which explains why anticipation can feel more compelling than the experience itself. This is also why pornography use escalates: the novelty required to activate the dopamine system keeps increasing.' },
        { heading: 'Why willpower alone fails', body: 'Attempting to suppress sexual impulse through sheer willpower activates the prefrontal cortex against the limbic system — and the limbic system almost always wins when sufficiently activated. What\'s more, the white bear effect shows that the more you try not to think about something, the more it intrudes. Suppression-based approaches tend to create a feast-or-famine cycle of restriction and acting out.' },
        { heading: 'Sublimation: the evidence-based alternative', body: 'The most effective long-term approach is not suppression but sublimation — redirecting the energy. Intense physical exercise (particularly cold exposure, which raises dopamine 2.5x baseline for hours), creative work, and social engagement all channel the same dopamine-seeking energy into productive outlets. This is not a metaphor; it is a literal redirection of neurochemical resources.' },
        { heading: 'Environment design over willpower', body: 'The research on habit and impulse consistently shows that environment design is 10x more effective than willpower. Remove triggers from your environment, add friction to problematic behaviors, and reduce your exposure to escalating stimuli. The goal is to make the desired behavior the path of least resistance, not to maintain constant vigilance against the undesired one.' },
      ],
      keyTakeaways: [
        'Lust is driven by testosterone and dopamine — it is a neurochemical event, not a moral failure',
        'Willpower-based suppression reliably fails; it creates cycles, not freedom',
        'Sublimation (redirecting energy into exercise, creativity, purpose) is the evidence-backed alternative',
        'Environment design reduces the need for willpower by removing triggers',
        'Understanding the mechanism removes shame and enables pragmatic action',
      ],
    },
  },
  {
    id: 19, category: 'depression', tag: 'Loneliness', tagColor: '#0ea5e9', featured: true,
    title: 'The Loneliness Epidemic: Why Modern Life Has Made Us the Most Isolated Generation',
    excerpt: 'Former US Surgeon General Dr. Vivek Murthy called loneliness a public health crisis. The science shows it\'s as damaging as smoking 15 cigarettes a day.',
    image: 'https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?w=600&q=80',
    readTime: '10 min read', link: 'https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf', pdf: 'https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf', expert: 'Dr. Vivek Murthy · US Surgeon General',
    synopsis: {
      intro: 'In 2023, the US Surgeon General issued a formal advisory declaring loneliness an epidemic. Not a feeling. A public health crisis. Research across 300,000 people shows that social isolation increases mortality risk by 26% — comparable to obesity, and worse than physical inactivity. We have built a world optimized for convenience and efficiency, and accidentally optimized away human connection.',
      sections: [
        { heading: 'Why loneliness is physically dangerous', body: 'Loneliness activates the body\'s threat response — the same system that responds to physical danger. Chronically lonely people have higher cortisol, more inflammation, worse immune function, and measurably shorter telomeres (the caps on DNA that determine biological aging). The body treats social isolation as a survival threat, because for most of human history, it was. Being cut off from the tribe meant death.' },
        { heading: 'The difference between being alone and being lonely', body: 'Loneliness is not solitude. Many people are deeply connected while spending hours alone. Many people feel profoundly lonely in a crowded room, or in a long-term relationship. Loneliness is the gap between the social connection you have and the social connection you need. This gap is subjective — which is why introverts and extroverts can experience the same social situation completely differently.' },
        { heading: 'Why digital connection makes it worse', body: 'Social media use correlates with increased loneliness, not decreased. Researcher Jean Twenge\'s data on post-2012 generations (those who grew up with smartphones) shows sharp increases in loneliness, depression, and anxiety that correlate directly with social media adoption. Passive scrolling — watching others live — activates social comparison and envy without providing the neurochemical benefit of real connection (oxytocin, which requires physical proximity or sustained eye contact).' },
        { heading: 'How to actually address it', body: 'Dr. Murthy\'s research identifies three layers of connection: intimate (1-3 people you\'re deeply close to), relational (15-50 people you see regularly), and collective (community membership). Modern people have hollowed out the relational layer most. The evidence-backed interventions are: consistent low-stakes contact (weekly brief calls beat occasional deep conversations), shared activity over conversation, volunteering (which reduces loneliness more reliably than social events), and treating loneliness like hunger — a signal to act on, not a shame to hide.' },
      ],
      keyTakeaways: [
        'Chronic loneliness is as damaging to health as smoking 15 cigarettes a day',
        'Loneliness is the gap between desired and actual connection — not the same as being alone',
        'Social media use is correlated with increased loneliness, not decreased',
        'Physical presence and eye contact provide oxytocin that digital interaction cannot replicate',
        'Consistent brief contact is more protective than occasional deep conversations',
      ],
    },
  },
];

const quotes = [
  { text: "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared, or anxious. Having feelings doesn't make you a negative person. It makes you human.", author: 'Lori Deschene' },
  { text: 'Depression is not a sign of weakness. It is a sign that you have been trying to be strong for too long.', author: 'Unknown' },
  { text: 'The most painful thing is losing yourself in the process of loving someone too much, and forgetting that you are special too.', author: 'Ernest Hemingway' },
  { text: "Owning our story and loving ourselves through that process is the bravest thing we will ever do.", author: 'Brené Brown' },
  { text: "Dopamine is not about pleasure. It's about anticipation, seeking, and motivation. You can hack this system — or it can hack you.", author: 'Dr. Anna Lembke' },
  { text: 'The morning is the rudder of the day. How you start determines where you go.', author: 'Robin Sharma' },
  { text: 'Lust is temporary, romance can be nice, but love is the most important thing. Love is what carries you through.', author: 'Dr. Helen Fisher' },
  { text: 'Procrastination is not a time management problem. It is an emotion management problem.', author: 'Dr. Tim Pychyl' },
];

const spiritualLearnings = [
  { title: 'The Sufi Teaching on Heartbreak', body: "In Sufi mysticism, the breaking of the heart (dil-shikastagi) is not a tragedy — it is the cracking open through which divine light enters. Rumi's reed flute cries because it's been cut from its origin. That longing is not suffering; it is the sound of seeking.", source: 'Rumi, Masnavi', icon: '🌙' },
  { title: 'Buddhism & the Second Arrow', body: 'The Buddha taught about the "second arrow." Pain is the first arrow — unavoidable. Our resistance to pain, our self-judgment, our story about it — that is the second arrow. We shoot it at ourselves. Healing begins when we stop.', source: 'Sallatha Sutta, SN 36.6', icon: '☸️' },
  { title: 'Vedic View on Lust & Desire', body: "The Bhagavad Gita names lust (kama) as the great devourer — not because desire is evil, but because unmastered desire destroys your ability to choose. The practice is not suppression; it is sublimation — redirecting that energy upward.", source: 'Bhagavad Gita 3:37', icon: '🕉️' },
  { title: 'Stoic Practice for Dark Days', body: 'Marcus Aurelius wrote that suffering comes not from events but from our judgments about them. The Stoic practice of negative visualisation and memento mori is not morbid; it is liberation from the tyranny of hope and fear.', source: 'Meditations, Marcus Aurelius', icon: '⚗️' },
  { title: 'Taoist Wu Wei & Morning Energy', body: "Taoism's wu wei — effortless action — teaches that the highest energy comes from aligning with natural rhythms. Waking with the sun, resting with the dark. Your energy is not manufactured; it is borrowed from nature.", source: 'Tao Te Ching, Ch. 16', icon: '☯️' },
  { title: 'Islamic Teaching on Restraint (Nafs)', body: 'In Islamic spirituality, the nafs al-ammara is the part that surrenders to impulse. The practice of taming the nafs is not repression but elevation. Fasting, dhikr, and silence are tools to move from the lowest nafs to the highest.', source: 'Quran 12:53 · Al-Ghazali', icon: '☪️' },
];

const videos = [
  { id: 'v1', category: 'dopamine', title: 'Dopamine Detox: A Short Guide to Remove Your Addiction', channel: 'Improvement Pill', channelAvatar: '💊', duration: '8:32', views: '12M views', thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=480&q=80', link: 'https://www.youtube.com/watch?v=9QiE-M1LrZk', tag: 'Dopamine', tagColor: '#7c3aed', synopsis: 'Breaks down how constant digital stimulation hijacks your dopamine system, and walks through a practical 24-hour detox protocol used by thousands to reset motivation and reduce brain fog.' },
  { id: 'v2', category: 'dopamine', title: "The REAL Reason You Can't Stop Procrastinating", channel: 'Dr. K (HealthyGamerGG)', channelAvatar: '🎮', duration: '22:14', views: '4.3M views', thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=480&q=80', link: 'https://www.youtube.com/watch?v=FWTNMzK9vG4', tag: 'Procrastination', tagColor: '#7c3aed', synopsis: 'Dr. K (Harvard psychiatrist) explains why procrastination is an emotional regulation failure, not laziness. Covers shame loops, dopamine avoidance, and why gamers are especially vulnerable — with real tools to break the cycle.' },
  { id: 'v3', category: 'morning', title: 'The Perfect Morning Routine — Backed by Science', channel: 'Andrew Huberman', channelAvatar: '🧠', duration: '1:54:32', views: '9.1M views', thumbnail: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=480&q=80', link: 'https://www.youtube.com/watch?v=gR_f-iwUGY4', tag: 'Morning', tagColor: '#f97316', synopsis: 'The definitive neuroscience-backed morning protocol: light exposure, caffeine timing, exercise, temperature, and cold exposure. Huberman explains the exact sequence and why the order matters for your cortisol, focus, and nighttime sleep.' },
  { id: 'v4', category: 'morning', title: 'Why We Sleep — Matthew Walker at Google', channel: 'Talks at Google', channelAvatar: '🔴', duration: '1:04:18', views: '3.7M views', thumbnail: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=480&q=80', link: 'https://www.youtube.com/watch?v=aXflBZXAucQ', tag: 'Sleep', tagColor: '#f97316', synopsis: 'Dr. Matthew Walker (UC Berkeley) presents alarming research on what even moderate sleep deprivation does to your brain, immune system, and emotional regulation. Includes his evidence-backed protocol for fixing sleep without medication.' },
  { id: 'v5', category: 'energy', title: 'How to Increase Your Willpower & Tenacity', channel: 'Andrew Huberman', channelAvatar: '🧠', duration: '1:48:09', views: '2.9M views', thumbnail: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=480&q=80', link: 'https://www.youtube.com/watch?v=CL_RoSBOmKY', tag: 'Energy', tagColor: '#0ea5e9', synopsis: 'Deep dive into the anterior mid-cingulate cortex — the "tenacity centre" of the brain that grows when you do hard things you don\'t want to do. Covers breathwork, cold exposure, and micro-challenges to build sustainable willpower.' },
  { id: 'v6', category: 'love', title: 'The Brain in Love — Helen Fisher TED Talk', channel: 'TED', channelAvatar: '🔴', duration: '15:47', views: '8.2M views', thumbnail: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=480&q=80', link: 'https://www.youtube.com/watch?v=OYfoGTIG7pY', tag: 'Real Love', tagColor: '#ec4899', synopsis: 'Dr. Helen Fisher scanned brains of people newly in love, long-term couples, and the recently heartbroken. The findings are stunning: romantic love activates the same circuits as cocaine addiction. This talk changed how science understands love.' },
  { id: 'v7', category: 'love', title: 'Understanding Lust, Love & Attachment', channel: 'Kurzgesagt', channelAvatar: '🐦', duration: '10:02', views: '11.4M views', thumbnail: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=480&q=80', link: 'https://www.youtube.com/watch?v=p_8yK2kmxoo', tag: 'Lust vs Love', tagColor: '#ec4899', synopsis: 'Kurzgesagt\'s animated breakdown of the three biological systems — lust (testosterone), attraction (dopamine), and attachment (oxytocin) — explaining why we often confuse them and how each can exist independently.' },
  { id: 'v8', category: 'depression', title: 'I Had a Black Dog, His Name Was Depression', channel: 'WHO', channelAvatar: '🌍', duration: '4:31', views: '18M views', thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=480&q=80', link: 'https://www.youtube.com/watch?v=XiCrniLQGYc', tag: 'Depression', tagColor: '#6366f1', synopsis: 'A beautifully animated short by the WHO based on Matthew Johnstone\'s book. Describes living with depression through metaphor — what it feels like, how it isolates you, and what helped. One of the most watched mental health videos ever made.' },
  { id: 'v9', category: 'anxiety', title: 'How to Stop Feeling Anxious About Anxiety', channel: 'TED-Ed', channelAvatar: '🔴', duration: '6:03', views: '5.8M views', thumbnail: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=480&q=80', link: 'https://www.youtube.com/watch?v=ZidGozDhOjg', tag: 'Anxiety', tagColor: '#f59e0b', synopsis: 'Explains the anxiety-about-anxiety loop — how fearing the feeling makes it worse — and introduces acceptance-based techniques from ACT (Acceptance and Commitment Therapy) that are more effective than trying to suppress or fight anxiety.' },
  { id: 'v10', category: 'energy', title: 'The Science of Setting Goals & Motivation', channel: 'Andrew Huberman', channelAvatar: '🧠', duration: '2:03:44', views: '3.1M views', thumbnail: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=480&q=80', link: 'https://www.youtube.com/watch?v=t1F7EEGPQwo', tag: 'Focus', tagColor: '#0ea5e9', synopsis: 'The neuroscience of why most people set goals wrong. Covers visual targeting, dopamine scheduling, the role of the amygdala in motivation, and why "pursue the process not the outcome" is neuroscientifically backwards.' },
];

const pdfs = [
  { title: 'Understanding Depression — WHO Guide', size: '2.1 MB', link: 'https://www.who.int/docs/default-source/mental-health/depression/depression-patient-health-questionnaire.pdf', color: '#6366f1' },
  { title: 'Anxiety Workbook (Free PDF)', size: '1.4 MB', link: 'https://www.cci.health.wa.gov.au/~/media/CCI/Mental-Health-Professionals/Anxiety/Anxiety---Information-Sheets/Anxiety-Information-Sheet---01---What-is-Anxiety.pdf', color: '#f59e0b' },
  { title: 'Grief & Loss — Coping Toolkit', size: '3.2 MB', link: 'https://www.cancer.org/content/dam/cancer-org/cancer-control/en/booklets-flyers/grief-and-bereavement.pdf', color: '#ec4899' },
  { title: 'Mindfulness for Beginners (Jon Kabat-Zinn)', size: '890 KB', link: 'https://www.mindfulnesscds.com/media/Mindfulness_for_Beginners_excerpt.pdf', color: '#10b981' },
  { title: 'Dopamine Nation — Book Overview', size: '1.1 MB', link: 'https://www.penguinrandomhouse.com/books/609049/dopamine-nation-by-anna-lembke/', color: '#7c3aed' },
  { title: 'Atomic Habits — Summary & Worksheets', size: '780 KB', link: 'https://jamesclear.com/atomic-habits', color: '#f97316' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'depression', label: 'Depression', icon: '🌧️' },
  { id: 'anxiety', label: 'Anxiety', icon: '🌀' },
  { id: 'love', label: 'Love & Loss', icon: '🌹' },
  { id: 'spiritual', label: 'Spiritual', icon: '🕊️' },
  { id: 'dopamine', label: 'Dopamine & Habits', icon: '⚡' },
  { id: 'energy', label: 'Energy & Focus', icon: '🔋' },
  { id: 'morning', label: 'Morning & Sleep', icon: '🌅' },
];

const VIDEO_CATS = [
  { id: 'all', label: 'All Videos' }, { id: 'dopamine', label: '⚡ Dopamine' },
  { id: 'morning', label: '🌅 Morning' }, { id: 'energy', label: '🔋 Energy' },
  { id: 'love', label: '🌹 Love & Lust' }, { id: 'depression', label: '🌧️ Depression' },
  { id: 'anxiety', label: '🌀 Anxiety' },
];

// ── Article Reader Modal ───────────────────────────────────────────────────────

const ArticleReader = ({ article, onClose }: { article: Article; onClose: () => void }) => {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#0e0e16',
        border: `1px solid ${article.tagColor}35`,
        borderRadius: 24, width: '100%', maxWidth: 680,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${article.tagColor}20`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Hero image */}
        <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
          <img src={article.image} alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px 24px 0 0', filter: 'brightness(0.75)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0e0e16 0%, rgba(14,14,22,0.3) 60%, transparent 100%)', borderRadius: '24px 24px 0 0' }} />
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}>
            <X style={{ width: 17, height: 17, color: '#fff' }} />
          </button>
          {/* Tag + read time */}
          <div style={{ position: 'absolute', bottom: 18, left: 22, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ background: article.tagColor, color: '#fff', padding: '5px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '.03em' }}>{article.tag}</span>
            <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(8px)' }}>
              <Clock style={{ width: 11, height: 11 }} /> {article.readTime}
            </span>
          </div>
        </div>

        {/* Content — forced white palette */}
        <div style={{ padding: '26px 30px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {article.expert && (
            <p style={{ fontSize: 11, fontWeight: 800, color: article.tagColor, margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              🎓 {article.expert}
            </p>
          )}

          <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-.01em' }}>
            {article.title}
          </h2>

          {/* Intro callout */}
          <div style={{ borderLeft: `3px solid ${article.tagColor}`, paddingLeft: 18, background: `${article.tagColor}10`, borderRadius: '0 10px 10px 0', padding: '14px 18px' }}>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', margin: 0, fontStyle: 'italic' }}>
              {article.synopsis.intro}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 1 }} />

          {/* Sections */}
          {article.synopsis.sections.map((sec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: `${article.tagColor}25`, border: `1px solid ${article.tagColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: article.tagColor }}>{i + 1}</span>
                {sec.heading}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.85, color: 'rgba(255,255,255,0.68)', margin: '0 0 0 38px' }}>
                {sec.body}
              </p>
            </div>
          ))}

          {/* Key Takeaways */}
          <div style={{ background: `${article.tagColor}15`, border: `1px solid ${article.tagColor}35`, borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: article.tagColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb style={{ width: 14, height: 14, color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 900, fontSize: 12, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Key Takeaways
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {article.synopsis.keyTakeaways.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: article.tagColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <a href={article.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '15px 0', borderRadius: 14,
              background: `linear-gradient(135deg, ${article.tagColor} 0%, ${article.tagColor}bb 100%)`,
              color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              boxShadow: `0 8px 24px ${article.tagColor}45`,
              letterSpacing: '.02em',
            }}>
              <BookOpen style={{ width: 16, height: 16 }} />
              Read Full Article
              <ArrowRight style={{ width: 15, height: 15 }} />
            </div>
          </a>
          {article.pdf && (
            <a href={article.pdf} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 0', borderRadius: 14, marginTop: -10,
                border: `1.5px solid ${article.tagColor}50`,
                color: article.tagColor, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <FileText style={{ width: 15, height: 15 }} />
                Download PDF Companion
              </div>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const BooksTab = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeQuote, setActiveQuote]       = useState(0);
  const [videoCategory, setVideoCategory]   = useState('all');
  const [openArticle, setOpenArticle]       = useState<Article | null>(null);

  const filtered = activeCategory === 'all' ? articles : articles.filter(a => a.category === activeCategory);
  const filteredVideos = videoCategory === 'all' ? videos : videos.filter(v => v.category === videoCategory);
  const featured = filtered.find(a => a.featured) || filtered[0];
  const rest = filtered.filter(a => a !== featured);

  const hov = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
    (e.currentTarget as HTMLElement).style.transform = enter ? 'translateY(-3px)' : '';
    (e.currentTarget as HTMLElement).style.boxShadow = enter ? '0 12px 32px rgba(0,0,0,0.14)' : '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {openArticle && <ArticleReader article={openArticle} onClose={() => setOpenArticle(null)} />}

      {/* Header */}
      <div className="glass-card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(236,72,153,0.08) 100%)', borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain style={{ width: 26, height: 26, color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>The Unspoken Room</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '3px 0 0' }}>Read full articles inside the app — no need to leave. From the world's top experts.</p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '7px 16px', borderRadius: 999, border: activeCategory === cat.id ? 'none' : '1.5px solid var(--border)', background: activeCategory === cat.id ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent', color: activeCategory === cat.id ? '#fff' : 'var(--muted-foreground)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Article */}
      {featured && (
        <div className="glass-card" style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }} onClick={() => setOpenArticle(featured)} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
          <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            <img src={featured.image} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
              <span style={{ background: featured.tagColor, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{featured.tag}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Star style={{ width: 10, height: 10 }} /> Featured</span>
            </div>
            <span style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><Clock style={{ width: 10, height: 10 }} /> {featured.readTime}</span>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {featured.expert && <p style={{ fontSize: 11, fontWeight: 700, color: featured.tagColor, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.04em' }}>🎓 {featured.expert}</p>}
            <h3 style={{ fontWeight: 800, fontSize: 17, margin: '0 0 8px', color: 'var(--foreground)', lineHeight: 1.35 }}>{featured.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 12px', lineHeight: 1.6 }}>{featured.excerpt}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: featured.tagColor, fontWeight: 700, fontSize: 13 }}>
              <BookOpen style={{ width: 14, height: 14 }} /> Read Inside App <ChevronRight style={{ width: 15, height: 15 }} />
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      {rest.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {rest.map(article => (
            <div key={article.id} className="glass-card" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', height: '100%', display: 'flex', flexDirection: 'column' }} onClick={() => setOpenArticle(article)} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
              <div style={{ position: 'relative', height: 130, overflow: 'hidden', flexShrink: 0 }}>
                <img src={article.image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 70%)' }} />
                <span style={{ position: 'absolute', top: 10, left: 10, background: article.tagColor, color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{article.tag}</span>
              </div>
              <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {article.expert && <p style={{ fontSize: 10, fontWeight: 700, color: article.tagColor, margin: 0, textTransform: 'uppercase', letterSpacing: '.03em' }}>🎓 {article.expert}</p>}
                <h4 style={{ fontWeight: 700, fontSize: 14, margin: 0, color: 'var(--foreground)', lineHeight: 1.4 }}>{article.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.55, flex: 1 }}>{article.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 10, height: 10 }} />{article.readTime}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: article.tagColor, fontSize: 11, fontWeight: 700 }}>
                    <BookOpen style={{ width: 11, height: 11 }} /> Read Inside
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YouTube Videos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Youtube style={{ width: 18, height: 18, color: '#ef4444' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: 'var(--foreground)' }}>Watch & Learn</h3>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Huberman Lab, TED, Kurzgesagt, Dr. K & more</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {VIDEO_CATS.map(cat => (
            <button key={cat.id} onClick={() => setVideoCategory(cat.id)} style={{ padding: '5px 13px', borderRadius: 999, border: videoCategory === cat.id ? 'none' : '1.5px solid var(--border)', background: videoCategory === cat.id ? '#ef4444' : 'transparent', color: videoCategory === cat.id ? '#fff' : 'var(--muted-foreground)', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
              {cat.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filteredVideos.map(video => (
            <a key={video.id} href={video.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                <div style={{ position: 'relative', height: 148, overflow: 'hidden' }}>
                  <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(239,68,68,0.5)' }}>
                      <Play style={{ width: 20, height: 20, color: '#fff', marginLeft: 2 }} />
                    </div>
                  </div>
                  <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{video.duration}</span>
                  <span style={{ position: 'absolute', top: 10, left: 10, background: video.tagColor, color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{video.tag}</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: 13, margin: '0 0 6px', color: 'var(--foreground)', lineHeight: 1.4 }}>{video.title}</h4>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '0 0 10px', lineHeight: 1.55 }}>{video.synopsis}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{video.channelAvatar}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}>{video.channel}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{video.views}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Quote Carousel */}
      <div className="glass-card" style={{ borderRadius: 20, padding: '24px 28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Quote style={{ width: 20, height: 20, color: '#6366f1' }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Words That Hold You</span>
        </div>
        <blockquote style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 1.7, color: 'var(--foreground)', margin: '0 0 12px', borderLeft: '3px solid #6366f1', paddingLeft: 16 }}>"{quotes[activeQuote].text}"</blockquote>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 16px' }}>— {quotes[activeQuote].author}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {quotes.map((_, i) => (
            <button key={i} onClick={() => setActiveQuote(i)} style={{ width: i === activeQuote ? 24 : 8, height: 8, borderRadius: 999, border: 'none', background: i === activeQuote ? '#6366f1' : 'rgba(99,102,241,0.25)', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
          ))}
        </div>
      </div>

      {/* Spiritual Learnings */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles style={{ width: 18, height: 18, color: '#10b981' }} />
          <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: 'var(--foreground)' }}>Ancient Wisdom on Modern Pain</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {spiritualLearnings.map((item, i) => (
            <div key={i} className="glass-card" style={{ borderRadius: 16, padding: '18px 20px', borderLeft: '3px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 8px', color: 'var(--foreground)' }}>{item.title}</h4>
                  <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 10px', lineHeight: 1.65 }}>{item.body}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', borderRadius: 999, padding: '3px 10px' }}>📖 {item.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDFs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText style={{ width: 18, height: 18, color: '#f59e0b' }} />
          <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: 'var(--foreground)' }}>Free PDF Resources</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {pdfs.map((pdf, i) => (
            <a key={i} href={pdf.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', display: 'flex', alignItems: 'center', gap: 14 }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${pdf.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText style={{ width: 22, height: 22, color: pdf.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 3px', color: 'var(--foreground)', lineHeight: 1.35 }}>{pdf.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>{pdf.size} · Free Download</p>
                </div>
                <ExternalLink style={{ width: 15, height: 15, color: pdf.color, flexShrink: 0 }} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Crisis footer */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '16px 20px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Heart style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px', color: 'var(--foreground)' }}>You are not alone</p>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.55 }}>
            iCall (India): <strong>9152987821</strong> · Vandrevala Foundation: <strong>1860-2662-345</strong> · International: <a href="https://www.befrienders.org" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>befrienders.org</a>
          </p>
        </div>
      </div>

    </div>
  );
};

export default BooksTab;