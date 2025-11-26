import { ReactNode, useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Home, BookOpen, Brain, HelpCircle, Trophy, LogOut, Sparkles } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Skill Mirror
              </span>
            </NavLink>
            
            <div className="flex items-center gap-2">
              <NavLink to="/dashboard">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}
              </NavLink>
              <NavLink to="/study">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study
                  </Button>
                )}
              </NavLink>
              <NavLink to="/notes">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Notes
                  </Button>
                )}
              </NavLink>
              <NavLink to="/doubts">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Doubts
                  </Button>
                )}
              </NavLink>
              <NavLink to="/twin">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="sm">
                    <Trophy className="h-4 w-4 mr-2" />
                    Study Twin
                  </Button>
                )}
              </NavLink>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;