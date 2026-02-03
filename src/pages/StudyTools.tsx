import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Calendar, Trophy, CheckCircle2 } from "lucide-react";
import HabitTracker from "@/components/tools/HabitTracker";
import VoiceNotes from "@/components/tools/VoiceNotes";
import CalendarView from "@/components/tools/CalendarView";
import Gamification from "@/components/tools/Gamification";
import Background3D from "@/components/3d/Background3D";
import Card3D from "@/components/3d/Card3D";
import FloatingElement from "@/components/3d/FloatingElement";

const StudyTools = () => {
  const [activeTab, setActiveTab] = useState("habits");

  const tools = [
    {
      id: "habits",
      label: "Habits",
      icon: CheckCircle2,
      description: "Track daily study habits & build streaks",
      component: HabitTracker,
    },

    {
      id: "voice",
      label: "Voice Notes",
      icon: Mic,
      description: "Record & transcribe lectures",
      component: VoiceNotes,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      description: "Unified view of all events",
      component: CalendarView,
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: Trophy,
      description: "Earn XP, badges & level up",
      component: Gamification,
    },

  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* 3D Animated Background */}
      <Background3D />

      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in relative z-10">
        <FloatingElement delay={0} duration={4} yOffset={15}>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Study Tools
            </h1>
            <p className="text-muted-foreground">
              Powerful tools to enhance your learning experience
            </p>
          </div>
        </FloatingElement>

        {/* Tools Grid Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card3D key={tool.id} intensity={8}>
                <Card
                  className={`cursor-pointer transition-all duration-300 backdrop-blur-sm ${activeTab === tool.id
                    ? "bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/50 glow-primary"
                    : "bg-card/80 border-border/40 hover:border-primary/30"
                    }`}
                  onClick={() => setActiveTab(tool.id)}
                >
                  <CardContent className="p-4 text-center">
                    <Icon
                      className={`h-8 w-8 mx-auto mb-2 ${activeTab === tool.id ? "text-primary" : "text-muted-foreground"
                        }`}
                    />
                    <p className="text-xs font-medium">{tool.label}</p>
                  </CardContent>
                </Card>
              </Card3D>
            );
          })}
        </div>

        {/* Main Tools Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden">
            {tools.map((tool) => (
              <TabsTrigger key={tool.id} value={tool.id}>
                {tool.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tools.map((tool) => {
            const Component = tool.component;
            return (
              <TabsContent key={tool.id} value={tool.id} className="space-y-6">
                <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <tool.icon className="h-5 w-5 text-primary" />
                      {tool.label}
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Component />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
};

export default StudyTools;

