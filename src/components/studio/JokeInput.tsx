import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2 } from "lucide-react";

interface JokeInputProps {
  joke: string;
  setJoke: (joke: string) => void;
  rewrittenJoke: string;
  setRewrittenJoke: (joke: string) => void;
  isRewriting: boolean;
  onRewrite: () => void;
}

const JokeInput = ({ 
  joke, 
  setJoke, 
  rewrittenJoke, 
  setRewrittenJoke,
  isRewriting, 
  onRewrite 
}: JokeInputProps) => {
  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-studio-purple" />
          Step 1: Enter Your Joke
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/80 mb-2 block">
            Original Joke
          </label>
          <Textarea
            placeholder="Enter your joke here... Make it funny!"
            value={joke}
            onChange={(e) => setJoke(e.target.value)}
            className="min-h-[120px] bg-muted/30 border-border/50 focus:border-studio-purple/50 focus:ring-studio-purple/20"
          />
        </div>
        
        <Button 
          onClick={onRewrite}
          disabled={!joke.trim() || isRewriting}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {isRewriting ? (
            <>
              <Wand2 className="w-4 h-4 mr-2 animate-spin" />
              AI is rewriting your joke...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Rewrite with AI Magic
            </>
          )}
        </Button>
        
        {rewrittenJoke && (
          <div className="animate-slide-up">
            <label className="text-sm font-medium text-foreground/80 mb-2 block">
              AI-Enhanced Joke
            </label>
            <Textarea
              value={rewrittenJoke}
              onChange={(e) => setRewrittenJoke(e.target.value)}
              className="min-h-[120px] bg-studio-success/10 border-studio-success/30 focus:border-studio-success/50"
              placeholder="Your AI-enhanced joke will appear here..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JokeInput;