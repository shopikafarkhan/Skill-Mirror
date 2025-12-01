import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Timer, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TimerMode = "stopwatch" | "countdown";

const Study = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>("countdown");
  
  // Elapsed time in seconds (always tracks actual study time)
  const [time, setTime] = useState(0);
  
  // Countdown target in seconds
  const [duration, setDuration] = useState(25 * 60); // Default 25 minutes
  
  // Input for custom duration
  const [durationInputMinutes, setDurationInputMinutes] = useState<string>("25");
  
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const nextTime = prevTime + 1;
          
          // Check if countdown session is complete
          if (mode === "countdown" && nextTime >= duration) {
            setIsRunning(false);
            setSessionComplete(true);
            toast({
              title: "🎉 Session Complete!",
              description: `Great job! You've completed your ${Math.floor(duration / 60)}-minute study session.`,
            });
            return duration; // Cap at duration
          }
          
          return nextTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, duration, mode, toast]);

  // Format seconds as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (mode === "countdown" && time >= duration && !sessionComplete) {
      // Reset if trying to start a completed session
      setTime(0);
      setSessionComplete(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setSessionComplete(false);
  };

  const applyDurationFromInput = () => {
    const mins = parseInt(durationInputMinutes, 10);
    if (isNaN(mins) || mins <= 0 || mins > 240) {
      toast({
        title: "Invalid duration",
        description: "Please enter a number between 1 and 240 minutes.",
        variant:destructive,
      });
      return;
    }
    
    const secs = mins * 60;
    setDuration(secs);
    if (time > secs) {
      setTime(0);
    }
    setSessionComplete(false);
    
    if (mode !== "countdown") {
      setMode("countdown");
    }
  };

  const quickSetDuration = (minutes: number) => {
    setDuration(minutes * 60);
    setDurationInputMinutes(minutes.toString());
    setTime(0);
    setSessionComplete(false);
    setMode("countdown");
    
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const switchToStopwatch = () => {
    setMode("stopwatch");
    setSessionComplete(false);
    if (isRunning && mode === "countdown" && time >= duration) {
      setTime(0);
    }
  };

  const handleSaveSession = async () => {
  const actualStudyTime = mode === "countdown" && sessionComplete ? duration : time;

  if (actualStudyTime === 0) {
    toast({
      title: "No study time to save",
      description: "Start studying first!",
      variant: "destructive", // <--- string, not identifier
    });
    return;
  }

  setSaving(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const durationMinutes = Math.floor(actualStudyTime / 60);
    const xpEarned = durationMinutes * 2;

    // Save study session
    const { error: sessionError } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        duration_minutes: durationMinutes,
        xp_earned: xpEarned,
        subject: subject || null,
        notes: notes || null,
        timer_mode: mode,
        target_duration: mode === "countdown" ? Math.floor(duration / 60) : null,
      } as any); // cast to any to avoid table typing issues

    if (sessionError) throw sessionError;

    // ====== TYPING HELP: local minimal type for the study_twin row ======
    type StudyTwinRow = {
      user_id: string;
      level: number;
      current_xp: number;
      xp_to_next_level: number;
      // add other columns you use (optional)
    };

    // Fetch study twin
    const { data: twinDataRaw } = await supabase
      .from("study_twin")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const twinData = twinDataRaw as StudyTwinRow | null;

    if (twinData) {
      // Use local typed values (still runtime values). We cast before update().
      const newXp = (twinData.current_xp ?? 0) + xpEarned;
      let newLevel = twinData.level ?? 0;
      let remainingXp = newXp;

      // Level up logic
      while (remainingXp >= (twinData.xp_to_next_level ?? (newLevel * 100 || 100))) {
        remainingXp -= (twinData.xp_to_next_level ?? (newLevel * 100 || 100));
        newLevel++;
      }

      // Build update payload and cast to any when sending to Supabase
      const updatePayload = {
        level: newLevel,
        current_xp: remainingXp,
        xp_to_next_level: newLevel * 100,
      };

      const { error: updateError } = await supabase
        .from<any>("study_twin") // tell TS to not infer table types here
        .update(updatePayload)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      if (newLevel > (twinData.level ?? 0)) {
        toast({
          title: "🎉 Level Up!",
          description: `Your study twin reached level ${newLevel}!`,
        });
      }
    }

    toast({
      title: "Session saved! 🎉",
      description: `You earned ${xpEarned} XP for ${durationMinutes} minutes of study!`,
    });

    // Reset form but keep settings
    handleReset();
    setSubject("");
    setNotes("");
  } catch (error: any) {
    console.error("Error saving session:", error);
    toast({
      title: "Failed to save session",
      description: error?.message ?? String(error),
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};


  // Calculate displayed time and progress
  const displayedSeconds = mode === "countdown" ? Math.max(duration - time, 0) : time;
  const progressPercentage = mode === "countdown" ? (time / duration) * 100 : 0;
  const willEarnXp = Math.floor(time / 60) * 2;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Study Timer</h1>
          <p className="text-muted-foreground">Track your study time and earn XP for your study twin!</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Badge 
                variant={mode === "countdown" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setMode("countdown")}
              >
                <Timer className="w-3 h-3 mr-1" />
                Countdown
              </Badge>
              <Badge 
                variant={mode === "stopwatch" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={switchToStopwatch}
              >
                <Clock className="w-3 h-3 mr-1" />
                Stopwatch
              </Badge>
            </div>
            
            <CardTitle className={`text-center text-6xl font-mono transition-colors ${
              sessionComplete ? 'text-green-600' : mode === 'countdown' && time >= duration * 0.8 ? 'text-orange-500' : ''
            }`}>
              {formatTime(displayedSeconds)}
            </CardTitle>
            
            <CardDescription className="text-center">
              {sessionComplete ? (
                <span className="text-green-600 font-semibold">Session Complete! 🎉</span>
              ) : mode === "countdown" ? (
                `Countdown: ${formatTime(time)} elapsed of ${formatTime(duration)}`
              ) : (
                "Stopwatch mode - track unlimited study time"
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progress Bar for Countdown */}
            {mode === "countdown" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-secondary/20 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-linear ${
                      sessionComplete ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={handleStartPause}
                variant={isRunning ? "outline" : "default"}
                disabled={sessionComplete}
                className="min-w-32"
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    {time === 0 ? "Start" : "Resume"}
                  </>
                )}
              </Button>
              <Button size="lg" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>

            {/* Duration Settings */}
            {mode === "countdown" && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Set Study Duration
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="240"
                      value={durationInputMinutes}
                      onChange={(e) => setDurationInputMinutes(e.target.value)}
                      placeholder="Minutes"
                      className="flex-1"
                      disabled={isRunning}
                    />
                    <Button 
                      onClick={applyDurationFromInput}
                      disabled={isRunning}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[5, 15, 25, 45, 60].map((minutes) => (
                    <Button
                      key={minutes}
                      size="sm"
                      variant="outline"
                      onClick={() => quickSetDuration(minutes)}
                      disabled={isRunning}
                      className="flex-1 min-w-0"
                    >
                      {minutes}m
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Add details about your study session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics, Physics, History"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="What did you study today? Any key takeaways?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSaveSession}
              disabled={saving || time === 0}
            >
              {saving ? (
                "Saving..."
              ) : sessionComplete ? (
                "Save Completed Session & Earn XP"
              ) : (
                `Save Session & Earn ${willEarnXp} XP`
              )}
            </Button>
          </CardContent>
        </Card>

        {/* XP Information */}
        {(time > 0 || sessionComplete) && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="font-semibold text-primary">
                  {sessionComplete ? "Session Complete! 🎉" : "Current Session"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "countdown" && `Target: ${formatTime(duration)} • `}
                  Elapsed: {formatTime(time)} • 
                  Will earn: <span className="font-bold text-primary">{willEarnXp} XP</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  2 XP per minute • Your study twin will level up!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Study;