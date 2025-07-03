import { Sparkles, Video, Mic } from "lucide-react";

const StudioHeader = () => {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-full text-primary-foreground">
          <Sparkles className="w-5 h-5" />
          <Video className="w-5 h-5" />
          <Mic className="w-5 h-5" />
        </div>
      </div>
      
      <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
        Jokes Shorts Studio
      </h1>
      
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Transform your jokes into viral-ready short videos with AI-powered rewriting, 
        professional voice-over, and automatic video editing
      </p>
    </div>
  );
};

export default StudioHeader;