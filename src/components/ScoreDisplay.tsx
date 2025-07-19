import { Card } from "@/components/ui/card";
import { GameState } from "./TaikoGame";

interface ScoreDisplayProps {
  gameState: GameState;
}

export const ScoreDisplay = ({ gameState }: ScoreDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 text-center bg-card/50 backdrop-blur-sm">
        <div className="text-2xl font-bold text-primary">
          {gameState.score.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">Score</div>
      </Card>
      
      <Card className="p-4 text-center bg-card/50 backdrop-blur-sm">
        <div className={`text-2xl font-bold text-accent ${gameState.combo > 10 ? "animate-combo-bounce" : ""}`}>
          {gameState.combo}
        </div>
        <div className="text-sm text-muted-foreground">Combo</div>
      </Card>
      
      <Card className="p-4 text-center bg-card/50 backdrop-blur-sm">
        <div className="text-2xl font-bold text-secondary">
          {gameState.accuracy.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground">Accuracy</div>
      </Card>
    </div>
  );
};