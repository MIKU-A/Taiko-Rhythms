import { Note } from "./TaikoGame";

interface GameTrackProps {
  notes: Note[];
  isPlaying: boolean;
}

export const GameTrack = ({ notes, isPlaying }: GameTrackProps) => {
  const getNoteColor = (type: Note["type"]) => {
    switch (type) {
      case "don":
      case "big-don":
        return "bg-drum-don";
      case "ka":
      case "big-ka":
        return "bg-drum-ka";
      default:
        return "bg-muted";
    }
  };

  const getNoteSize = (type: Note["type"]) => {
    return type.includes("big") ? "w-16 h-16" : "w-12 h-12";
  };

  return (
    <div className="relative h-24 bg-track-bg rounded-lg border-2 border-drum-rim overflow-hidden">
      {/* Hit Target Zone */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-16 h-16 rounded-full border-4 border-accent bg-accent/20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-accent animate-pulse" />
      </div>

      {/* Track Line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-accent/50 transform -translate-y-1/2" />

      {/* Notes */}
      {notes.map((note) => (
        <div
          key={note.id}
          className={`
            absolute top-1/2 transform -translate-y-1/2 rounded-full 
            border-2 border-white/30 transition-all duration-100
            ${getNoteColor(note.type)} ${getNoteSize(note.type)}
            ${note.hit ? "opacity-0 scale-150" : "opacity-100"}
            ${isPlaying ? "" : "opacity-50"}
          `}
          style={{
            left: `${note.position}%`,
            transition: note.hit ? "all 0.3s ease-out" : "none",
            boxShadow: note.hit ? "0 0 20px hsl(var(--note-glow))" : "none"
          }}
        >
          {/* Note Symbol */}
          <div className="w-full h-full flex items-center justify-center text-white font-bold">
            {note.type.includes("don") ? "○" : "△"}
          </div>
        </div>
      ))}

      {/* Track Labels */}
      <div className="absolute right-4 top-2 text-xs text-muted-foreground">
        Track
      </div>
    </div>
  );
};