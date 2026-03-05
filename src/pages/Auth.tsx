import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Heart, ArrowRight } from 'lucide-react';
import logo from '@/assets/swasthya-saathi-logo.jpeg';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (!isLogin && !name.trim()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        } else {
          navigate('/dashboard');
        }
      } else {
        if (password.length < 6) {
          toast({ title: 'Password too short', description: 'Use at least 6 characters', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome! 💚', description: 'Account created successfully.' });
          navigate('/onboarding');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-primary/10 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20 mx-auto mb-4">
            <img src={logo} alt="SwasthyaSaathi" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">SwasthyaSaathi</h1>
          <p className="text-sm text-muted-foreground mt-1">Your wellness companion 💚</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="flex rounded-xl bg-muted/50 p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2"><User className="w-4 h-4" /> Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-background/50" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2"><Lock className="w-4 h-4" /> Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="bg-background/50" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
