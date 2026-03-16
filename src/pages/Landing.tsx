import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/swasthya-saathi-logo.jpeg";

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
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden
    bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50
    dark:from-gray-900 dark:via-slate-900 dark:to-black">

      <style>{`

      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500&display=swap');

      @keyframes zoomTitle {
        0% {opacity:0; transform:scale(0.6);}
        100% {opacity:1; transform:scale(1);}
      }

      @keyframes float {
        0% {transform:translateY(0px);}
        50% {transform:translateY(-18px);}
        100% {transform:translateY(0px);}
      }

      .zoom-title { animation: zoomTitle 1.2s ease forwards; }
      .float-title { animation: float 6s ease-in-out infinite; }

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

      `}</style>

      {/* floating blobs */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-teal-300/30 dark:bg-teal-700/20 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute bottom-20 right-16 w-56 h-56 bg-cyan-300/30 dark:bg-cyan-700/20 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-300/30 dark:bg-blue-700/20 rounded-full blur-3xl animate-pulse"/>

      <div className="relative z-10 text-center max-w-2xl">

        {/* logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl border border-white/30">
            <img src={logo} alt="SwasthyaSaathi" className="w-full h-full object-cover"/>
          </div>
        </div>

        {/* title */}
        <h1 className="text-5xl md:text-7xl font-[Outfit] font-bold
        bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600
        bg-clip-text text-transparent zoom-title float-title tracking-tight">
          SwasthyaSaathi
        </h1>

        {/* tagline */}
        <p className="text-gray-600 dark:text-gray-400 mt-5 mb-10 text-sm">
          An initiative for mental health, emotional balance and holistic wellbeing.
        </p>

        {/* quote */}
        <div className="glass rounded-3xl p-8 mb-10">

          <p className="text-xl md:text-2xl italic
          text-gray-700 dark:text-gray-200 leading-relaxed">
            “The greatest wealth is health.
            Care for your mind and your body will follow.”
          </p>

          <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
            Your wellness journey begins here.
          </p>

        </div>

        {/* single button */}
        <Button
          onClick={handleStart}
          size="lg"
          className="bg-gradient-to-r from-teal-500 to-cyan-500
          hover:from-teal-600 hover:to-cyan-600 text-white
          px-12 py-6 text-lg rounded-full shadow-xl
          transition-all duration-300 hover:scale-105"
        >
          Get Started
          <Heart className="ml-2 w-5 h-5"/>
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 opacity-70">
          Secure login • Your data stays private
        </p>

      </div>
    </div>
  );
};

export default Landing;