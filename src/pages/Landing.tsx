import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Mic, Camera, Shield, Users, BookOpen, Wind } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/swasthya-saathi-logo.jpeg";

const features = [
  { icon: Brain, label: "Ruhi AI Companion", desc: "Empathetic friend who remembers you", color: "from-violet-500 to-purple-600" },
  { icon: Camera, label: "Face & Posture Scan", desc: "AI reads your mood & body alignment", color: "from-blue-500 to-cyan-500" },
  { icon: Mic, label: "Voice Mood Analysis", desc: "Detects mental state from your voice", color: "from-emerald-500 to-teal-500" },
  { icon: Wind, label: "Breathing & Yoga", desc: "Evidence-based wellness exercises", color: "from-amber-500 to-orange-500" },
  { icon: Shield, label: "Crisis Support", desc: "15+ countries, local helplines", color: "from-rose-500 to-pink-500" },
  { icon: Users, label: "Peer Community", desc: "Anonymous safe space to share", color: "from-sky-500 to-indigo-500" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen px-6 relative overflow-hidden
    bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50
    dark:from-gray-900 dark:via-slate-900 dark:to-black">

      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500&display=swap');

      @keyframes zoomTitle {
        0% {opacity:0; transform:scale(0.6);}
        100% {opacity:1; transform:scale(1);}
      }
      @keyframes float {
        0% {transform:translateY(0px);}
        50% {transform:translateY(-14px);}
        100% {transform:translateY(0px);}
      }
      @keyframes fadeUp {
        0% {opacity:0; transform:translateY(24px);}
        100% {opacity:1; transform:translateY(0);}
      }
      .zoom-title { animation: zoomTitle 1.2s ease forwards; }
      .float-title { animation: float 6s ease-in-out infinite; }
      .fade-up { animation: fadeUp 0.8s ease forwards; }
      .fade-up-1 { animation: fadeUp 0.8s 0.15s ease both; }
      .fade-up-2 { animation: fadeUp 0.8s 0.3s ease both; }
      .fade-up-3 { animation: fadeUp 0.8s 0.45s ease both; }

      .glass {
        background: rgba(255,255,255,0.55);
        backdrop-filter: blur(20px);
        border:1px solid rgba(255,255,255,0.3);
        box-shadow:0 20px 40px rgba(0,0,0,0.08);
      }
      .dark .glass {
        background: rgba(20,20,20,0.55);
        border:1px solid rgba(255,255,255,0.08);
      }
      .feature-card {
        background: rgba(255,255,255,0.45);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.35);
        border-radius: 20px;
        padding: 20px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .dark .feature-card {
        background: rgba(30,30,40,0.55);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.12);
      }
      `}</style>

      {/* Ambient blobs */}
      <div className="fixed top-20 left-10 w-48 h-48 bg-teal-300/25 dark:bg-teal-700/15 rounded-full blur-3xl animate-pulse pointer-events-none"/>
      <div className="fixed bottom-20 right-16 w-64 h-64 bg-cyan-300/25 dark:bg-cyan-700/15 rounded-full blur-3xl animate-pulse pointer-events-none"/>
      <div className="fixed top-1/3 right-1/4 w-36 h-36 bg-blue-300/25 dark:bg-blue-700/15 rounded-full blur-3xl animate-pulse pointer-events-none"/>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto pt-16 pb-10">

        <div className="flex justify-center mb-8 zoom-title">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/40">
            <img src={logo} alt="SwasthyaSaathi" className="w-full h-full object-cover"/>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-[Outfit] font-extrabold
        bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600
        bg-clip-text text-transparent zoom-title float-title tracking-tight leading-tight">
          SwasthyaSaathi
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mt-4 text-base md:text-lg fade-up-1 max-w-lg">
          Your AI-powered mental wellness companion — with Ruhi, who truly listens.
        </p>

        <div className="glass rounded-3xl p-7 my-8 max-w-xl fade-up-2">
          <p className="text-lg md:text-xl italic text-gray-700 dark:text-gray-200 leading-relaxed">
            "The greatest wealth is health. Care for your mind and your body will follow."
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">
            Your wellness journey begins here.
          </p>
        </div>

        <Button
          onClick={handleStart}
          size="lg"
          id="get-started-btn"
          className="bg-gradient-to-r from-teal-500 to-cyan-500
          hover:from-teal-600 hover:to-cyan-600 text-white
          px-14 py-6 text-lg rounded-full shadow-2xl
          transition-all duration-300 hover:scale-105 active:scale-95 fade-up-3"
        >
          Get Started
          <Heart className="ml-2 w-5 h-5 fill-white/40"/>
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-5 opacity-70 fade-up-3">
          Free to use • Secure login • Your data stays private
        </p>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 max-w-4xl mx-auto pb-20">
        <h2 className="text-center text-xl font-[Outfit] font-bold text-gray-700 dark:text-gray-200 mb-8">
          Everything you need for mental wellness
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, label, desc, color }, i) => (
            <div key={label} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-[Outfit] font-semibold text-sm text-gray-800 dark:text-gray-100">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof strip */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-center">
          {[
            { val: "10K+", label: "Users helped" },
            { val: "15+", label: "Countries supported" },
            { val: "PHQ-9", label: "Evidence-based" },
            { val: "100%", label: "Private & secure" },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-2xl font-[Outfit] font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">{val}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;