import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIChatbot = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI Study Buddy! 🎓 I can help you with:\n\n• Explaining difficult concepts\n• Creating study plans\n• Quiz yourself on topics\n• Motivation and study tips\n• Answering questions about your subjects\n\nWhat would you like help with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulated AI responses - In production, replace with actual AI API call
    const responses = {
      greeting: [
        "Hello! How can I help you study today?",
        "Hi there! Ready to learn something new?",
        "Hey! What subject are you working on?",
      ],
      motivation: [
        "You're doing great! Remember, consistency is key. Even 15 minutes of focused study makes a difference! 💪",
        "Keep going! Every expert was once a beginner. You're making progress! 🌟",
        "Believe in yourself! You've got this! Small steps lead to big achievements! 🚀",
      ],
      study_tips: [
        "Here's a great study tip: Use the Feynman Technique! Try explaining the concept in simple terms as if teaching a child. This reveals gaps in your understanding.",
        "Pro tip: Study in 25-minute focused sessions (Pomodoro) with 5-minute breaks. Your brain retains information better with regular breaks!",
        "Active recall is powerful! Instead of re-reading notes, close your book and try to recall what you learned. This strengthens memory!",
      ],
      quiz: [
        "Great idea! Let's quiz you. What subject would you like to be tested on? Just tell me the topic and I'll create some questions!",
        "Perfect! Quizzing yourself is one of the best study methods. What topic should we cover?",
      ],
      default: [
        "That's an interesting question! While I'm a demo AI, in the full version I'd provide detailed explanations. For now, try breaking down your question into smaller parts!",
        "I'd love to help with that! In the production version, I'll have access to advanced AI to give you comprehensive answers. What specific aspect would you like to focus on?",
        "Great question! Here's a study strategy: Research this topic using multiple sources, take notes, then try to explain it in your own words. That's how you truly learn!",
      ],
    };

    // Simple keyword matching for demo
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.match(/hi|hello|hey|greetings/)) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
    if (lowerMessage.match(/motivat|encourage|inspire|give up|tired|hard/)) {
      return responses.motivation[Math.floor(Math.random() * responses.motivation.length)];
    }
    if (lowerMessage.match(/tip|advice|how to study|study better|improve/)) {
      return responses.study_tips[Math.floor(Math.random() * responses.study_tips.length)];
    }
    if (lowerMessage.match(/quiz|test|question|practice/)) {
      return responses.quiz[Math.floor(Math.random() * responses.quiz.length)];
    }
    
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">AI Study Buddy (Demo Mode)</p>
              <p className="text-muted-foreground text-xs">
                This is a demo with simulated responses. In production, connect to OpenAI, Claude, or Gemini API for real AI conversations!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-4">
          <div className="h-[500px] overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div
                  className={`flex-1 max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/50 border border-border/40"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted/50 border border-border/40 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about studying..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 bg-background border-border/40"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput("Give me study tips")}
          className="text-xs"
        >
          💡 Study Tips
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput("I need motivation")}
          className="text-xs"
        >
          🚀 Motivate Me
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput("Quiz me on a topic")}
          className="text-xs"
        >
          📝 Quiz Me
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput("How can I study more effectively?")}
          className="text-xs"
        >
          🎯 Study Better
        </Button>
      </div>
    </div>
  );
};

export default AIChatbot;

