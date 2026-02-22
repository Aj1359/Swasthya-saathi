import { useState } from 'react';
import { Quote, Heart, Brain, ExternalLink, FileText, Sparkles, ChevronRight, Star, Play, Youtube } from 'lucide-react';

const CATEGORIES = [
  { id: 'all',        label: 'All',              icon: '✦' },
  { id: 'depression', label: 'Depression',        icon: '🌧️' },
  { id: 'anxiety',    label: 'Anxiety',           icon: '🌀' },
  { id: 'love',       label: 'Love & Loss',       icon: '🌹' },
  { id: 'spiritual',  label: 'Spiritual',          icon: '🕊️' },
  { id: 'dopamine',   label: 'Dopamine & Habits', icon: '⚡' },
  { id: 'energy',     label: 'Energy & Focus',    icon: '🔋' },
  { id: 'morning',    label: 'Morning & Sleep',   icon: '🌅' },
];

const articles = [
  { id: 1, category: 'depression', tag: 'Depression', tagColor: '#6366f1', title: 'The Hidden Face of High-Functioning Depression', excerpt: 'You can smile, hold a job, seem fine — and still be drowning. This breaks down what "functioning" really means and why it makes asking for help harder.', image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80', readTime: '7 min read', featured: true, link: 'https://www.verywellmind.com/high-functioning-depression-5323687', pdf: null, expert: null },
  { id: 2, category: 'anxiety', tag: 'Anxiety', tagColor: '#f59e0b', title: "Why Your Brain Catastrophises — and How to Stop It", excerpt: "Cognitive distortions aren't weakness. They're your nervous system trying to protect you. Here's the neuroscience behind anxiety spirals.", image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80', readTime: '5 min read', featured: false, link: 'https://www.psychologytoday.com/us/blog/in-practice/201301/cognitive-distortions-and-anxiety', pdf: null, expert: null },
  { id: 3, category: 'love', tag: 'Love & Loss', tagColor: '#ec4899', title: 'Grief That No One Talks About: Losing Someone Who Is Still Alive', excerpt: 'Estrangement, breakups, friendships that quietly end. Ambiguous grief is real, painful, and largely invisible.', image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=600&q=80', readTime: '9 min read', featured: false, link: 'https://www.psychologytoday.com/us/blog/the-grief-toolbox/201804/ambiguous-loss', pdf: null, expert: null },
  { id: 4, category: 'depression', tag: 'Depression', tagColor: '#6366f1', title: 'Journaling Your Way Out of the Dark', excerpt: 'Science-backed prompts and techniques that help process depression when talking feels too hard. Includes a downloadable PDF workbook.', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80', readTime: '6 min read', featured: false, link: 'https://positivepsychology.com/depression-worksheets/', pdf: 'https://positivepsychology.com/wp-content/uploads/Depression-Worksheets.pdf', expert: null },
  { id: 5, category: 'anxiety', tag: 'Anxiety', tagColor: '#f59e0b', title: "Social Anxiety Is Not Shyness — Here's the Difference", excerpt: 'One is a personality trait. The other is a condition that can shrink your world. Understanding the line is the first step to reclaiming your life.', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80', readTime: '4 min read', featured: false, link: 'https://www.healthline.com/health/anxiety/social-anxiety-vs-shyness', pdf: null, expert: null },
  { id: 6, category: 'love', tag: 'Love & Loss', tagColor: '#ec4899', title: 'Attachment Styles: Why You Love the Way You Do', excerpt: "Anxious, avoidant, secure — your earliest bonds shape every relationship you'll ever have. A deep read on attachment theory.", image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80', readTime: '10 min read', featured: true, link: 'https://www.attachmentproject.com/attachment-theory/', pdf: 'https://www.apa.org/pubs/books/attachment-across-life-course-sample-chapter.pdf', expert: 'Dr. John Bowlby · Attachment Theory' },
  { id: 7, category: 'spiritual', tag: 'Spiritual', tagColor: '#10b981', title: 'The Dark Night of the Soul: When Spiritual Crisis Looks Like Depression', excerpt: 'Sometimes what medicine labels a breakdown is a breakthrough. Exploring the intersection of mental health and spiritual transformation.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', readTime: '8 min read', featured: false, link: 'https://www.spiritualityandpractice.com/practices/features/view/27849', pdf: null, expert: null },
  { id: 8, category: 'spiritual', tag: 'Spiritual', tagColor: '#10b981', title: "Mindfulness Is Not Toxic Positivity — Here's How to Use It Right", excerpt: "There's a big difference between bypassing your pain and sitting with it consciously. A guide to authentic mindfulness for hard emotions.", image: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80', readTime: '5 min read', featured: false, link: 'https://www.mindful.org/what-is-mindfulness/', pdf: null, expert: 'Jon Kabat-Zinn · MBSR Creator' },
  { id: 9, category: 'dopamine', tag: 'Dopamine Detox', tagColor: '#7c3aed', title: 'Dopamine Detox: The Science Behind Digital Overstimulation', excerpt: 'Dr. Anna Lembke explains how every scroll, like, and notification hijacks your reward system — and how a structured detox resets your baseline motivation.', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80', readTime: '8 min read', featured: true, link: 'https://www.hubermanlab.com/newsletter/controlling-your-dopamine-for-motivation-focus-and-satisfaction', pdf: null, expert: 'Dr. Anna Lembke · Stanford Medicine' },
  { id: 10, category: 'dopamine', tag: 'Procrastination', tagColor: '#7c3aed', title: "The Real Reason You Procrastinate (It's Not Laziness)", excerpt: "Dr. Tim Pychyl's 20 years of research shows procrastination is an emotion regulation problem, not a time management one. Here's the fix.", image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80', readTime: '6 min read', featured: false, link: 'https://www.psychologytoday.com/us/blog/dont-delay/201203/procrastination-self-regulation-failure', pdf: null, expert: 'Dr. Tim Pychyl · Carleton University' },
  { id: 11, category: 'dopamine', tag: 'Dopamine', tagColor: '#7c3aed', title: "How to Do a Proper Dopamine Detox (Without Going Crazy)", excerpt: "A practical, expert-backed 24-hour protocol that doesn't require living like a monk. Based on Dr. Lembke's Dopamine Nation framework.", image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80', readTime: '7 min read', featured: false, link: 'https://www.healthline.com/health/dopamine-detox', pdf: null, expert: 'Dr. Anna Lembke · Stanford Medicine' },
  { id: 12, category: 'morning', tag: 'Morning Routine', tagColor: '#f97316', title: "The Art of Waking Up: What the First 10 Minutes Do to Your Brain", excerpt: 'Huberman Lab research shows sunlight exposure within 30 min of waking sets your cortisol peak, mood, and sleep quality 16 hours later. The exact protocol.', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&q=80', readTime: '9 min read', featured: true, link: 'https://www.hubermanlab.com/newsletter/using-light-for-health', pdf: null, expert: 'Dr. Andrew Huberman · Stanford Neuroscience' },
  { id: 13, category: 'morning', tag: 'Sleep Science', tagColor: '#f97316', title: 'Why You Feel Groggy Every Morning — and the Fix', excerpt: 'Sleep inertia is real. Dr. Matthew Walker explains the exact architecture of sleep cycles and why waking mid-REM destroys your entire day.', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80', readTime: '5 min read', featured: false, link: 'https://www.sleepfoundation.org/sleep-inertia', pdf: null, expert: 'Dr. Matthew Walker · UC Berkeley' },
  { id: 14, category: 'energy', tag: 'Energy', tagColor: '#0ea5e9', title: 'Preserving Mental Energy: The Science of Cognitive Load', excerpt: 'Decision fatigue degrades willpower, creativity, and judgment. Baumeister\'s ego depletion research explains how to restructure your day to protect energy.', image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&q=80', readTime: '7 min read', featured: false, link: 'https://hbr.org/2016/11/have-we-been-thinking-about-willpower-the-wrong-way-for-30-years', pdf: null, expert: 'Roy Baumeister · Florida State University' },
  { id: 15, category: 'energy', tag: 'Focus', tagColor: '#0ea5e9', title: "Ultradian Rhythms: Your Brain's Natural 90-Minute Energy Cycles", excerpt: "You don't have unlimited focus. Your brain runs on 90-min work / 20-min rest cycles. Working with these rhythms can double your output.", image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600&q=80', readTime: '6 min read', featured: false, link: 'https://www.hubermanlab.com/newsletter/focus-and-motivation', pdf: null, expert: 'Dr. Andrew Huberman · Stanford Neuroscience' },
  { id: 16, category: 'love', tag: 'Real Love', tagColor: '#ec4899', title: "What Is Real Love? Neuroscience vs. the Movies", excerpt: "Helen Fisher's fMRI studies show romantic love is a drive like hunger. Understanding the 3-stage brain system — lust, attraction, attachment — changes everything.", image: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=600&q=80', readTime: '10 min read', featured: true, link: 'https://www.ted.com/talks/helen_fisher_the_brain_in_love', pdf: null, expert: 'Dr. Helen Fisher · Rutgers University' },
  { id: 17, category: 'love', tag: 'Controlling Lust', tagColor: '#ec4899', title: "Controlling Sexual Impulses: What Brain Science Says", excerpt: "Lust isn't a moral failing — it's dopamine and testosterone at work. Dr. Huberman breaks down the neurochemistry and practical tools to regain control without shame.", image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80', readTime: '8 min read', featured: false, link: 'https://www.hubermanlab.com/episode/controlling-your-dopamine-for-motivation-focus-and-satisfaction', pdf: null, expert: 'Dr. Andrew Huberman · Stanford Neuroscience' },
  { id: 18, category: 'love', tag: 'Real Love', tagColor: '#ec4899', title: "The 5 Love Languages — More Complicated Than You Think", excerpt: "Gary Chapman's framework is popular, but psychologists warn against using it as a rigid rule. Here's the deeper truth about how love is communicated and misread.", image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&q=80', readTime: '6 min read', featured: false, link: 'https://www.gottman.com/blog/the-science-behind-the-five-love-languages/', pdf: null, expert: 'Dr. John Gottman · Gottman Institute' },
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
  { title: 'Islamic Teaching on Restraint (Nafs)', body: 'In Islamic spirituality, the nafs al-ammara is the part that surrenders to impulse — lust, anger, ego. The practice of taming the nafs is not repression but elevation. Fasting, dhikr, and silence are tools to move from the lowest nafs to the highest.', source: 'Quran 12:53 · Al-Ghazali', icon: '☪️' },
];

const videos = [
  { id: 'v1', category: 'dopamine', title: 'Dopamine Detox: A Short Guide to Remove Your Addiction', channel: 'Improvement Pill', channelAvatar: '💊', duration: '8:32', views: '12M views', thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=480&q=80', link: 'https://www.youtube.com/watch?v=9QiE-M1LrZk', tag: 'Dopamine', tagColor: '#7c3aed' },
  { id: 'v2', category: 'dopamine', title: "The REAL Reason You Can't Stop Procrastinating", channel: 'Dr. K (HealthyGamerGG)', channelAvatar: '🎮', duration: '22:14', views: '4.3M views', thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=480&q=80', link: 'https://www.youtube.com/watch?v=FWTNMzK9vG4', tag: 'Procrastination', tagColor: '#7c3aed' },
  { id: 'v3', category: 'morning', title: 'The Perfect Morning Routine — Backed by Science', channel: 'Andrew Huberman', channelAvatar: '🧠', duration: '1:54:32', views: '9.1M views', thumbnail: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=480&q=80', link: 'https://www.youtube.com/watch?v=gR_f-iwUGY4', tag: 'Morning', tagColor: '#f97316' },
  { id: 'v4', category: 'morning', title: 'Why We Sleep — Matthew Walker at Google', channel: 'Talks at Google', channelAvatar: '🔴', duration: '1:04:18', views: '3.7M views', thumbnail: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=480&q=80', link: 'https://www.youtube.com/watch?v=aXflBZXAucQ', tag: 'Sleep', tagColor: '#f97316' },
  { id: 'v5', category: 'energy', title: 'How to Increase Your Willpower & Tenacity', channel: 'Andrew Huberman', channelAvatar: '🧠', duration: '1:48:09', views: '2.9M views', thumbnail: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=480&q=80', link: 'https://www.youtube.com/watch?v=CL_RoSBOmKY', tag: 'Energy', tagColor: '#0ea5e9' },
  { id: 'v6', category: 'love', title: 'The Brain in Love — Helen Fisher TED Talk', channel: 'TED', channelAvatar: '🔴', duration: '15:47', views: '8.2M views', thumbnail: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=480&q=80', link: 'https://www.youtube.com/watch?v=OYfoGTIG7pY', tag: 'Real Love', tagColor: '#ec4899' },
  { id: 'v7', category: 'love', title: 'Understanding Lust, Love & Attachment', channel: 'Kurzgesagt', channelAvatar: '🐦', duration: '10:02', views: '11.4M views', thumbnail: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=480&q=80', link: 'https://www.youtube.com/watch?v=p_8yK2kmxoo', tag: 'Lust vs Love', tagColor: '#ec4899' },
  { id: 'v8', category: 'depression', title: 'I Had a Black Dog, His Name Was Depression', channel: 'WHO', channelAvatar: '🌍', duration: '4:31', views: '18M views', thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=480&q=80', link: 'https://www.youtube.com/watch?v=XiCrniLQGYc', tag: 'Depression', tagColor: '#6366f1' },
  { id: 'v9', category: 'anxiety', title: 'How to Stop Feeling Anxious About Anxiety', channel: 'TED-Ed', channelAvatar: '🔴', duration: '6:03', views: '5.8M views', thumbnail: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=480&q=80', link: 'https://www.youtube.com/watch?v=ZidGozDhOjg', tag: 'Anxiety', tagColor: '#f59e0b' },
  { id: 'v10', category: 'energy', title: 'The Science of Setting Goals & Motivation', channel: 'Andrew Huberman', channelAvatar: '🧠', duration: '2:03:44', views: '3.1M views', thumbnail: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=480&q=80', link: 'https://www.youtube.com/watch?v=t1F7EEGPQwo', tag: 'Focus', tagColor: '#0ea5e9' },
];

const pdfs = [
  { title: 'Understanding Depression — WHO Guide', size: '2.1 MB', link: 'https://www.who.int/docs/default-source/mental-health/depression/depression-patient-health-questionnaire.pdf', color: '#6366f1' },
  { title: 'Anxiety Workbook (Free PDF)', size: '1.4 MB', link: 'https://www.cci.health.wa.gov.au/~/media/CCI/Mental-Health-Professionals/Anxiety/Anxiety---Information-Sheets/Anxiety-Information-Sheet---01---What-is-Anxiety.pdf', color: '#f59e0b' },
  { title: 'Grief & Loss — Coping Toolkit', size: '3.2 MB', link: 'https://www.cancer.org/content/dam/cancer-org/cancer-control/en/booklets-flyers/grief-and-bereavement.pdf', color: '#ec4899' },
  { title: 'Mindfulness for Beginners (Jon Kabat-Zinn)', size: '890 KB', link: 'https://www.mindfulnesscds.com/media/Mindfulness_for_Beginners_excerpt.pdf', color: '#10b981' },
  { title: 'Dopamine Nation — Book Overview', size: '1.1 MB', link: 'https://www.penguinrandomhouse.com/books/609049/dopamine-nation-by-anna-lembke/', color: '#7c3aed' },
  { title: 'Atomic Habits — Summary & Worksheets', size: '780 KB', link: 'https://jamesclear.com/atomic-habits', color: '#f97316' },
];

const VIDEO_CATS = [
  { id: 'all', label: 'All Videos' },
  { id: 'dopamine', label: '⚡ Dopamine' },
  { id: 'morning', label: '🌅 Morning' },
  { id: 'energy', label: '🔋 Energy' },
  { id: 'love', label: '🌹 Love & Lust' },
  { id: 'depression', label: '🌧️ Depression' },
  { id: 'anxiety', label: '🌀 Anxiety' },
];

const BooksTab = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeQuote, setActiveQuote]       = useState(0);
  const [videoCategory, setVideoCategory]   = useState('all');

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

      {/* Header */}
      <div className="glass-card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(236,72,153,0.08) 100%)', borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain style={{ width: 26, height: 26, color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>The Unspoken Room</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '3px 0 0' }}>Articles, videos & wisdom on the topics no one talks about — from the world's top experts</p>
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
        <a href={featured.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
            <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
              <img src={featured.image} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                <span style={{ background: featured.tagColor, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{featured.tag}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Star style={{ width: 10, height: 10 }} /> Featured</span>
              </div>
              <span style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 11 }}>{featured.readTime}</span>
            </div>
            <div style={{ padding: '18px 20px' }}>
              {featured.expert && <p style={{ fontSize: 11, fontWeight: 700, color: featured.tagColor, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.04em' }}>🎓 {featured.expert}</p>}
              <h3 style={{ fontWeight: 800, fontSize: 17, margin: '0 0 8px', color: 'var(--foreground)', lineHeight: 1.35 }}>{featured.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 12px', lineHeight: 1.6 }}>{featured.excerpt}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: featured.tagColor, fontWeight: 700, fontSize: 13 }}>Read Article <ChevronRight style={{ width: 15, height: 15 }} /></div>
            </div>
          </div>
        </a>
      )}

      {/* Article Grid */}
      {rest.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {rest.map(article => (
            <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', height: '100%', display: 'flex', flexDirection: 'column' }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
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
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{article.readTime}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {article.pdf && (
                        <a href={article.pdf} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.1)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>
                          <FileText style={{ width: 11, height: 11 }} /> PDF
                        </a>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: article.tagColor, fontSize: 11, fontWeight: 600 }}>Read <ExternalLink style={{ width: 11, height: 11 }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ══ YOUTUBE VIDEOS ══ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Youtube style={{ width: 18, height: 18, color: '#ef4444' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: 'var(--foreground)' }}>Watch & Learn</h3>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Top videos from Huberman Lab, TED, Kurzgesagt, Dr. K & more</p>
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
                  <h4 style={{ fontWeight: 700, fontSize: 13, margin: '0 0 8px', color: 'var(--foreground)', lineHeight: 1.4 }}>{video.title}</h4>
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

      {/* PDF Resources */}
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
            If you're in crisis, reach out to iCall (India): <strong>9152987821</strong> · Vandrevala Foundation: <strong>1860-2662-345</strong> · International: <a href="https://www.befrienders.org" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>befrienders.org</a>
          </p>
        </div>
      </div>

    </div>
  );
};

export default BooksTab;