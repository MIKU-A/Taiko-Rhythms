import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff } from "lucide-react";

interface DrumDetectorProps {
  onDrumHit: (drumType: "don" | "ka") => void;
  isActive: boolean;
}

export const DrumDetector = ({ onDrumHit, isActive }: DrumDetectorProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [sensitivity, setSensitivity] = useState(80);
  
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const microphoneRef = useRef<MediaStreamAudioSourceNode>();
  const streamRef = useRef<MediaStream>();
  const animationRef = useRef<number>();

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      // Configure analyser for better drum detection
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.1;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      startDetection();

      toast({
        title: "Drum Detection Active",
        description: "Hit your drums! Low sounds = Don, High sounds = Ka",
      });
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to detect drum hits.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsListening(false);
    toast({
      title: "Drum Detection Stopped",
      description: "Microphone disconnected.",
    });
  };

  const startDetection = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const freqArray = new Uint8Array(bufferLength);
    
    let lastHitTime = 0;
    let baseline = 0;
    let frameCount = 0;

    const detect = () => {
      if (!analyserRef.current || !isListening) return;

      analyserRef.current.getByteTimeDomainData(dataArray);
      analyserRef.current.getByteFrequencyData(freqArray);

      // Calculate RMS (Root Mean Square) for volume detection
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = (dataArray[i] - 128) / 128;
        rms += sample * sample;
      }
      rms = Math.sqrt(rms / dataArray.length) * 1000;

      // Establish baseline noise level
      frameCount++;
      if (frameCount < 100) {
        baseline = Math.max(baseline, rms * 0.1);
      }

      // Detect hits based on volume spike
      const threshold = baseline + (sensitivity / 10);
      const currentTime = Date.now();

      if (rms > threshold && currentTime - lastHitTime > 150) {
        // Analyze frequency content for drum type classification
        const lowFreqSum = freqArray.slice(0, 50).reduce((sum, val) => sum + val, 0);
        const midFreqSum = freqArray.slice(50, 150).reduce((sum, val) => sum + val, 0);
        const highFreqSum = freqArray.slice(150, 300).reduce((sum, val) => sum + val, 0);

        // Calculate frequency ratios
        const total = lowFreqSum + midFreqSum + highFreqSum;
        const lowRatio = lowFreqSum / total;
        const highRatio = highFreqSum / total;

        // Classify drum type based on frequency content
        // Don (red drum): More low-frequency content
        // Ka (blue drum): More high-frequency content
        const drumType: "don" | "ka" = lowRatio > 0.4 || lowRatio > highRatio ? "don" : "ka";

        if (isActive) {
          onDrumHit(drumType);
        }

        lastHitTime = currentTime;

        // Visual feedback
        toast({
          title: `${drumType.toUpperCase()} Hit!`,
          description: `Volume: ${Math.round(rms)} | Type: ${drumType}`,
        });
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // Auto-start/stop based on isActive prop
  useEffect(() => {
    if (isActive && !isListening) {
      startListening();
    } else if (!isActive && isListening) {
      stopListening();
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
      <Button
        onClick={isListening ? stopListening : startListening}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className="flex items-center gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            Stop Detection
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Start Detection
          </>
        )}
      </Button>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Sensitivity:</label>
        <input
          type="range"
          min="20"
          max="150"
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
          className="w-20"
        />
        <span className="text-sm text-muted-foreground">{sensitivity}</span>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Listening for drums...
        </div>
      )}
    </div>
  );
};