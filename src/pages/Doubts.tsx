import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Send, Image as ImageIcon } from "lucide-react";

const Doubts = () => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [answer, setAnswer] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [solving, setSolving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const requestBody: any = { question, subject };

      // If image is provided, convert to base64
      if (imagePreview) {
        requestBody.imageBase64 = imagePreview;
      }

      const { data, error } = await supabase.functions.invoke("solve-doubt", {
        body: requestBody,
      });

      if (error) throw error;

      setAnswer(data.answer);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("doubts").insert({
          user_id: user.id,
          question,
          answer: data.answer,
          subject: subject || null,
          image_url: imagePreview || null,
        });
      }

      toast({
        title: "Doubt solved!",
        description: "Here's your answer",
      });
    } catch (error: any) {
      console.error("Error solving doubt:", error);
      toast({
        title: "Failed to solve",
        description: error.message || "Failed to solve your doubt",
        variant: "destructive",
      });
    } finally {
      setSolving(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setSubject("");
    setAnswer("");
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI Doubt Solver</h1>
          <p className="text-muted-foreground">Get instant answers to your questions with AI assistance</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ask Your Question</CardTitle>
            <CardDescription>Type your question or upload an image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Your Question *</Label>
              <Textarea
                id="question"
                placeholder="e.g., How does photosynthesis work? Explain the Pythagorean theorem..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics, Physics, Chemistry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Upload Image (optional)</Label>
              <div className="flex gap-4 items-start">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleSolveDoubt}
                disabled={solving}
              >
                {solving ? (
                  <>Solving...</>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Solve My Doubt
                  </>
                )}
              </Button>
              {answer && (
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {answer && (
          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription>AI-powered solution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {answer}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Doubts;