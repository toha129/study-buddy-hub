import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, FileText, HelpCircle, Sparkles, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AIStudyAssistant = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quiz");
  
  // Quiz Generator State
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState("5");
  const [generatedQuiz, setGeneratedQuiz] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Summarizer State
  const [textToSummarize, setTextToSummarize] = useState("");
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Flashcard State
  const [flashcardTopic, setFlashcardTopic] = useState("");
  const [flashcardCount, setFlashcardCount] = useState("10");
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Generate Quiz
  const generateQuiz = async () => {
    if (!quizTopic.trim()) {
      toast({ title: "Error", description: "Please enter a topic", variant: "destructive" });
      return;
    }

    setIsGeneratingQuiz(true);
    
    // Simulate AI generation (replace with actual AI API in production)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockQuiz = Array.from({ length: parseInt(quizCount) }, (_, i) => ({
      question: `Sample question ${i + 1} about ${quizTopic}?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: `This is the explanation for question ${i + 1} about ${quizTopic}.`,
    }));

    setGeneratedQuiz(mockQuiz);
    setIsGeneratingQuiz(false);
    toast({ title: "Quiz generated!", description: `Created ${quizCount} questions` });
  };

  // Generate Summary
  const generateSummary = async () => {
    if (!textToSummarize.trim()) {
      toast({ title: "Error", description: "Please enter text to summarize", variant: "destructive" });
      return;
    }

    setIsGeneratingSummary(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockSummary = `📝 Summary:\n\nThis is a simulated AI-generated summary of your text. In production, this would use GPT-4, Claude, or Gemini to create a concise summary.\n\nKey Points:\n• Main concept 1\n• Main concept 2\n• Main concept 3\n\nConclusion: The text discusses important topics that are relevant to your studies.`;

    setSummary(mockSummary);
    setIsGeneratingSummary(false);
    toast({ title: "Summary generated!" });
  };

  // Generate Flashcards
  const generateFlashcards = async () => {
    if (!flashcardTopic.trim()) {
      toast({ title: "Error", description: "Please enter a topic", variant: "destructive" });
      return;
    }

    setIsGeneratingFlashcards(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockFlashcards = Array.from({ length: parseInt(flashcardCount) }, (_, i) => ({
      front: `Question/Term ${i + 1} about ${flashcardTopic}`,
      back: `Answer/Definition ${i + 1} explaining the concept in detail.`,
    }));

    setGeneratedFlashcards(mockFlashcards);
    setIsGeneratingFlashcards(false);
    toast({ title: "Flashcards generated!", description: `Created ${flashcardCount} flashcards` });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">AI-Powered Study Tools (Demo Mode)</p>
              <p className="text-muted-foreground text-xs">
                These are simulated AI responses. In production, integrate with OpenAI GPT-4, Anthropic Claude, or Google Gemini for real AI-powered features!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quiz">
            <HelpCircle className="h-4 w-4 mr-2" />
            Quiz Generator
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Summarizer
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Brain className="h-4 w-4 mr-2" />
            Flashcards
          </TabsTrigger>
        </TabsList>

        {/* Quiz Generator Tab */}
        <TabsContent value="quiz" className="space-y-4">
          <Card className="bg-card border-border/40">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Topic</Label>
                <Input
                  placeholder="e.g., Photosynthesis, World War II, Calculus"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  className="bg-background border-border/40"
                />
              </div>

              <div>
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={quizCount}
                  onChange={(e) => setQuizCount(e.target.value)}
                  className="bg-background border-border/40"
                />
              </div>

              <Button
                onClick={generateQuiz}
                disabled={isGeneratingQuiz}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
              >
                {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
              </Button>
            </CardContent>
          </Card>

          {generatedQuiz.length > 0 && (
            <div className="space-y-3">
              {generatedQuiz.map((q, index) => (
                <Card key={index} className="bg-card border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold">Q{index + 1}: {q.question}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(q.question, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border ${
                            opt === q.correctAnswer
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-muted/30 border-border/40"
                          }`}
                        >
                          {opt} {opt === q.correctAnswer && "✓"}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      💡 {q.explanation}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Summarizer Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card className="bg-card border-border/40">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Text to Summarize</Label>
                <Textarea
                  placeholder="Paste your lecture notes, article, or any text here..."
                  value={textToSummarize}
                  onChange={(e) => setTextToSummarize(e.target.value)}
                  className="bg-background border-border/40 min-h-[200px]"
                />
              </div>

              <Button
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
              >
                {isGeneratingSummary ? "Summarizing..." : "Generate Summary"}
              </Button>
            </CardContent>
          </Card>

          {summary && (
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold">AI-Generated Summary</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(summary, -1)}
                  >
                    {copiedIndex === -1 ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-4">
          <Card className="bg-card border-border/40">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Topic</Label>
                <Input
                  placeholder="e.g., Spanish Vocabulary, Chemistry Formulas"
                  value={flashcardTopic}
                  onChange={(e) => setFlashcardTopic(e.target.value)}
                  className="bg-background border-border/40"
                />
              </div>

              <div>
                <Label>Number of Flashcards</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={flashcardCount}
                  onChange={(e) => setFlashcardCount(e.target.value)}
                  className="bg-background border-border/40"
                />
              </div>

              <Button
                onClick={generateFlashcards}
                disabled={isGeneratingFlashcards}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90"
              >
                {isGeneratingFlashcards ? "Generating..." : "Generate Flashcards"}
              </Button>
            </CardContent>
          </Card>

          {generatedFlashcards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedFlashcards.map((card, index) => (
                <Card key={index} className="bg-card border-border/40 hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                        <p className="text-xs font-semibold text-primary mb-1">FRONT</p>
                        <p className="text-sm font-semibold">{card.front}</p>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                        <p className="text-xs font-semibold text-secondary mb-1">BACK</p>
                        <p className="text-sm">{card.back}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIStudyAssistant;

