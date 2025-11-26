import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Clock, Brain, HelpCircle, BookOpen, TrendingUp, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StudyTwin {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
}

interface Stats {
  totalStudyTime: number;
  totalNotes: number;
  totalDoubts: number;
  recentSessions: number;
}

const Dashboard = () => {
  const [studyTwin, setStudyTwin] = useState<StudyTwin | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudyTime: 0,
    totalNotes: 0,
    totalDoubts: 0,
    recentSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

      // Fetch total study time
      const { data: sessionsData } = await supabase
        .from("study_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id);

      const totalTime = sessionsData?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      // Fetch recent sessions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentCount } = await supabase
        .from("study_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      // Fetch materials count
      const { count: notesCount } = await supabase
        .from("generated_materials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch doubts count
      const { count: doubtsCount } = await supabase
        .from("doubts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        totalStudyTime: totalTime,
        totalNotes: notesCount || 0,
        totalDoubts: doubtsCount || 0,
        recentSessions: recentCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const xpProgress = studyTwin 
    ? (studyTwin.current_xp / studyTwin.xp_to_next_level) * 100 
    : 0;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome Back, Learner! 🎓</h1>
          <p className="text-muted-foreground">Here's your study progress at a glance</p>
        </div>

        {/* Study Twin Card */}
        {studyTwin && (
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Your Study Twin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">Level {studyTwin.level}</p>
                  <p className="text-muted-foreground">
                    {studyTwin.current_xp} / {studyTwin.xp_to_next_level} XP
                  </p>
                </div>
                <div className="text-6xl">🦉</div>
              </div>
              <Progress value={xpProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {studyTwin.xp_to_next_level - studyTwin.current_xp} XP to next level
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m</div>
              <p className="text-xs text-muted-foreground">
                Keep up the great work!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Notes Generated</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
              <p className="text-xs text-muted-foreground">
                Study materials created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doubts Solved</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDoubts}</div>
              <p className="text-xs text-muted-foreground">
                Questions answered by AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentSessions}</div>
              <p className="text-xs text-muted-foreground">
                Study sessions completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <a href="/study" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Start Studying</p>
                  <p className="text-sm text-muted-foreground">Track your time</p>
                </div>
              </a>
              <a href="/notes" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Generate Notes</p>
                  <p className="text-sm text-muted-foreground">AI-powered</p>
                </div>
              </a>
              <a href="/doubts" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <HelpCircle className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Ask a Question</p>
                  <p className="text-sm text-muted-foreground">Get instant answers</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </Layout>
  );
};

export default Dashboard;