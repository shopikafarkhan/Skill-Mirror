import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, Copy, Download, History, Zap, BookOpen, Target, Lightbulb, Brain, FileText } from "lucide-react";

interface NoteHistory {
  id: string;
  title: string;
  subject: string | null;
  content: string;
  created_at: string;
}

const Notes = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [detailLevel, setDetailLevel] = useState("comprehensive");
  const [format, setFormat] = useState("structured");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [noteHistory, setNoteHistory] = useState<NoteHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const popularSubjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "History", "Geography", "English Literature", "Economics", "Psychology"
  ];

  const noteFormats = [
    { value: "structured", label: "Structured Notes", description: "Clear headings and bullet points" },
    { value: "outline", label: "Study Outline", description: "Hierarchical topic breakdown" },
    { value: "summary", label: "Executive Summary", description: "Concise key points" },
    { value: "qna", label: "Q&A Format", description: "Questions and detailed answers" }
  ];

  const detailLevels = [
    { value: "concise", label: "Concise", description: "Key points only" },
    { value: "comprehensive", label: "Comprehensive", description: "Balanced detail" },
    { value: "in-depth", label: "In-depth", description: "Thorough coverage" }
  ];

  useEffect(() => {
    if (activeTab === "history") {
      fetchNoteHistory();
    }
  }, [activeTab]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to generate notes");

      const { data, error } = await supabase.functions.invoke("generate-notes", {
        body: { 
          topic: topic.trim(),
          subject: subject.trim() || "General",
          detailLevel,
          format,
          userId: user.id
        },
      });

      if (error) throw error;

      if (!data?.notes) {
        throw new Error("No notes generated");
      }

      setGeneratedNotes(data.notes);
      toast({
        title: "🎉 Notes Generated!",
        description: "Your AI-powered study notes are ready",
      });

      // Refresh history
      await fetchNoteHistory();
    } catch (error: any) {
      console.error("Error generating notes:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate notes. Please try again.",
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

    // Build payload only with columns that definitely exist
    const payload: Record<string, any> = {
      user_id: user.id,
      title: topic,
      subject: subject || null,
      content: generatedNotes,
      material_type: "notes",
      format: format
    };

    // Only include detail_level if you know the DB has it
    // (or if detailLevel is defined and you added the column)
    if (typeof detailLevel !== "undefined" && detailLevel !== null) {
      payload.detail_level = detailLevel;
    }

    // Insert - cast to any to avoid TS generic overload problems
    const { error } = await (supabase as any)
      .from("generated_materials")
      .insert([payload]);

    if (error) throw error;

    toast({
      title: "Notes saved! 📚",
      description: "Your notes have been added to your study materials",
    });

    // Refresh history
    await fetchNoteHistory();
  } catch (error: any) {
    console.error("Error saving notes:", error);
    toast({
      title: "Save failed",
      description: error?.message || "Failed to save notes. Please try again.",
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};


  const fetchNoteHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("generated_materials")
        .select("id, title, subject, content, created_at")
        .eq("user_id", user.id)
        .eq("material_type", "notes")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setNoteHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(generatedNotes);
    toast({
      title: "Copied!",
      description: "Notes copied to clipboard",
    });
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([generatedNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Notes saved as text file",
    });
  };

  const loadPreviousNote = (note: NoteHistory) => {
    setTopic(note.title);
    setSubject(note.subject || "");
    setGeneratedNotes(note.content);
    setActiveTab("generate");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AI Notes Generator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform any topic into comprehensive, well-structured study notes with advanced AI
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Notes
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2"
              onClick={fetchNoteHistory}
            >
              <History className="h-4 w-4" />
              Note History
            </TabsTrigger>
          </TabsList>

          {/* Generate Notes Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Create Study Notes
                    </CardTitle>
                    <CardDescription>
                      Specify your topic and preferences to generate perfect study notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="topic" className="text-base font-semibold">
                        Study Topic <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Quantum Mechanics, French Revolution, Machine Learning Algorithms, Cellular Respiration..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="text-base"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Be specific for better results</span>
                        <span>{topic.length}/200</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Subject Area</Label>
                      <div className="space-y-3">
                        <Input
                          placeholder="e.g., Advanced Physics, World History, Computer Science..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          list="popular-subjects"
                        />
                        <datalist id="popular-subjects">
                          {popularSubjects.map((subject) => (
                            <option key={subject} value={subject} />
                          ))}
                        </datalist>
                        
                        {/* Quick Subject Selection */}
                        <div className="flex flex-wrap gap-2">
                          {popularSubjects.slice(0, 5).map((subjectItem) => (
                            <Badge
                              key={subjectItem}
                              variant={subject === subjectItem ? "default" : "outline"}
                              className="cursor-pointer hover:bg-primary/10 transition-colors"
                              onClick={() => setSubject(subjectItem)}
                            >
                              {subjectItem}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Detail Level</Label>
                        <Select value={detailLevel} onValueChange={setDetailLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {detailLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                <div className="flex flex-col">
                                  <span>{level.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {level.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Note Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {noteFormats.map((formatItem) => (
                              <SelectItem key={formatItem.value} value={formatItem.value}>
                                <div className="flex flex-col">
                                  <span>{formatItem.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatItem.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleGenerate}
                      disabled={generating || !topic.trim()}
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          AI is Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Smart Notes
                        </>
                      )}
                    </Button>

                    {generating && (
                      <div className="space-y-2">
                        <Progress value={33} className="h-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          AI is analyzing the topic and structuring your notes...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Generated Notes */}
                {generatedNotes && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="bg-green-50/50 dark:bg-green-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <FileText className="h-5 w-5" />
                            Generated Notes
                          </CardTitle>
                          <CardDescription className="text-green-600 dark:text-green-400">
                            AI-powered study material for "{topic}"
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCopyNotes}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDownloadNotes}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {saving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="prose prose-lg max-w-none dark:prose-invert">
                        <div className="bg-green-50/30 dark:bg-green-950/10 p-6 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200 font-sans">
                            {generatedNotes}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Tips Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">🎯 Be Specific</p>
                      <p className="text-muted-foreground">
                        Instead of "Physics," try "Newton's Laws of Motion with real-world examples"
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">📚 Use Proper Terms</p>
                      <p className="text-muted-foreground">
                        Include technical terminology for more accurate and detailed content
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">⚡ Choose Format Wisely</p>
                      <p className="text-muted-foreground">
                        Use Q&A for exam prep, structured notes for comprehensive learning
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <strong>AI-Powered:</strong> Notes are generated using advanced AI trained on academic content
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Your Generated Notes
                </CardTitle>
                <CardDescription>
                  Access your previously created study materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : noteHistory.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-muted-foreground">No notes generated yet</p>
                    <Button onClick={() => setActiveTab("generate")}>
                      Create Your First Notes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noteHistory.map((note) => (
                      <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                {note.subject && (
                                  <Badge variant="secondary" className="text-xs">
                                    {note.subject}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(note.created_at)}
                                </span>
                              </div>
                              <h4 className="font-semibold text-lg">{note.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {note.content.substring(0, 150)}...
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPreviousNote(note)}
                            >
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notes;