import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Clock, Trophy, Sparkles, BookOpen, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const features = [
    {
      icon: Clock,
      title: "Study Timer",
      description: "Track your study sessions and earn XP for every minute",
    },
    {
      icon: Brain,
      title: "AI Notes Generator",
      description: "Generate comprehensive study notes on any topic instantly",
    },
    {
      icon: BookOpen,
      title: "Doubt Solver",
      description: "Get instant answers to your questions with AI assistance",
    },
    {
      icon: Trophy,
      title: "Study Twin",
      description: "Your personal study companion that levels up with you",
    },
    {
      icon: Target,
      title: "Progress Tracking",
      description: "Monitor your study stats and achieve your goals",
    },
    {
      icon: Sparkles,
      title: "Gamified Learning",
      description: "Stay motivated with XP, levels, and achievements",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Skill Mirror
          </h1>
          <p className="text-2xl md:text-3xl text-foreground/80 font-medium">
            Your Personal Study Twin
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your study routine with AI-powered notes, instant doubt solving, and a gamified learning experience that makes studying fun and effective.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Excel</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardContent className="py-16 text-center space-y-4">
            <h2 className="text-4xl font-bold">Ready to Level Up Your Studies?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of students who are studying smarter with Skill Mirror
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="mt-4 text-lg px-8">
              Start Your Journey
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
