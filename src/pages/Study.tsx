import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw } from "lucide-react";

const Study = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleSaveSession = async () => {
    if (time === 0) {
      toast({
        title: "No time to save",
        description: "Start the timer first!",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const durationMinutes = Math.floor(time / 60);
      const xpEarned = durationMinutes * 2; // 2 XP per minute

      // Save study session
      const { error: sessionError } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          xp_earned: xpEarned,
          subject: subject || null,
          notes: notes || null,
        });

      if (sessionError) throw sessionError;

      // Update study twin XP
      const { data: twinData } = await supabase
        .from("study_twin")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (twinData) {
        const newXp = twinData.current_xp + xpEarned;
        let newLevel = twinData.level;
        let remainingXp = newXp;

        // Level up logic
        while (remainingXp >= twinData.xp_to_next_level) {
          remainingXp -= twinData.xp_to_next_level;
          newLevel++;
        }

        const { error: updateError } = await supabase
          .from("study_twin")
          .update({
            level: newLevel,
            current_xp: remainingXp,
            xp_to_next_level: newLevel * 100,
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        if (newLevel > twinData.level) {
          toast({
            title: "🎉 Level Up!",
            description: `Your study twin reached level ${newLevel}!`,
          });
        }
      }

      toast({
        title: "Session saved!",
        description: `You earned ${xpEarned} XP for ${durationMinutes} minutes of study!`,
      });

      // Reset form
      handleReset();
      setSubject("");
      setNotes("");
    } catch (error: any) {
      console.error("Error saving session:", error);
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Study Timer</h1>
          <p className="text-muted-foreground">Track your study time and earn XP!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-6xl font-mono">{formatTime(time)}</CardTitle>
            <CardDescription className="text-center">
              Earn 2 XP per minute of study
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={handleStartPause}
                variant={isRunning ? "outline" : "default"}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start
                  </>
                )}
              </Button>
              <Button size="lg" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

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
                placeholder="What did you study today?"
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
              {saving ? "Saving..." : "Save Session & Earn XP"}
            </Button>
          </CardContent>
        </Card>

        {time > 0 && (
          <div className="text-center p-4 bg-secondary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              You'll earn <span className="font-bold text-primary">{Math.floor(time / 60) * 2} XP</span> when you save this session!
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Study;