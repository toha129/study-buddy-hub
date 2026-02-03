import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Target, Award, TrendingUp, Flame, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  icon: any;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const Gamification = () => {
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);

  // Fetch user stats
  const { data: quizzes = [] } = useQuery({
    queryKey: ['gamification-quizzes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('quizzes').select('*').eq('user_id', user.id);
      return data || [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['gamification-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('todos').select('*').eq('user_id', user.id);
      return data || [];
    },
  });

  const { data: habits = [] } = useQuery({
    queryKey: ['gamification-habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('habits').select('*').eq('user_id', user.id);
      return data || [];
    },
  });

  // Calculate XP and level
  useEffect(() => {
    const completedQuizzes = quizzes.filter(q => q.completed).length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    const totalXP = (completedQuizzes * 50) + (completedTasks * 30) + (totalStreak * 10);
    setUserXP(totalXP);

    // Calculate level (every 100 XP = 1 level)
    const level = Math.floor(totalXP / 100) + 1;
    setUserLevel(level);
    setXpToNextLevel(level * 100);
  }, [quizzes, tasks, habits]);

  const completedQuizzes = quizzes.filter(q => q.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const maxStreak = Math.max(...habits.map(h => h.streak || 0), 0);

  const achievements: Achievement[] = [
    {
      id: "first-quiz",
      icon: BookOpen,
      title: "First Steps",
      description: "Complete your first quiz",
      unlocked: completedQuizzes >= 1,
      rarity: "common",
    },
    {
      id: "quiz-master",
      icon: Trophy,
      title: "Quiz Master",
      description: "Complete 10 quizzes",
      unlocked: completedQuizzes >= 10,
      progress: completedQuizzes,
      maxProgress: 10,
      rarity: "rare",
    },
    {
      id: "task-warrior",
      icon: Target,
      title: "Task Warrior",
      description: "Complete 20 tasks",
      unlocked: completedTasks >= 20,
      progress: completedTasks,
      maxProgress: 20,
      rarity: "rare",
    },
    {
      id: "week-streak",
      icon: Flame,
      title: "On Fire!",
      description: "Maintain a 7-day habit streak",
      unlocked: maxStreak >= 7,
      progress: maxStreak,
      maxProgress: 7,
      rarity: "epic",
    },
    {
      id: "month-streak",
      icon: Crown,
      title: "Unstoppable",
      description: "Maintain a 30-day habit streak",
      unlocked: maxStreak >= 30,
      progress: maxStreak,
      maxProgress: 30,
      rarity: "legendary",
    },
    {
      id: "level-5",
      icon: Star,
      title: "Rising Star",
      description: "Reach level 5",
      unlocked: userLevel >= 5,
      progress: userLevel,
      maxProgress: 5,
      rarity: "epic",
    },
    {
      id: "level-10",
      icon: Zap,
      title: "Power User",
      description: "Reach level 10",
      unlocked: userLevel >= 10,
      progress: userLevel,
      maxProgress: 10,
      rarity: "legendary",
    },
    {
      id: "productive",
      icon: TrendingUp,
      title: "Productivity King",
      description: "Complete 5 tasks in one day",
      unlocked: false,
      rarity: "epic",
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-gray-500 border-gray-500/30 bg-gray-500/10";
      case "rare": return "text-blue-500 border-blue-500/30 bg-blue-500/10";
      case "epic": return "text-purple-500 border-purple-500/30 bg-purple-500/10";
      case "legendary": return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      default: return "text-gray-500 border-gray-500/30 bg-gray-500/10";
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercent = (userXP % 100);

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/50 glow-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Level {userLevel}</h3>
              <p className="text-sm text-muted-foreground">
                {userXP} / {xpToNextLevel} XP
              </p>
            </div>
            <div className="p-4 rounded-full bg-primary/20">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <Progress value={progressPercent} className="h-3" />
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedQuizzes}</div>
              <div className="text-xs text-muted-foreground">Quizzes Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{maxStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Achievements</h3>
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <Card
                key={achievement.id}
                className={`transition-all ${
                  achievement.unlocked
                    ? `${getRarityColor(achievement.rarity)} glow-card`
                    : "bg-muted/30 border-border/40 opacity-60"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${
                      achievement.unlocked
                        ? getRarityColor(achievement.rarity)
                        : "bg-muted/50"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        {achievement.unlocked && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>

                      {!achievement.unlocked && achievement.maxProgress && (
                        <div className="space-y-1">
                          <Progress 
                            value={(achievement.progress! / achievement.maxProgress) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            {achievement.progress} / {achievement.maxProgress}
                          </p>
                        </div>
                      )}

                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          getRarityColor(achievement.rarity)
                        }`}>
                          {achievement.rarity}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Daily Challenges (Coming Soon) */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardContent className="p-6 text-center">
          <Star className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
          <h3 className="font-semibold mb-2">Daily Challenges</h3>
          <p className="text-sm text-muted-foreground">
            Complete daily challenges to earn bonus XP! (Coming Soon)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Import missing icon
import { BookOpen } from "lucide-react";

export default Gamification;

