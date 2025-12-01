import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Send, Image as ImageIcon, X, Loader2, Brain, History, Zap, Lightbulb } from "lucide-react";

interface DoubtHistory {
  id: string;
  question: string;
  answer: string;
  subject: string | null;
  created_at: string;
}

const Doubts = () => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [answer, setAnswer] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [solving, setSolving] = useState(false);
  const [activeTab, setActiveTab] = useState("ask");
  const [doubtHistory, setDoubtHistory] = useState<DoubtHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const popularSubjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", 
    "History", "Geography", "English", "Computer Science"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSolveDoubt = async () => {
    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }

    setSolving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to ask questions");

      const requestBody: any = { 
        question: question.trim(),
        subject: subject.trim() || "General",
        userId: user.id
      };

      // If image is provided, convert to base64
      if (imagePreview) {
        requestBody.imageBase64 = imagePreview;
      }

      const { data, error } = await supabase.functions.invoke("solve-doubt", {
        body: requestBody,
      });

      if (error) throw error;

      if (!data?.answer) {
        throw new Error("No answer received from AI");
      }

      setAnswer(data.answer);

      // Save to database
      const { error: saveError } = await supabase.from("doubts").insert([{
        user_id: user.id,
        question: question.trim(),
        answer: data.answer,
        subject: subject.trim() || null,
        image_url: imagePreview || null,
      }] as any  );

      if (saveError) throw saveError;

      // Refresh history
      await fetchDoubtHistory();

      toast({
        title: "🎉 Doubt Solved!",
        description: "AI has provided an answer to your question",
      });
    } catch (error: any) {
      console.error("Error solving doubt:", error);
      toast({
        title: "Failed to solve doubt",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSolving(false);
    }
  };

  const fetchDoubtHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("doubts")
        .select("id, question, answer, subject, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setDoubtHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setSubject("");
    setAnswer("");
    setImageFile(null);
    setImagePreview("");
  };

  const loadPreviousDoubt = (doubt: DoubtHistory) => {
    setQuestion(doubt.question);
    setSubject(doubt.subject || "");
    setAnswer(doubt.answer);
    setImagePreview("");
    setActiveTab("ask");
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
              AI Doubt Solver
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant, intelligent answers to all your academic questions with advanced AI assistance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ask" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ask Question
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2"
              onClick={fetchDoubtHistory}
            >
              <History className="h-4 w-4" />
              Previous Doubts
            </TabsTrigger>
          </TabsList>

          {/* Ask Question Tab */}
          <TabsContent value="ask" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Ask Your Question
                    </CardTitle>
                    <CardDescription>
                      Be specific with your question for the best answer. You can include images for visual questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question" className="text-base">
                        Your Question <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="question"
                        placeholder="e.g., Can you explain quantum physics in simple terms? How do I solve quadratic equations? What caused World War II?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={5}
                        className="resize-none text-base leading-relaxed"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Be as detailed as possible</span>
                        <span>{question.length}/1000</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-base">
                        Subject Area
                      </Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Advanced Mathematics, Organic Chemistry, World History"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        list="popular-subjects"
                      />
                      <datalist id="popular-subjects">
                        {popularSubjects.map((subject) => (
                          <option key={subject} value={subject} />
                        ))}
                      </datalist>
                    </div>

                    {/* Quick Subject Buttons */}
                    <div className="space-y-2">
                      <Label className="text-base">Quick Select</Label>
                      <div className="flex flex-wrap gap-2">
                        {popularSubjects.map((subjectItem) => (
                          <Badge
                            key={subjectItem}
                            variant={subject === subjectItem ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => setSubject(subjectItem)}
                          >
                            {subjectItem}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-base">
                        Upload Image (Optional)
                      </Label>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Input
                            ref={fileInputRef}
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choose Image
                          </Button>
                        </div>
                        
                        {imagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-48 rounded-lg border shadow-sm"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={removeImage}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Supported: JPG, PNG, GIF • Max 5MB
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1" 
                        size="lg"
                        onClick={handleSolveDoubt}
                        disabled={solving || !question.trim()}
                      >
                        {solving ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            AI is Thinking...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Solve My Doubt
                          </>
                        )}
                      </Button>
                      
                      {(question || subject || imagePreview) && (
                        <Button 
                          variant="outline"
                          size="lg"
                          onClick={handleClear}
                          disabled={solving}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Answer Section */}
                {answer && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="bg-green-50/50 dark:bg-green-950/20">
                      <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Brain className="h-5 w-5" />
                        AI Answer
                      </CardTitle>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        Here's the solution to your question
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="prose prose-lg max-w-none dark:prose-invert">
                        <div className="bg-green-50/30 dark:bg-green-950/10 p-6 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
                            {answer}
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
                    <CardTitle className="text-lg">💡 Tips for Better Answers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <p className="font-medium">Be Specific</p>
                      <p className="text-muted-foreground">
                        Include relevant details and context for more accurate answers.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Use Proper Terminology</p>
                      <p className="text-muted-foreground">
                        Technical terms help AI understand your subject better.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Break Down Complex Questions</p>
                      <p className="text-muted-foreground">
                        Ask multiple simpler questions for complex topics.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <strong>Pro Tip:</strong> Upload images of diagrams, equations, or problems for visual analysis.
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
                  Your Previous Doubts
                </CardTitle>
                <CardDescription>
                  Review your recently asked questions and their answers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : doubtHistory.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <History className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-muted-foreground">No previous doubts found</p>
                    <Button onClick={() => setActiveTab("ask")}>
                      Ask Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doubtHistory.map((doubt) => (
                      <Card key={doubt.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                {doubt.subject && (
                                  <Badge variant="secondary" className="text-xs">
                                    {doubt.subject}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(doubt.created_at)}
                                </span>
                              </div>
                              <p className="font-medium line-clamp-2">{doubt.question}</p>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {doubt.answer}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPreviousDoubt(doubt)}
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

export default Doubts;