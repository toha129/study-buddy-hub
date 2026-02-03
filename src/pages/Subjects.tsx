import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, Plus, FileText, Trash2, Upload, Paperclip, ChevronDown, ChevronRight, BookOpen, Sparkles, X, Check, FileImage, FileType } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Timer } from "@/components/Timer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { generateQuizFromContext } from "@/lib/deepseek";
import { useToast } from "@/hooks/use-toast";

type TopicCategory = 'mid' | 'final' | 'quiz';

type Attachment = {
  id: string;
  name: string;
  type: 'pdf' | 'pptx' | 'txt' | 'image';
  data: string; // Base64
};

type Topic = {
  id: string;
  title: string;
  category: TopicCategory;
  completed: boolean;
  notes?: string;
  attachments: Attachment[];
  timer?: {
    totalSeconds: number;
    isRunning: boolean;
  };
};

type Subject = {
  id: string;
  name: string;
  color?: string;
  topics: Topic[];
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

const STORAGE_KEY = "sb_subjects_v2";

const Subjects: React.FC = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Subject[];
    } catch (e) {
      console.error("Error loading subjects:", e);
    }
    return [];
  });

  // Wizard State
  const [wizName, setWizName] = useState("");
  const [wizTopics, setWizTopics] = useState<{ title: string; category: TopicCategory }[]>([]);
  const [wizInput, setWizInput] = useState("");
  const [wizCategory, setWizCategory] = useState<TopicCategory>('mid');

  const [expanded, setExpanded] = useState<string | null>(null);

  // Quiz State
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState<string>("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  const addWizTopic = () => {
    if (!wizInput.trim()) return;
    setWizTopics([...wizTopics, { title: wizInput.trim(), category: wizCategory }]);
    setWizInput("");
  };

  const createSubject = () => {
    if (!wizName.trim()) return;
    const id = `subj-${Date.now()}`;
    const newSubject: Subject = {
      id,
      name: wizName.trim(),
      topics: wizTopics.map((t, idx) => ({
        id: `${id}-topic-${idx}`,
        title: t.title,
        category: t.category,
        completed: false,
        attachments: []
      }))
    };
    setSubjects([newSubject, ...subjects]);
    setWizName("");
    setWizTopics([]);
    setWizInput("");
    toast({ title: "Subject Created", description: "Your syllabus is ready!" });
  };

  // State for adding topics to existing subjects
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});

  const handleTopicInputChange = (subjId: string, catId: string, value: string) => {
    setTopicInputs(prev => ({ ...prev, [`${subjId}-${catId}`]: value }));
  };

  const addTopicToSubject = (subjId: string, category: TopicCategory) => {
    const key = `${subjId}-${category}`;
    const title = topicInputs[key]?.trim();
    if (!title) return;

    setSubjects(list => list.map(s => {
      if (s.id !== subjId) return s;
      const newTopic: Topic = {
        id: `${subjId}-topic-${Date.now()}`,
        title,
        category,
        completed: false,
        attachments: []
      };
      return { ...s, topics: [...s.topics, newTopic] };
    }));

    setTopicInputs(prev => ({ ...prev, [key]: "" }));
    toast({ title: "Topic Added", description: `Added to ${category.toUpperCase()} list.` });
  };

  const deleteSubject = (id: string) => {
    if (confirm("Delete this subject?")) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const toggleTopic = (subjId: string, topicId: string) => {
    setSubjects(list => list.map(s => s.id === subjId ? {
      ...s,
      topics: s.topics.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t)
    } : s));
  };

  // Attachment Logic
  const handleFileUpload = (subjId: string, topicId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      let type: Attachment['type'] = 'pdf';

      if (file.name.endsWith('.pptx')) type = 'pptx';
      else if (file.name.endsWith('.txt')) type = 'txt';
      else if (file.type.startsWith('image/')) type = 'image';

      const newAtt: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type,
        data: dataUrl
      };

      setSubjects(list => list.map(s => s.id === subjId ? {
        ...s,
        topics: s.topics.map(t => t.id === topicId ? { ...t, attachments: [...t.attachments, newAtt] } : t)
      } : s));
      toast({ title: "File Attached", description: `${file.name} saved to topic.` });
    };
    if (file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // Quiz Logic
  const startQuiz = async (topic: Topic) => {
    if (topic.attachments.length === 0) {
      toast({ title: "No Study Materials", description: "Attach a note or PDF first to generate a quiz!", variant: "destructive" });
      return;
    }

    setQuizLoading(true);
    setQuizOpen(true);
    setQuizFinished(false);
    setQuizScore(0);
    setCurrentQuestion(0);
    setActiveQuizTopic(topic.title);

    // Combine context from attachments (simplified: take first text readable or assume PDF content handled by API if connected)
    // For now, if it's an image/pdf, we send the base64 or name. API handles what it can.
    // In a real app with "Chat with PDF", we'd extract text here. 
    // For this generic implementation, we'll send the attachment metadata + any txt content.

    let context = `Topic: ${topic.title}. `;
    topic.attachments.forEach(att => {
      if (att.type === 'txt') context += `\nContent from ${att.name}: ${att.data}`;
      else context += `\nFile attached: ${att.name}`;
    });

    try {
      const questions = await generateQuizFromContext(context);
      if (questions.length > 0) {
        setQuizData(questions);
      } else {
        toast({ title: "Generation Failed", description: "AI couldn't generate questions from this content.", variant: "destructive" });
        setQuizOpen(false);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to contact Quiz AI.", variant: "destructive" });
      setQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    const isCorrect = optionIndex === quizData[currentQuestion].correctAnswer;
    if (isCorrect) setQuizScore(s => s + 1);

    // Wait and simple feedback or immediate next? user wants instant feedback
    setTimeout(() => {
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1000);
  };

  const categories: { id: TopicCategory; label: string; color: string }[] = [
    { id: 'mid', label: 'Midterm', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { id: 'final', label: 'Final', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { id: 'quiz', label: 'Quiz', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Subject Manager</h1>
            <p className="text-gray-400">Plan your syllabus and track progress</p>
          </div>
        </div>

        {/* Creation Wizard */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Add New Subject</CardTitle>
            <CardDescription>Setup your syllabus structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Name</label>
              <Input
                placeholder="e.g. Data Structures"
                value={wizName}
                onChange={e => setWizName(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className={`p-4 rounded-lg border ${cat.color} bg-background/50`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    {cat.label} Topics
                    <Badge variant="outline" className="ml-auto">{wizTopics.filter(t => t.category === cat.id).length}</Badge>
                  </h3>
                  <div className="space-y-2 mb-3 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {wizTopics.filter(t => t.category === cat.id).map((t, i) => (
                      <div key={i} className="text-sm p-2 bg-background rounded border border-white/5 flex justify-between group">
                        <span className="font-mono text-xs opacity-70 mr-2">{i + 1}.</span>
                        <span className="truncate flex-1">{t.title}</span>
                        <button
                          onClick={() => setWizTopics(wizTopics.filter(x => x !== t))}
                          className="opacity-0 group-hover:opacity-100 text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add topic..."
                      className="h-8 text-xs"
                      value={wizCategory === cat.id ? wizInput : ""}
                      onChange={e => { setWizCategory(cat.id); setWizInput(e.target.value); }}
                      onKeyDown={e => e.key === 'Enter' && addWizTopic()}
                    />
                    <Button size="sm" variant="secondary" onClick={() => { setWizCategory(cat.id); addWizTopic(); }} className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={createSubject} size="lg" className="w-full md:w-auto">
                Create Subject Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subject List */}
        <div className="space-y-6">
          {subjects.map(subject => {
            const total = subject.topics.length;
            const completed = subject.topics.filter(t => t.completed).length;
            const progress = total ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={subject.id} className="overflow-hidden border-white/10">
                <div className="p-6 bg-card/50 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(expanded === subject.id ? null : subject.id)}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-xl font-bold">{subject.name}</h3>
                      <p className="text-sm text-gray-400 font-mono">{completed}/{total} Topics Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right w-32">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xl font-bold text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <Button variant="ghost" size="icon">
                      {expanded === subject.id ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                  </div>
                </div>

                {expanded === subject.id && (
                  <CardContent className="p-6 bg-black/20 space-y-8 border-t border-white/5">
                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => deleteSubject(subject.id)}>Delete Subject</Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {categories.map(cat => {
                        const catTopics = subject.topics.filter(t => t.category === cat.id);

                        return (
                          <div key={cat.id} className="space-y-4">
                            <h4 className={`text-sm font-bold uppercase tracking-widest pb-2 border-b ${cat.color.split(' ')[1]}`}>
                              {cat.label}
                            </h4>

                            {/* Topic List */}
                            <div className="space-y-3">
                              {catTopics.map((topic, index) => (
                                <div key={topic.id} className="p-4 bg-card rounded-lg border border-white/5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1 font-mono text-xs text-muted-foreground w-6">{(index + 1).toString().padStart(2, '0')}.</div>
                                    <div className="flex-1">
                                      <p className={`font-medium text-lg ${topic.completed ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                                        {topic.title}
                                      </p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={topic.completed}
                                      onChange={(e) => { e.stopPropagation(); toggleTopic(subject.id, topic.id); }}
                                      className="mt-1 h-5 w-5 rounded border-gray-500 bg-transparent cursor-pointer"
                                    />
                                  </div>

                                  {/* Actions Bar */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
                                    <div className="flex-1 flex flex-wrap gap-2">
                                      {topic.attachments.map(att => (
                                        <a
                                          key={att.id}
                                          href={att.type !== 'txt' ? att.data : undefined}
                                          download={att.name}
                                          className="flex items-center gap-1.5 text-xs bg-white/5 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/10 transition-colors border border-white/10 max-w-[150px]"
                                        >
                                          {att.type === 'pdf' && <FileText className="h-3 w-3 text-red-400" />}
                                          {att.type === 'pptx' && <FileText className="h-3 w-3 text-orange-400" />}
                                          {att.type === 'image' && <FileImage className="h-3 w-3 text-blue-400" />}
                                          {att.type === 'txt' && <FileType className="h-3 w-3 text-gray-400" />}
                                          <span className="truncate">{att.name}</span>
                                        </a>
                                      ))}
                                    </div>

                                    <div className="flex gap-2">
                                      <label className="cursor-pointer p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Attach File">
                                        <Paperclip className="h-4 w-4" />
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept=".pdf,.pptx,.txt,image/*"
                                          onChange={(e) => {
                                            if (e.target.files?.[0]) handleFileUpload(subject.id, topic.id, e.target.files[0]);
                                          }}
                                        />
                                      </label>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs gap-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                                        onClick={() => startQuiz(topic)}
                                      >
                                        <Sparkles className="h-3 w-3" />
                                        Quiz Me
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add New Topic Input */}
                            <div className="pt-3 mt-2 border-t border-white/5 flex gap-2">
                              <Input
                                placeholder="Add new topic..."
                                className="h-8 text-xs bg-black/20 border-white/10"
                                value={topicInputs[`${subject.id}-${cat.id}`] || ""}
                                onChange={e => handleTopicInputChange(subject.id, cat.id, e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTopicToSubject(subject.id, cat.id)}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 shrink-0"
                                onClick={() => addTopicToSubject(subject.id, cat.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Quiz Modal */}
        <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Quiz: {activeQuizTopic}
              </DialogTitle>
              <DialogDescription>
                Test your knowledge generated from your notes.
              </DialogDescription>
            </DialogHeader>

            {quizLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Reading notes & generating questions...</p>
              </div>
            ) : quizFinished ? (
              <div className="py-8 text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-2">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Quiz Complete!</h2>
                <div className="text-4xl font-black text-primary">
                  {quizScore} / {quizData.length}
                </div>
                <p className="text-muted-foreground">
                  {quizScore === quizData.length ? "Perfect Score! 🎉" : "Good practice! Review your notes for the ones you missed."}
                </p>
                <Button onClick={() => setQuizOpen(false)} className="w-full">Close Quiz</Button>
              </div>
            ) : quizData.length > 0 ? (
              <div className="space-y-6 py-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {quizData.length}</span>
                  <span>Score: {quizScore}</span>
                </div>
                <Progress value={((currentQuestion) / quizData.length) * 100} className="h-1" />

                <h3 className="text-lg font-medium leading-relaxed">
                  {quizData[currentQuestion].question}
                </h3>

                <div className="space-y-2">
                  {quizData[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${selectedAnswer === idx
                        ? idx === quizData[currentQuestion].correctAnswer
                          ? 'bg-green-500/20 border-green-500 text-green-100' // Correct picked
                          : 'bg-red-500/20 border-red-500 text-red-100' // Wrong picked
                        : selectedAnswer !== null && idx === quizData[currentQuestion].correctAnswer
                          ? 'bg-green-500/10 border-green-500/50 text-green-100' // Show correct if wrong picked
                          : 'bg-white/5 border-white/10 hover:bg-white/10' // Default
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-red-400">
                Failed to load quiz data. Please try again.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main >
    </div >
  );
};

export default Subjects;
