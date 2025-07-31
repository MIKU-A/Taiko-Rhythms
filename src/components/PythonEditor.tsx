import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play, Code, Download } from "lucide-react";
import { Note } from "./TaikoGame";

interface PythonEditorProps {
  onPatternGenerate?: (pattern: Omit<Note, "id" | "position" | "hit">[]) => void;
}

export const PythonEditor = ({ onPatternGenerate }: PythonEditorProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState(`# Python-style rhythm pattern generator
def generate_pattern(bpm=120, pattern_type="basic"):
    """Generate a taiko rhythm pattern"""
    beat_duration = 60000 / bpm  # milliseconds per beat
    
    pattern = []
    
    if pattern_type == "basic":
        # Simple alternating don/ka pattern
        for i in range(8):
            timing = i * beat_duration
            note_type = "don" if i % 2 == 0 else "ka"
            pattern.append({"timing": timing, "type": note_type})
    
    elif pattern_type == "complex":
        # More complex pattern with big drums
        beats = [
            (0, "don"), (0.5, "don"), (1, "ka"), 
            (2, "big-don"), (2.5, "ka"), (3, "don"),
            (3.5, "ka"), (4, "big-ka"), (5, "don"),
            (5.5, "don"), (6, "ka"), (7, "don")
        ]
        for beat_pos, note_type in beats:
            timing = beat_pos * beat_duration
            pattern.append({"timing": timing, "type": note_type})
    
    elif pattern_type == "rapid":
        # Rapid-fire pattern
        for i in range(16):
            timing = i * (beat_duration / 2)
            note_type = "don" if i % 4 < 2 else "ka"
            pattern.append({"timing": timing, "type": note_type})
    
    return pattern

# Generate pattern - change parameters here!
rhythm = generate_pattern(bpm=140, pattern_type="complex")`);

  const [output, setOutput] = useState("");

  const [generatedPattern, setGeneratedPattern] = useState<Omit<Note, "id" | "position" | "hit">[]>([]);

  const runCode = () => {
    try {
      // Execute Python-style code and generate actual pattern
      const executeCode = (code: string) => {
        let output = "";
        let pattern: Omit<Note, "id" | "position" | "hit">[] = [];
        
        // Extract parameters from code
        const bpmMatch = code.match(/bpm[=\s]*(\d+)/);
        const typeMatch = code.match(/pattern_type[=\s]*["']([^"']+)["']/);
        
        const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 120;
        const patternType = typeMatch ? typeMatch[1] : "basic";
        const beatDuration = 60000 / bpm;
        
        output += `Executing with BPM: ${bpm}, Pattern: ${patternType}\n\n`;
        
        // Generate pattern based on type
        if (patternType === "basic") {
          for (let i = 0; i < 8; i++) {
            const timing = i * beatDuration;
            const type = i % 2 === 0 ? "don" : "ka";
            pattern.push({ timing, type: type as any });
            output += `${timing.toFixed(0)}ms: ${type}\n`;
          }
        } else if (patternType === "complex") {
          const beats = [
            [0, "don"], [0.5, "don"], [1, "ka"], 
            [2, "big-don"], [2.5, "ka"], [3, "don"],
            [3.5, "ka"], [4, "big-ka"], [5, "don"],
            [5.5, "don"], [6, "ka"], [7, "don"]
          ];
          for (const [beatPos, noteType] of beats) {
            const timing = (beatPos as number) * beatDuration;
            pattern.push({ timing, type: noteType as any });
            output += `${timing.toFixed(0)}ms: ${noteType}\n`;
          }
        } else if (patternType === "rapid") {
          for (let i = 0; i < 16; i++) {
            const timing = i * (beatDuration / 2);
            const type = i % 4 < 2 ? "don" : "ka";
            pattern.push({ timing, type: type as any });
            output += `${timing.toFixed(0)}ms: ${type}\n`;
          }
        }
        
        return { output, pattern };
      };

      const result = executeCode(code);
      setOutput(result.output);
      setGeneratedPattern(result.pattern);
      
      toast({
        title: "Pattern Generated!",
        description: `Created ${result.pattern.length} notes. Click "Load to Game" to use it.`,
      });
    } catch (error) {
      setOutput(`Error: ${error}`);
      toast({
        title: "Execution Error",
        description: "There was an error running your code.",
        variant: "destructive",
      });
    }
  };

  const loadPatternToGame = () => {
    if (generatedPattern.length > 0 && onPatternGenerate) {
      onPatternGenerate(generatedPattern);
      toast({
        title: "Pattern Loaded!",
        description: "Your Python-generated pattern is now ready to play!",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Code className="w-5 h-5" />
          Python-Style Rhythm Editor
        </h3>
        <div className="flex gap-2">
          <Button onClick={runCode} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Run Code
          </Button>
          {generatedPattern.length > 0 && (
            <Button onClick={loadPatternToGame} variant="default" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Load to Game
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Code Editor</label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your Python-style rhythm generation code here..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Output</label>
          <Card className="p-4 min-h-[300px] bg-muted/50">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {output || "Run code to see output..."}
            </pre>
          </Card>
        </div>
      </div>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-semibold mb-2">About Python Integration:</p>
        <p>
          This is a demo Python-style editor for creating rhythm patterns. In a full implementation, 
          you could use libraries like Pyodide to run actual Python code in the browser, or connect 
          to a Python backend for server-side execution.
        </p>
        <p className="mt-2">
          Current features: Syntax highlighting simulation, pattern generation examples, 
          and mock execution for demonstration purposes.
        </p>
      </div>
    </div>
  );
};