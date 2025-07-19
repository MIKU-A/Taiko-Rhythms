import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TaikoDrumProps {
  onHit: (drumType: "don" | "ka") => void;
  isPlaying: boolean;
}

export const TaikoDrum = ({ onHit, isPlaying }: TaikoDrumProps) => {
  const [hitAnimation, setHitAnimation] = useState<string | null>(null);

  const handleDrumHit = (drumType: "don" | "ka") => {
    if (!isPlaying) return;
    
    onHit(drumType);
    setHitAnimation(drumType);
    setTimeout(() => setHitAnimation(null), 200);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key.toLowerCase()) {
        case 'f':
        case 'j':
          handleDrumHit("don");
          break;
        case 'd':
        case 'k':
          handleDrumHit("ka");
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  return (
    <div className="flex justify-center items-center gap-8 py-8">
      {/* Don Drum (Red) */}
      <div className="relative">
        <Button
          onClick={() => handleDrumHit("don")}
          disabled={!isPlaying}
          className={`
            w-32 h-32 rounded-full bg-drum-don border-4 border-drum-rim
            hover:bg-drum-don/90 active:scale-95 transition-all duration-150
            text-white font-bold text-lg shadow-lg
            ${hitAnimation === "don" ? "animate-drum-hit shadow-[0_0_20px_hsl(var(--drum-don))]" : ""}
          `}
          style={{
            background: hitAnimation === "don" 
              ? "radial-gradient(circle, hsl(var(--drum-don)), hsl(0 84% 45%))"
              : "hsl(var(--drum-don))"
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl">🥁</span>
            <span className="text-xs">F/J</span>
          </div>
        </Button>
        {hitAnimation === "don" && (
          <div className="absolute inset-0 rounded-full animate-perfect-glow bg-note-glow/30" />
        )}
      </div>

      {/* Ka Drum (Blue) */}
      <div className="relative">
        <Button
          onClick={() => handleDrumHit("ka")}
          disabled={!isPlaying}
          className={`
            w-32 h-32 rounded-full bg-drum-ka border-4 border-drum-rim
            hover:bg-drum-ka/90 active:scale-95 transition-all duration-150
            text-white font-bold text-lg shadow-lg
            ${hitAnimation === "ka" ? "animate-drum-hit shadow-[0_0_20px_hsl(var(--drum-ka))]" : ""}
          `}
          style={{
            background: hitAnimation === "ka" 
              ? "radial-gradient(circle, hsl(var(--drum-ka)), hsl(220 91% 55%))"
              : "hsl(var(--drum-ka))"
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl">🔵</span>
            <span className="text-xs">D/K</span>
          </div>
        </Button>
        {hitAnimation === "ka" && (
          <div className="absolute inset-0 rounded-full animate-perfect-glow bg-note-glow/30" />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-muted-foreground">
        <p className="text-sm">
          Red (Don): F or J keys | Blue (Ka): D or K keys
        </p>
      </div>
    </div>
  );
};