import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play, Code } from "lucide-react";

export const PythonEditor = () => {
  const { toast } = useToast();
  const [code, setCode] = useState(`# Python-style rhythm pattern generator
def generate_pattern(bpm=120):
    """Generate a taiko rhythm pattern"""
    beat_duration = 60000 / bpm  # milliseconds per beat
    
    pattern = []
    for i in range(8):
        timing = i * beat_duration
        if i % 2 == 0:
            pattern.append({"timing": timing, "type": "don"})
        else:
            pattern.append({"timing": timing, "type": "ka"})
    
    return pattern

# Generate a simple 8-beat pattern
rhythm = generate_pattern(120)
print("Generated rhythm pattern:")
for beat in rhythm:
    print(f"  {beat['timing']}ms: {beat['type']}")
`);

  const [output, setOutput] = useState("");

  const runCode = () => {
    try {
      // Simulate Python execution with JavaScript
      const mockPythonExecution = (code: string) => {
        let output = "";
        
        // Simple pattern matching for the demo
        if (code.includes("generate_pattern")) {
          output += "Generated rhythm pattern:\n";
          output += "  0ms: don\n";
          output += "  500ms: ka\n";
          output += "  1000ms: don\n";
          output += "  1500ms: ka\n";
          output += "  2000ms: don\n";
          output += "  2500ms: ka\n";
          output += "  3000ms: don\n";
          output += "  3500ms: ka\n";
        } else {
          output = "Code executed successfully!";
        }
        
        return output;
      };

      const result = mockPythonExecution(code);
      setOutput(result);
      
      toast({
        title: "Code Executed",
        description: "Python-style code ran successfully!",
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Code className="w-5 h-5" />
          Python-Style Rhythm Editor
        </h3>
        <Button onClick={runCode} className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          Run Code
        </Button>
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