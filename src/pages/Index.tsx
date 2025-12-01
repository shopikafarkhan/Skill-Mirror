import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Clock, 
  Trophy, 
  Sparkles, 
  BookOpen, 
  Target, 
  Zap, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Shield,
  Infinity
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const features = [
    {
      icon: Clock,
      title: "Smart Study Timer",
      description: "Track your study sessions with AI-powered insights and earn XP for every productive minute",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: Brain,
      title: "AI Notes Generator",
      description: "Transform any topic into comprehensive, easy-to-understand notes with advanced AI",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      icon: BookOpen,
      title: "Instant Doubt Solver",
      description: "Get step-by-step explanations and answers to your questions in seconds",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: Trophy,
      title: "Study Twin Pro",
      description: "Your personal AI companion that learns with you and celebrates your progress",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      icon: Target,
      title: "Progress Analytics",
      description: "Advanced tracking with insights on your study patterns and improvement areas",
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20"
    },
    {
      icon: Zap,
      title: "Gamified Learning",
      description: "Stay motivated with levels, achievements, streaks, and competitive leaderboards",
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
    },
  ];

  const stats = [
    { number: "10K+", label: "Active Students" },
    { number: "500K+", label: "Questions Solved" },
    { number: "50K+", label: "Study Hours" },
    { number: "99%", label: "Satisfaction Rate" },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Medical Student",
      content: "Skill Mirror transformed how I study. The AI notes are incredibly detailed and the doubt solver saved me hours of research!",
      avatar: "👩‍⚕️"
    },
    {
      name: "Marcus Rodriguez",
      role: "Engineering Student",
      content: "The gamification keeps me motivated. Leveling up my study twin makes studying feel like an achievement!",
      avatar: "👨‍💻"
    },
    {
      name: "Emily Thompson",
      role: "High School Student",
      content: "I went from struggling with math to top of my class. The step-by-step explanations are game-changing!",
      avatar: "👩‍🎓"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Skill Mirror
          </span>
        </div>
        <Button onClick={() => navigate("/auth")} className="gap-2">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center space-y-8 max-w-6xl mx-auto">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
            🚀 Trusted by 10,000+ students worldwide
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Study Smarter
            </span>
            <br />
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Meet your AI study companion that makes learning personalized, engaging, and incredibly effective. 
            <span className="font-semibold text-foreground"> Level up your knowledge while leveling up your Study Twin.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-lg px-12 py-6 h-auto gap-3 group"
            >
              <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Start Free Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")} 
              className="text-lg px-12 py-6 h-auto"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="px-4 py-1 text-sm">
            ✨ AI-Powered Features
          </Badge>
          <h2 className="text-4xl md:text1-5xl font-bold">Everything You Need to Excel</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced tools designed to transform your learning experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 ${feature.bgColor}`}
            >
              <CardContent className="p-8">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="px-4 py-1 text-sm">
            💬 What Students Say
          </Badge>
          <h2 className="text-4xl md:text1-5xl font-bold">Loved by Students Worldwide</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-full" />
              <CardContent className="p-8 relative">
                <div className="text-4xl mb-4">{testimonial.avatar}</div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32" />
          
          <CardContent className="py-20 text-center space-y-6 relative z-10">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
              🎉 Start Your Journey Today
            </Badge>
            
            <h2 className="text-4xl md:text1-5xl font-bold">
              Ready to Transform Your Study Experience?
            </h2>
            
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of students achieving academic excellence with their AI Study Twin
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Free forever for basic features</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Setup in under 2 minutes</span>
              </div>
            </div>

            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate("/auth")} 
              className="mt-6 text-lg px-12 py-6 h-auto gap-3 group font-semibold"
            >
              <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Create Your Study Twin
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-sm opacity-80">
              Join 10,000+ students already learning smarter
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Skill Mirror
            </span>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            © 2024 Skill Mirror. Empowering students worldwide with AI.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Button variant="link" className="text-muted-foreground">Privacy</Button>
            <Button variant="link" className="text-muted-foreground">Terms</Button>
            <Button variant="link" className="text-muted-foreground">Contact</Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;