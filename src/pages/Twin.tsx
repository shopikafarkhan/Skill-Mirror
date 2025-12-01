import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Trophy, TrendingUp, Award, Target, Clock, Calendar, Star, Zap, Users, Crown } from "lucide-react";

interface StudyTwin {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  character_type: string;
  total_study_minutes: number;
  total_sessions: number;
  streak_days: number;
}

interface RecentSession {
  duration_minutes: number;
  xp_earned: number;
  subject: string;
  created_at: string;
  timer_mode: string;
}

interface WeeklyStats {
  date: string;
  total_minutes: number;
  sessions: number;
}

const Twin = () => {
  const [studyTwin, setStudyTwin] = useState<StudyTwin | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchTwinData();
  }, []);

  const fetchTwinData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Local shapes for TS (only include fields you actually use)
    type StudyTwinRow = {
      user_id?: string;
      level?: number;
      current_xp?: number;
      xp_to_next_level?: number;
      character_type?: string | null;
      streak_days?: number | null;
      // other optional columns you may have...
    };

    type SessionRow = {
      duration_minutes?: number | null;
      created_at?: string | null;
      xp_earned?: number | null;
      subject?: string | null;
      timer_mode?: string | null;
      // other optional columns...
    };

    // Fetch study twin (cast returned data to our local type)
    const { data: twinDataRaw } = await supabase
      .from("study_twin")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const twinData = (twinDataRaw as unknown) as StudyTwinRow | null;

    // If twin exists, compute totals using typed session results
    if (twinData) {
      // Fetch sessions to compute totals (cast result)
      const { data: sessionsRaw } = await supabase
        .from("study_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id);

      const sessions = (sessionsRaw ?? []) as SessionRow[];
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
      const totalSessions = sessions.length;

      // Compute a simple streak: check most recent created_at
      const { data: recentSessionsRaw } = await supabase
        .from("study_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      const recentSessionsList = (recentSessionsRaw ?? []) as SessionRow[];
      let streak = 0;
      const today = new Date();
      if (recentSessionsList.length > 0 && recentSessionsList[0].created_at) {
        const lastSession = new Date(recentSessionsList[0].created_at!);
        const diffDays = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
        streak = diffDays === 0 ? (twinData.streak_days ?? 0) + 1 : 0;
      }

      // Build StudyTwin object for state (use defaults where necessary)
      const studyTwinState: StudyTwin = {
        level: twinData.level ?? 1,
        current_xp: twinData.current_xp ?? 0,
        xp_to_next_level: twinData.xp_to_next_level ?? 100,
        character_type: (twinData.character_type ?? "owl") as string,
        total_study_minutes: totalMinutes,
        total_sessions: totalSessions,
        streak_days: streak,
      };

      setStudyTwin(studyTwinState);
    } else {
      // No twin found — set safe defaults
      setStudyTwin({
        level: 1,
        current_xp: 0,
        xp_to_next_level: 100,
        character_type: "owl",
        total_study_minutes: 0,
        total_sessions: 0,
        streak_days: 0,
      });
    }

    // Fetch recent sessions (full rows, cast to SessionRow[])
    const { data: sessionsDataRaw } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const sessionsData = (sessionsDataRaw ?? []) as SessionRow[];
    // Map into RecentSession[] shape expected by state
    const mappedRecent = sessionsData.map((s) => ({
      duration_minutes: s.duration_minutes ?? 0,
      xp_earned: s.xp_earned ?? Math.floor((s.duration_minutes ?? 0) / 60) * 2,
      subject: s.subject ?? "General Study",
      created_at: s.created_at ?? new Date().toISOString(),
      timer_mode: s.timer_mode ?? "unknown",
    })) as RecentSession[];

    setRecentSessions(mappedRecent);

    // Weekly stats: fetch sessions for last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: weeklyDataRaw } = await supabase
      .from("study_sessions")
      .select("duration_minutes, created_at")
      .eq("user_id", user.id)
      .gte("created_at", oneWeekAgo.toISOString());

    const weeklyData = (weeklyDataRaw ?? []) as SessionRow[];

    const statsByDay: WeeklyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = weeklyData.filter(s => (s.created_at ?? "").split('T')[0] === dateStr);

      statsByDay.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total_minutes: daySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0),
        sessions: daySessions.length,
      });
    }
    setWeeklyStats(statsByDay);

  } catch (error) {
    console.error("Error fetching twin data:", error);
  } finally {
    setLoading(false);
  }
};


  const getCharacterImage = (characterType: string) => {
    const characters: Record<string, string> = {
      owl: "🦉",
      fox: "🦊",
      panda: "🐼",
      cat: "🐱",
      robot: "🤖",
      wizard: "🧙",
      astronaut: "👨‍🚀",
      dragon: "🐉"
    };
    return characters[characterType] || "👤";
  };

  const getLevelTitle = (level: number) => {
    if (level < 5) return "Beginner Scholar";
    if (level < 10) return "Dedicated Learner";
    if (level < 15) return "Knowledge Seeker";
    if (level < 20) return "Academic Explorer";
    return "Master Scholar";
  };

  const getMilestoneRewards = (level: number) => {
    const rewards = [
      { level: 5, reward: "New character unlocked" },
      { level: 10, reward: "Special study background" },
      { level: 15, reward: "Achievement badge" },
      { level: 20, reward: "Master title" },
    ];
    return rewards.find(r => r.level > level) || null;
  };

  if (loading || !studyTwin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-pulse text-6xl">🦉</div>
          <p className="text-muted-foreground">Loading your study twin...</p>
          <div className="w-48">
            <Progress value={50} className="h-2" />
          </div>
        </div>
      </Layout>
    );
  }

  const xpProgress = (studyTwin.current_xp / studyTwin.xp_to_next_level) * 100;
  const xpNeeded = studyTwin.xp_to_next_level - studyTwin.current_xp;
  const nextMilestone = getMilestoneRewards(studyTwin.level);
  const hoursStudied = Math.floor(studyTwin.total_study_minutes / 60);
  const minutesStudied = studyTwin.total_study_minutes % 60;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Study Twin</h1>
            <p className="text-muted-foreground">Your companion grows with every study session!</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Crown className="w-4 h-4 mr-2" />
            {getLevelTitle(studyTwin.level)}
          </Badge>
        </div>

        {/* Main Twin Card */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Character Display */}
          <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                    <span className="text-8xl animate-bounce">
                      {getCharacterImage(studyTwin.character_type)}
                    </span>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Level {studyTwin.level}
                    </Badge>
                    <h2 className="text-3xl font-bold">{studyTwin.character_type.charAt(0).toUpperCase() + studyTwin.character_type.slice(1)}</h2>
                    <p className="text-muted-foreground mt-1">Your study companion</p>
                  </div>
                </div>
                
                <div className="space-y-6 min-w-[300px]">
                  {/* XP Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Level Progress</span>
                      <span>{studyTwin.current_xp} / {studyTwin.xp_to_next_level} XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-3" />
                    <p className="text-xs text-center text-muted-foreground">
                      {xpNeeded} XP to Level {studyTwin.level + 1}
                    </p>
                  </div>

                  {/* Next Milestone */}
                  {nextMilestone && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Next Milestone</span>
                      </div>
                      <p className="text-sm">
                        Reach <span className="font-bold">Level {nextMilestone.level}</span> to unlock:
                      </p>
                      <p className="text-sm text-primary font-semibold mt-1">
                        {nextMilestone.reward}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Zap className="w-4 h-4 mr-2" />
                      Study Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <Badge variant="secondary">
                    {studyTwin.streak_days} days
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Study</span>
                  <span className="font-semibold">
                    {hoursStudied}h {minutesStudied}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  <span className="font-semibold">{studyTwin.total_sessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">XP/Minute</span>
                  <span className="font-semibold">2.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                  <Trophy className="h3 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{studyTwin.level}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getLevelTitle(studyTwin.level)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                  <Award className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{studyTwin.current_xp}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accumulated experience
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Level</CardTitle>
                  <Target className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{xpNeeded}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    XP needed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>Your study pattern for the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-32 gap-2">
                  {weeklyStats.map((day, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="text-xs text-muted-foreground mb-2">{day.date}</div>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          day.total_minutes > 0 ? 'bg-primary' : 'bg-secondary/20'
                        }`}
                        style={{ 
                          height: Math.min((day.total_minutes / 60) * 100, 100) 
                        }}
                        title={`${day.total_minutes} minutes, ${day.sessions} sessions`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
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
                  <div className="text-center py-8 space-y-4">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No study sessions yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start your first session to earn XP for your twin!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session, index) => (
                      <Card key={index} className="hover:bg-accent/5 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {session.subject || "General Study"}
                                </p>
                                {session.timer_mode && (
                                  <Badge variant="outline" className="text-xs">
                                    {session.timer_mode}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.duration_minutes} min
                                </span>
                                <span>
                                  {new Date(session.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">+{session.xp_earned} XP</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.floor(session.xp_earned / 2)} XP/min
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Study Distribution</CardTitle>
                  <CardDescription>Time spent by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">No Subject</span>
                      <span className="font-semibold">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mathematics</span>
                      <span className="font-semibold">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Science</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Languages</span>
                      <span className="font-semibold">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Efficiency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-R">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Average Session</span>
                        <span className="font-semibold">25 min</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Focus Score</span>
                        <span className="font-semibold">82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Consistency</span>
                        <span className="font-semibold">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "First Timer", description: "Complete your first study session", earned: studyTwin.total_sessions > 0 },
                { title: "Dedicated Learner", description: "Study for 10 hours total", earned: hoursStudied >= 10 },
                { title: "Streak Master", description: "7-day study streak", earned: studyTwin.streak_days >= 7 },
                { title: "Level Up!", description: "Reach level 5", earned: studyTwin.level >= 5 },
                { title: "Consistent Scholar", description: "Complete 50 sessions", earned: studyTwin.total_sessions >= 50 },
                { title: "XP Collector", description: "Earn 1000 XP total", earned: studyTwin.current_xp >= 1000 },
              ].map((achievement, index) => (
                <Card key={index} className={achievement.earned ? "border-primary" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${achievement.earned ? 'bg-primary/10' : 'bg-secondary/20'}`}>
                        <Trophy className={`w-6 h-6 ${achievement.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <Badge variant={achievement.earned ? "default" : "outline"} className="mt-2">
                          {achievement.earned ? "Unlocked" : "Locked"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Motivation Card */}
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready to level up? 🚀</h3>
                <p className="text-sm text-muted-foreground">
                  Just {xpNeeded} XP until Level {studyTwin.level + 1}
                </p>
              </div>
              <Button size="lg" className="gap-2">
                <Zap className="w-4 h-4" />
                Start Study Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Twin;