-- Create sleep_sessions table
CREATE TABLE public.sleep_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sleep_sessions
CREATE POLICY "Users can view their own sleep sessions"
  ON public.sleep_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sleep sessions"
  ON public.sleep_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep sessions"
  ON public.sleep_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep sessions"
  ON public.sleep_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_sleep_sessions_user_id ON public.sleep_sessions(user_id);
CREATE INDEX idx_sleep_sessions_start_time ON public.sleep_sessions(start_time DESC);
CREATE INDEX idx_sleep_sessions_is_active ON public.sleep_sessions(is_active) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sleep_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sleep_sessions_updated_at
  BEFORE UPDATE ON public.sleep_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_sleep_sessions_updated_at();

