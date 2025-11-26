import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { Trophy, TrendingUp, Award, Target } from "lucide-react";

interface StudyTwin {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  character_type: string;
}

interface RecentSession {
  duration_minutes: number;
  xp_earned: number;
  subject: string;
  created_at: string;
}

const Twin = () => {
  const [studyTwin, setStudyTwin] = useState<StudyTwin | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTwinData();
  }, []);

  const fetchTwinData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch study twin
      const { data: twinData } = await supabase
        .from("study_twin")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (twinData) setStudyTwin(twinData);

      // Fetch recent sessions
      const { data: sessionsData } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (sessionsData) setRecentSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching twin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !studyTwin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading your study twin...</p>
        </div>
      </Layout>
    );
  }

  const xpProgress = (studyTwin.current_xp / studyTwin.xp_to_next_level) * 100;
  const xpNeeded = studyTwin.xp_to_next_level - studyTwin.current_xp;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Your Study Twin</h1>
          <p className="text-muted-foreground">Your companion grows as you learn!</p>
        </div>

        {/* Main Twin Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Character Display */}
              <div className="text-9xl animate-bounce">🦉</div>
              
              {/* Level Info */}
              <div className="text-center space-y-2">
                <h2 className="text-5xl font-bold">Level {studyTwin.level}</h2>
                <p className="text-2xl text-muted-foreground">
                  {studyTwin.current_xp} / {studyTwin.xp_to_next_level} XP
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-2">
                <Progress value={xpProgress} className="h-4" />
                <p className="text-sm text-center text-muted-foreground">
                  {xpNeeded} XP needed to reach Level {studyTwin.level + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Level</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studyTwin.level}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep studying to level up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studyTwin.current_xp}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Experience points earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Milestone</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{xpNeeded}</div>
              <p className="text-xs text-muted-foreground mt-1">
                XP until next level
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Study Sessions
            </CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No study sessions yet. Start studying to earn XP!
              </p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {session.subject || "General Study"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.duration_minutes} minutes • {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">+{session.xp_earned} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivation Card */}
        <Card className="bg-gradient-to-r from-secondary/20 to-accent/20">
          <CardContent className="py-6 text-center">
            <p className="text-lg font-medium">
              💡 Pro Tip: Study for 25 minutes to earn 50 XP!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Consistent daily study sessions help you level up faster
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Twin;