-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 0,
  last_completed DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit_completions table
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- Create voice_notes table
CREATE TABLE public.voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcription TEXT,
  duration INTEGER NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on habit_completions
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habit completions"
  ON public.habit_completions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.habits
    WHERE habits.id = habit_completions.habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own habit completions"
  ON public.habit_completions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.habits
    WHERE habits.id = habit_completions.habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own habit completions"
  ON public.habit_completions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.habits
    WHERE habits.id = habit_completions.habit_id
    AND habits.user_id = auth.uid()
  ));

-- Enable RLS on voice_notes
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice notes"
  ON public.voice_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice notes"
  ON public.voice_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice notes"
  ON public.voice_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice notes"
  ON public.voice_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON public.habit_completions(completed_date);
CREATE INDEX idx_voice_notes_user_id ON public.voice_notes(user_id);

