import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { NoteType, Note } from "./TaikoGame";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Save, Trash2, Plus, Mic, MicOff } from "lucide-react";

interface BeatEditorProps {
  onPatternSave: (pattern: Omit<Note, "id" | "position" | "hit">[]) => void;
}

export const BeatEditor = ({ onPatternSave }: BeatEditorProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [patternLength, setPatternLength] = useState(8000); // 8 seconds
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>("don");
  const [pattern, setPattern] = useState<Omit<Note, "id" | "position" | "hit">[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const playbackRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Audio context for real drum detection
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const microphoneRef = useRef<MediaStreamAudioSourceNode>();
  const streamRef = useRef<MediaStream>();

  const beatInterval = (60 / bpm) * 1000; // milliseconds per beat

  const startPlayback = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    startTimeRef.current = Date.now();
    
    const playLoop = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      setCurrentTime(elapsed);
      
      if (elapsed >= patternLength) {
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }
      
      playbackRef.current = requestAnimationFrame(playLoop);
    };
    
    playbackRef.current = requestAnimationFrame(playLoop);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
    }
  };

  const addNote = (timing: number) => {
    const newNote = {
      type: selectedNoteType,
      timing
    };
    
    setPattern(prev => [...prev, newNote].sort((a, b) => a.timing - b.timing));
  };

  const removeNote = (timing: number) => {
    setPattern(prev => prev.filter(note => Math.abs(note.timing - timing) > 100));
  };

  const clearPattern = () => {
    setPattern([]);
    toast({
      title: "Pattern Cleared",
      description: "All notes have been removed.",
    });
  };

  const savePattern = () => {
    onPatternSave(pattern);
    toast({
      title: "Pattern Saved",
      description: `Saved pattern with ${pattern.length} notes!`,
    });
  };

  // Real drum detection setup
  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      microphoneRef.current.connect(analyserRef.current);
      
      setIsRecording(true);
      startAudioAnalysis();
      
      toast({
        title: "Microphone Active",
        description: "Now detecting real drum hits!",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopMicrophoneRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsRecording(false);
    toast({
      title: "Microphone Stopped",
      description: "Real drum detection disabled.",
    });
  };

  const startAudioAnalysis = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let lastHitTime = 0;
    
    const analyze = () => {
      if (!isRecording || !analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // Detect drum hits based on volume spikes
      const threshold = 100; // Adjust based on sensitivity needed
      const currentTime = Date.now();
      
      if (average > threshold && currentTime - lastHitTime > 150) {
        // Analyze frequency content to determine drum type
        const lowFreq = dataArray.slice(0, bufferLength / 4).reduce((sum, val) => sum + val, 0);
        const midFreq = dataArray.slice(bufferLength / 4, bufferLength / 2).reduce((sum, val) => sum + val, 0);
        
        // Simple classification: more low frequency = don, more mid frequency = ka
        const drumType: NoteType = lowFreq > midFreq ? "don" : "ka";
        
        // Add note at current playback time if playing, or at timeline cursor
        const noteTime = isPlaying ? currentTime : 0;
        addNote(noteTime);
        
        lastHitTime = currentTime;
        
        toast({
          title: `${drumType.toUpperCase()} Hit Detected!`,
          description: `Added ${drumType} note at ${noteTime}ms`,
        });
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const renderTimeline = () => {
    const beats = Math.ceil(patternLength / beatInterval);
    const timelineElements = [];
    
    for (let i = 0; i <= beats; i++) {
      const time = i * beatInterval;
      const position = (time / patternLength) * 100;
      
      timelineElements.push(
        <div
          key={`beat-${i}`}
          className="absolute top-0 bottom-0 w-px bg-muted-foreground/30"
          style={{ left: `${position}%` }}
        >
          <span className="absolute -top-6 -left-2 text-xs text-muted-foreground">
            {i}
          </span>
        </div>
      );
    }
    
    return timelineElements;
  };

  const renderNotes = () => {
    return pattern.map((note, index) => {
      const position = (note.timing / patternLength) * 100;
      const color = note.type.includes("don") ? "bg-drum-don" : "bg-drum-ka";
      
      return (
        <div
          key={index}
          className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-8 ${color} rounded cursor-pointer hover:scale-110 transition-transform`}
          style={{ left: `${position}%` }}
          onClick={() => removeNote(note.timing)}
          title={`${note.type} at ${note.timing}ms - Click to remove`}
        />
      );
    });
  };

  const renderPlayhead = () => {
    const position = (currentTime / patternLength) * 100;
    
    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-accent rounded-full" />
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Beat Editor</h3>
        <div className="flex gap-2">
          <Button
            onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? "Stop Mic" : "Real Drums"}
          </Button>
          <Button onClick={clearPattern} variant="outline" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={savePattern} variant="outline" size="sm">
            <Save className="w-4 h-4" />
          </Button>
          <Button onClick={isPlaying ? stopPlayback : startPlayback} size="sm">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">BPM</label>
          <Input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            min={60}
            max={200}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Length (ms)</label>
          <Input
            type="number"
            value={patternLength}
            onChange={(e) => setPatternLength(Number(e.target.value))}
            min={1000}
            max={30000}
            step={1000}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Note Type</label>
          <Select value={selectedNoteType} onValueChange={(value) => setSelectedNoteType(value as NoteType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="don">Don (Red)</SelectItem>
              <SelectItem value="ka">Ka (Blue)</SelectItem>
              <SelectItem value="big-don">Big Don</SelectItem>
              <SelectItem value="big-ka">Big Ka</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes Count</label>
          <div className="text-lg font-bold text-primary">{pattern.length}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Timeline (Click to add notes)</label>
        <div
          className="relative h-20 bg-track-bg border-2 border-drum-rim rounded-lg cursor-crosshair overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const timing = percentage * patternLength;
            addNote(Math.round(timing));
          }}
        >
          {renderTimeline()}
          {renderNotes()}
          {isPlaying && renderPlayhead()}
          
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/50 transform -translate-y-1/2" />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">How to use:</h4>
        <ul className="space-y-1">
          <li>• Click on the timeline to add notes at that timing</li>
          <li>• Click on existing notes to remove them</li>
          <li>• Use "Real Drums" to detect hits from your microphone</li>
          <li>• Adjust BPM and pattern length as needed</li>
          <li>• Save your pattern to use in the main game</li>
        </ul>
      </div>
    </Card>
  );
};