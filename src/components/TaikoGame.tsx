import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaikoDrum } from "./TaikoDrum";
import { GameTrack } from "./GameTrack";
import { ScoreDisplay } from "./ScoreDisplay";
import { PythonEditor } from "./PythonEditor";
import { BeatEditor } from "./BeatEditor";
import { DrumDetector } from "./DrumDetector";
import { useToast } from "@/hooks/use-toast";

export type NoteType = "don" | "ka" | "big-don" | "big-ka";

export interface Note {
  id: string;
  type: NoteType;
  timing: number;
  position: number;
  hit?: boolean;
}

export interface GameState {
  score: number;
  combo: number;
  accuracy: number;
  isPlaying: boolean;
  notes: Note[];
}

export const TaikoGame = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    combo: 0,
    accuracy: 100,
    isPlaying: false,
    notes: []
  });
  
  const [showPython, setShowPython] = useState(false);
  const [showBeatEditor, setShowBeatEditor] = useState(false);
  const [useRealDrums, setUseRealDrums] = useState(false);
  const [customPattern, setCustomPattern] = useState<Omit<Note, "id" | "position" | "hit">[]>([]);
  const gameLoopRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Sample note patterns
  const samplePattern = [
    { timing: 1000, type: "don" as NoteType },
    { timing: 1500, type: "ka" as NoteType },
    { timing: 2000, type: "don" as NoteType },
    { timing: 2250, type: "don" as NoteType },
    { timing: 2500, type: "ka" as NoteType },
    { timing: 3000, type: "big-don" as NoteType },
    { timing: 3500, type: "ka" as NoteType },
    { timing: 4000, type: "don" as NoteType },
  ];

  const generateNotes = useCallback(() => {
    const pattern = customPattern.length > 0 ? customPattern : samplePattern;
    const notes = pattern.map((pattern, index) => ({
      id: `note-${index}`,
      type: pattern.type,
      timing: pattern.timing,
      position: 100, // Start off-screen
      hit: false
    }));
    setGameState(prev => ({ ...prev, notes }));
  }, [customPattern]);

  const handlePatternSave = (pattern: Omit<Note, "id" | "position" | "hit">[]) => {
    setCustomPattern(pattern);
    toast({
      title: "Custom Pattern Loaded!",
      description: `Loaded ${pattern.length} notes. Start a new game to use it.`,
    });
  };

  const startGame = () => {
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      score: 0, 
      combo: 0, 
      accuracy: 100 
    }));
    generateNotes();
    startTimeRef.current = Date.now();
    toast({
      title: "Game Started!",
      description: "Hit the drums in rhythm!",
    });
  };

  const stopGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    toast({
      title: "Game Stopped",
      description: `Final Score: ${gameState.score}`,
    });
  };

  const onDrumHit = useCallback((drumType: "don" | "ka") => {
    if (!gameState.isPlaying) return;

    const currentTime = Date.now() - (startTimeRef.current || 0);
    const activeNotes = gameState.notes.filter(
      note => !note.hit && 
      Math.abs(note.timing - currentTime) < 200 && // Hit window
      ((drumType === "don" && (note.type === "don" || note.type === "big-don")) ||
       (drumType === "ka" && (note.type === "ka" || note.type === "big-ka")))
    );

    if (activeNotes.length > 0) {
      const hitNote = activeNotes[0];
      const accuracy = Math.max(0, 200 - Math.abs(hitNote.timing - currentTime)) / 200;
      const points = Math.floor(accuracy * 300);
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        combo: prev.combo + 1,
        notes: prev.notes.map(note => 
          note.id === hitNote.id ? { ...note, hit: true } : note
        )
      }));

      toast({
        title: accuracy > 0.8 ? "Perfect!" : accuracy > 0.6 ? "Good!" : "OK!",
        description: `+${points} points`,
      });
    }
  }, [gameState.isPlaying, gameState.notes, toast]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = () => {
      const currentTime = Date.now() - (startTimeRef.current || 0);
      
      setGameState(prev => ({
        ...prev,
        notes: prev.notes.map(note => ({
          ...note,
          position: Math.max(-10, 100 - (currentTime - note.timing + 2000) / 30)
        }))
      }));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Taiko Rhythm
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setShowBeatEditor(!showBeatEditor)}
              variant="outline"
            >
              {showBeatEditor ? "Hide" : "Show"} Beat Editor
            </Button>
            <Button 
              onClick={() => setUseRealDrums(!useRealDrums)}
              variant={useRealDrums ? "default" : "outline"}
            >
              {useRealDrums ? "Real Drums ON" : "Real Drums OFF"}
            </Button>
            <Button 
              onClick={() => setShowPython(!showPython)}
              variant="outline"
            >
              {showPython ? "Hide" : "Show"} Python Editor
            </Button>
            <Button 
              onClick={gameState.isPlaying ? stopGame : startGame}
              variant={gameState.isPlaying ? "destructive" : "default"}
            >
              {gameState.isPlaying ? "Stop" : "Start"} Game
            </Button>
          </div>
        </div>

        {/* Score Display */}
        <ScoreDisplay gameState={gameState} />

        {/* Real Drum Detection */}
        {useRealDrums && (
          <DrumDetector 
            onDrumHit={onDrumHit} 
            isActive={gameState.isPlaying || showBeatEditor} 
          />
        )}

        {/* Game Area */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="space-y-6">
            {/* Pattern Info */}
            {customPattern.length > 0 && (
              <div className="text-center text-sm text-muted-foreground bg-accent/10 p-2 rounded">
                Using custom pattern with {customPattern.length} notes
              </div>
            )}
            
            {/* Game Track */}
            <GameTrack notes={gameState.notes} isPlaying={gameState.isPlaying} />
            
            {/* Drums */}
            <TaikoDrum onHit={onDrumHit} isPlaying={gameState.isPlaying} />
          </div>
        </Card>

        {/* Beat Editor */}
        {showBeatEditor && (
          <BeatEditor onPatternSave={handlePatternSave} />
        )}

        {/* Python Editor */}
        {showPython && (
          <Card className="p-6">
            <PythonEditor onPatternGenerate={handlePatternSave} />
          </Card>
        )}
      </div>
    </div>
  );
};