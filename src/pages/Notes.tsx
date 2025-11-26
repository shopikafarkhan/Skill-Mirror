import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save } from "lucide-react";

const Notes = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [detailLevel, setDetailLevel] = useState("medium");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate notes",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-notes", {
        body: { topic, subject, detailLevel },
      });

      if (error) throw error;

      setGeneratedNotes(data.notes);
      toast({
        title: "Notes generated!",
        description: "Your study notes are ready",
      });
    } catch (error: any) {
      console.error("Error generating notes:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedNotes) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("generated_materials")
        .insert({
          user_id: user.id,
          title: topic,
          subject: subject || null,
          content: generatedNotes,
          material_type: "notes",
        });

      if (error) throw error;

      toast({
        title: "Notes saved!",
        description: "Your notes have been saved to your materials",
      });
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI Notes Generator</h1>
          <p className="text-muted-foreground">Generate comprehensive study notes on any topic instantly</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Notes</CardTitle>
            <CardDescription>Tell us what you want to learn about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Photosynthesis, World War II, Quadratic Equations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Biology, History, Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-level">Detail Level</Label>
                <Select value={detailLevel} onValueChange={setDetailLevel}>
                  <SelectTrigger id="detail-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Notes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedNotes && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Notes</CardTitle>
                <CardDescription>AI-generated study material</CardDescription>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatedNotes}
                onChange={(e) => setGeneratedNotes(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Notes;