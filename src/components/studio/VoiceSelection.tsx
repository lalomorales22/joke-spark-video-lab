import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_VOICES, ElevenLabsVoice } from "@/lib/api";
import { Mic, User, Zap } from "lucide-react";

interface VoiceSelectionProps {
  selectedVoice: string;
  setSelectedVoice: (voiceId: string) => void;
}

const VoiceSelection = ({ selectedVoice, setSelectedVoice }: VoiceSelectionProps) => {
  const getVoiceIcon = (voice: ElevenLabsVoice) => {
    if (voice.gender === 'male') return <User className="w-4 h-4 text-blue-400" />;
    if (voice.gender === 'female') return <User className="w-4 h-4 text-pink-400" />;
    return <Mic className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-2">
       <label className="text-sm font-medium text-foreground/80 mb-2 block">
        Choose a Voice
      </label>
      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
        <SelectTrigger className="w-full bg-muted/30 border-border/50 focus:border-studio-purple/50 focus:ring-studio-purple/20">
          <SelectValue placeholder="Select a voice..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-border/50">
          {AVAILABLE_VOICES.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center gap-3">
                {getVoiceIcon(voice)}
                <div className="flex-1">
                  <p className="font-semibold">{voice.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {voice.accent} - {voice.description} ({voice.useCase})
                  </p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VoiceSelection; 