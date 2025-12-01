import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Clock, Brain, HelpCircle, BookOpen, TrendingUp, Award, Target, Zap, Calendar, Star, Rocket } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StudyTwin {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  character_type?: string;
  streak?: number; // Made optional since it might not exist in DB
}

interface Stats {
  totalStudyTime: number;
  totalNotes: number;
  totalDoubts: number;
  recentSessions: number;
  weeklyGoal: number;
  weeklyProgress: number;
  favoriteSubject: string;
}

const Dashboard = () => {
  const [studyTwin, setStudyTwin] = useState<StudyTwin | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudyTime: 0,
    totalNotes: 0,
    totalDoubts: 0,
    recentSessions: 0,
    weeklyGoal: 7,
    weeklyProgress: 0,
    favoriteSubject: "Mathematics",
  });
  const [loading, setLoading] = useState(true);
  const [dailyStreak, setDailyStreak] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Local typed shapes for results we expect (only fields we use)
    type StudyTwinRow = {
      user_id: string;
      level: number;
      current_xp: number;
      xp_to_next_level: number;
      character_type?: string | null;
      streak?: number | null;
    };

    type StudySessionRow = {
      duration_minutes?: number | null;
      subject?: string | null;
      created_at?: string | null;
    };

    // Fetch study twin (keep as any for call, but cast the returned data)
    const { data: twinDataRaw } = await supabase
      .from("study_twin")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const twinData = (twinDataRaw as unknown) as StudyTwinRow | null;

    if (twinData) {
      // merge defaults safely
      const studyTwinWithDefaults: StudyTwinRow = {
        level: twinData.level ?? 1,
        current_xp: twinData.current_xp ?? 0,
        xp_to_next_level: twinData.xp_to_next_level ?? 100,
        character_type: twinData.character_type ?? undefined,
        streak: twinData.streak ?? 0,
        user_id: twinData.user_id,
      };
      setStudyTwin(studyTwinWithDefaults);
    } else {
      // optional: set defaults if no twin exists yet
      setStudyTwin({
        level: 1,
        current_xp: 0,
        xp_to_next_level: 100,
        streak: 0,
      });
    }

    // Fetch sessions (cast to typed array)
    const { data: sessionsDataRaw } = await supabase
      .from("study_sessions")
      .select("duration_minutes, subject, created_at")
      .eq("user_id", user.id);

    const sessionsData = (sessionsDataRaw ?? []) as StudySessionRow[];

    // total study time (handle null/undefined durations)
    const totalTime = sessionsData.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

    // Calculate weekly progress
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklySessions = sessionsData.filter(s => {
      if (!s.created_at) return false;
      const created = new Date(s.created_at);
      return created >= startOfWeek;
    });

    const weeklyProgress = weeklySessions.length;

    // Calculate favorite subject
    const subjectCount = sessionsData.reduce<Record<string, number>>((acc, session) => {
      const subj = session.subject;
      if (subj) {
        acc[subj] = (acc[subj] || 0) + 1;
      }
      return acc;
    }, {});

    const favoriteSubject = Object.entries(subjectCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mathematics";

    // Calculate streak (simplified: if studied today, use twinData.streak or 1)
    const todaySessions = sessionsData.filter(s => {
      if (!s.created_at) return false;
      return new Date(s.created_at).toDateString() === today.toDateString();
    });

    const hasStudiedToday = todaySessions.length > 0;
    const currentStreak = hasStudiedToday ? (twinData?.streak ?? 1) : 0;

// Fetch materials count
const { count: notesCount } = await (supabase as any)
  .from("generated_materials")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id as any);

// Fetch doubts count
const { count: doubtsCount } = await (supabase as any)
  .from("doubts")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id as any);


    setStats({
      totalStudyTime: totalTime,
      totalNotes: notesCount || 0,
      totalDoubts: doubtsCount || 0,
      recentSessions: weeklyProgress,
      weeklyGoal: 7,
      weeklyProgress,
      favoriteSubject,
    });

    setDailyStreak(currentStreak);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    setLoading(false);
  }
};


  const xpProgress = studyTwin 
    ? (studyTwin.current_xp / studyTwin.xp_to_next_level) * 100 
    : 0;

  const weeklyProgressPercentage = (stats.weeklyProgress / stats.weeklyGoal) * 100;

  const getLevelBadge = (level: number) => {
    if (level < 5) return { label: "Beginner", color: "bg-blue-100 text-blue-800" };
    if (level < 10) return { label: "Intermediate", color: "bg-green-100 text-green-800" };
    if (level < 15) return { label: "Advanced", color: "bg-purple-100 text-purple-800" };
    return { label: "Expert", color: "bg-orange-100 text-orange-800" };
  };

  const levelBadge = studyTwin ? getLevelBadge(studyTwin.level) : null;

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-12 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Back, Scholar! 🎓
            </h1>
            <p className="text-muted-foreground text-lg">
              Your learning journey at a glance
            </p>
          </div>
          <div className="flex gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Badge>
            {dailyStreak > 0 && (
              <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {dailyStreak} day streak
              </Badge>
            )}
          </div>
        </div>

        {/* Study Twin & Weekly Goals */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Study Twin Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-blue-50/50 to-accent/5 border-primary/20">
            <div className="absolute top-4 right-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">🦉</span>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Your Study Twin</CardTitle>
              </div>
              {levelBadge && (
                <Badge className={`w-fit ${levelBadge.color}`}>
                  {levelBadge.label}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">Level {studyTwin?.level || 1}</p>
                  <p className="text-muted-foreground text-sm">
                    {studyTwin?.current_xp || 0} / {studyTwin?.xp_to_next_level || 100} XP
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next Level</p>
                  <p className="text-xl font-semibold">Level {(studyTwin?.level || 0) + 1}</p>
                </div>
              </div>
              <Progress value={xpProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(xpProgress)}%</span>
              </div>
              {studyTwin && (
                <p className="text-sm text-center text-muted-foreground">
                  {studyTwin.xp_to_next_level - studyTwin.current_xp} XP to level up
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Goals Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100/50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <CardTitle>Weekly Goals</CardTitle>
              </div>
              <CardDescription>
                {stats.weeklyProgress >= stats.weeklyGoal ? 
                  "🎉 You've completed your weekly goal!" : 
                  "Complete study sessions to reach your goal"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.weeklyProgress}/{stats.weeklyGoal}
                  </p>
                  <p className="text-muted-foreground text-sm">Sessions this week</p>
                </div>
                <div className="w-16 h-16 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(weeklyProgressPercentage)}%
                    </span>
                  </div>
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-green-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (weeklyProgressPercentage / 100) * 251.2}
                      strokeLinecap="round"
                      className="text-green-600 transition-all duration-1000 ease-out"
                    />
                  </svg>
                </div>
              </div>
              <Progress value={weeklyProgressPercentage} className="h-2 bg-green-200" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Weekly Progress</span>
                <span>{Math.round(weeklyProgressPercentage)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep up the great work!
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">AI Notes Generated</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Study materials created
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Doubts Solved</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <HelpCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDoubts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions answered
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Favorite Subject</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Star className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stats.favoriteSubject}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Most studied topic
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Insights */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Start your next learning session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
                  variant="outline"
                  asChild
                >
                  <a href="/study">
                    <Clock className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">Start Studying</p>
                      <p className="text-sm text-muted-foreground">Track time & earn XP</p>
                    </div>
                  </a>
                </Button>
                
                <Button 
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
                  variant="outline"
                  asChild
                >
                  <a href="/notes">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">Generate Notes</p>
                      <p className="text-sm text-muted-foreground">AI-powered learning</p>
                    </div>
                  </a>
                </Button>
                
                <Button 
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
                  variant="outline"
                  asChild
                >
                  <a href="/doubts">
                    <HelpCircle className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">Ask a Question</p>
                      <p className="text-sm text-muted-foreground">Get instant answers</p>
                    </div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Study Insights */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Study Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Level</span>
                <Badge variant="secondary">Level {studyTwin?.level || 1}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total XP Earned</span>
                <span className="font-semibold">{studyTwin?.current_xp || 0} XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sessions This Week</span>
                <span className="font-semibold">{stats.recentSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Learning Streak</span>
                <span className="font-semibold flex items-center gap-1">
                  <Zap className="h-3 w-3 text-orange-500" />
                  {dailyStreak} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motivation Quote */}
        <Card className="text-center bg-gradient-to-r from-primary/5 to-accent/5 border-dashed">
          <CardContent className="pt-6">
            <blockquote className="text-lg italic text-muted-foreground">
              "The beautiful thing about learning is that no one can take it away from you."
            </blockquote>
            <p className="text-sm text-muted-foreground mt-2">- B.B. King</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;