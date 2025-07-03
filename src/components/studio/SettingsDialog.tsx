import { useState } from "react";
import { Settings, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ApiKeys {
  openai: string;
  elevenlabs: string;
}

const SettingsDialog = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showElevenLabs, setShowElevenLabs] = useState(false);
  
  // Load existing keys from localStorage
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const stored = localStorage.getItem('joke-studio-api-keys');
    return stored ? JSON.parse(stored) : { openai: '', elevenlabs: '' };
  });

  const handleSave = () => {
    // Validate keys
    if (!apiKeys.openai.trim()) {
      toast({
        title: "OpenAI API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    if (!apiKeys.elevenlabs.trim()) {
      toast({
        title: "ElevenLabs API Key Required", 
        description: "Please enter your ElevenLabs API key",
        variant: "destructive"
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('joke-studio-api-keys', JSON.stringify(apiKeys));
    
    toast({
      title: "Settings Saved",
      description: "Your API keys have been saved securely"
    });
    
    setIsOpen(false);
  };

  const handleInputChange = (field: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [field]: value }));
  };

  const hasKeys = apiKeys.openai && apiKeys.elevenlabs;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative border-border/50 hover:border-studio-purple/50 hover:bg-studio-purple/10"
        >
          <Settings className="w-4 h-4" />
          {hasKeys && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-studio-success rounded-full border-2 border-background" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-studio-purple" />
            API Configuration
          </DialogTitle>
          <DialogDescription>
            Enter your API keys to enable AI joke rewriting and voice generation. 
            Keys are stored securely in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* OpenAI API Key */}
          <Card className="bg-muted/20 border-border/30">
            <CardContent className="p-4 space-y-3">
              <Label htmlFor="openai-key" className="text-sm font-medium">
                OpenAI API Key
              </Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenAI ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => handleInputChange('openai', e.target.value)}
                  className="pr-10 bg-background/50 border-border/50 focus:border-studio-purple/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                >
                  {showOpenAI ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for AI joke rewriting. Get your key from{" "}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-studio-purple hover:underline"
                >
                  OpenAI Dashboard
                </a>
              </p>
            </CardContent>
          </Card>

          {/* ElevenLabs API Key */}
          <Card className="bg-muted/20 border-border/30">
            <CardContent className="p-4 space-y-3">
              <Label htmlFor="elevenlabs-key" className="text-sm font-medium">
                ElevenLabs API Key
              </Label>
              <div className="relative">
                <Input
                  id="elevenlabs-key"
                  type={showElevenLabs ? "text" : "password"}
                  placeholder="el_..."
                  value={apiKeys.elevenlabs}
                  onChange={(e) => handleInputChange('elevenlabs', e.target.value)}
                  className="pr-10 bg-background/50 border-border/50 focus:border-studio-purple/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowElevenLabs(!showElevenLabs)}
                >
                  {showElevenLabs ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for voice generation. Get your key from{" "}
                <a 
                  href="https://elevenlabs.io/app/settings/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-studio-purple hover:underline"
                >
                  ElevenLabs Settings
                </a>
              </p>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save API Keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;