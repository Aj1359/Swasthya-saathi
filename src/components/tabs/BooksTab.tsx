import { BookOpen, Lightbulb, Quote } from 'lucide-react';

const books = [
  { title: 'The Power of Now', author: 'Eckhart Tolle', description: 'A guide to spiritual enlightenment and living in the present moment.' },
  { title: 'Atomic Habits', author: 'James Clear', description: 'How tiny changes can lead to remarkable results in your life.' },
  { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', description: 'Finding purpose even in the most difficult circumstances.' },
  { title: 'The Untethered Soul', author: 'Michael Singer', description: 'Journey beyond yourself to discover inner peace.' },
  { title: 'Wherever You Go, There You Are', author: 'Jon Kabat-Zinn', description: 'Mindfulness meditation in everyday life.' },
];

const facts = [
  'Meditation for just 10 minutes a day can reduce anxiety by 40%.',
  'Deep breathing activates your parasympathetic nervous system, reducing stress.',
  'Regular yoga practice can lower cortisol levels and improve mood.',
  'Gratitude journaling for 5 minutes daily can increase happiness by 25%.',
  'Walking in nature for 20 minutes reduces stress hormones significantly.',
  'Listening to calming music can lower blood pressure and heart rate.',
  'Social connections are as important for health as diet and exercise.',
  'Adequate sleep (7-9 hours) is essential for emotional regulation.',
  'Laughter releases endorphins, your body\'s natural feel-good chemicals.',
  'Mindful eating improves digestion and reduces overeating.',
];

const quotes = [
  { text: 'You don\'t have to control your thoughts. You just have to stop letting them control you.', author: 'Dan Millman' },
  { text: 'The greatest weapon against stress is our ability to choose one thought over another.', author: 'William James' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
  { text: 'Self-care is not self-indulgence, it is self-preservation.', author: 'Audre Lorde' },
];

const BooksTab = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-secondary/20 to-amber/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Books & Wellness Facts</h2>
            <p className="text-muted-foreground">Knowledge for your wellness journey</p>
          </div>
        </div>
      </div>

      {/* Inspiring Quote */}
      <div className="glass-card p-6 bg-gradient-to-br from-lavender/20 to-primary/10">
        <Quote className="w-8 h-8 text-primary mb-3" />
        <blockquote className="text-lg font-display italic text-foreground">
          "{quotes[Math.floor(Math.random() * quotes.length)].text}"
        </blockquote>
        <p className="text-muted-foreground mt-2 text-sm">
          — {quotes[Math.floor(Math.random() * quotes.length)].author}
        </p>
      </div>

      {/* Book Recommendations */}
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Recommended Reads
        </h3>
        <div className="grid gap-3">
          {books.map((book) => (
            <div key={book.title} className="glass-card p-4 hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-foreground">{book.title}</h4>
              <p className="text-sm text-primary mb-1">by {book.author}</p>
              <p className="text-sm text-muted-foreground">{book.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Health Facts */}
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-secondary" />
          Wellness Facts
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {facts.map((fact, i) => (
            <div key={i} className="glass-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-sm text-foreground">{fact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BooksTab;
