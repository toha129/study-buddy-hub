import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Trash2, Download, FileAudio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface VoiceNote {
  id: string;
  user_id: string;
  title: string;
  transcription: string | null;
  duration: number;
  audio_url: string | null;
  created_at: string;
}

const VoiceNotes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch voice notes
  const { data: voiceNotes = [] } = useQuery({
    queryKey: ['voice-notes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VoiceNote[];
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({ title: "Recording started", description: "Speak clearly into your microphone" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast({ title: "Recording stopped", description: "You can now save or discard the recording" });
    }
  };

  const saveVoiceNote = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!audioBlob) throw new Error("No recording available");

      const { error } = await supabase
        .from('voice_notes')
        .insert([{
          user_id: user.id,
          title: title || `Voice Note ${new Date().toLocaleString()}`,
          transcription: transcription || null,
          duration: recordingTime,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-notes'] });
      setAudioBlob(null);
      setTitle("");
      setTranscription("");
      setRecordingTime(0);
      toast({ title: "Voice note saved!", description: "Your recording has been saved" });
    },
  });

  const deleteVoiceNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-notes'] });
      toast({ title: "Voice note deleted" });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setTitle("");
    setTranscription("");
    setRecordingTime(0);
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {!audioBlob ? (
              <>
                <div className="text-6xl font-bold text-primary">
                  {formatTime(recordingTime)}
                </div>
                
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 text-red-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold">Recording...</span>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-green-500 font-semibold">
                  ✓ Recording Complete ({formatTime(recordingTime)})
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Title (Optional)</Label>
                    <Input
                      placeholder="e.g., Chemistry Lecture Notes"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-background border-border/40"
                    />
                  </div>

                  <div>
                    <Label>Manual Transcription (Optional)</Label>
                    <Textarea
                      placeholder="Type what was said in the recording..."
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      className="bg-background border-border/40 min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Tip: In production, integrate with Whisper API for automatic transcription!
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => saveVoiceNote.mutate()}
                    disabled={saveVoiceNote.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                  <Button
                    onClick={discardRecording}
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Notes List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Saved Voice Notes</h3>
        <div className="space-y-3">
          {voiceNotes.length === 0 ? (
            <Card className="bg-muted/30 border-border/40">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileAudio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No voice notes yet. Start recording to save your first note!</p>
              </CardContent>
            </Card>
          ) : (
            voiceNotes.map((note) => (
              <Card key={note.id} className="bg-card border-border/40 hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileAudio className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{note.title}</h4>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        Duration: {formatTime(note.duration)} • {new Date(note.created_at).toLocaleDateString()}
                      </div>

                      {note.transcription && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Transcription:</p>
                          <p className="whitespace-pre-wrap">{note.transcription}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteVoiceNote.mutate(note.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceNotes;

