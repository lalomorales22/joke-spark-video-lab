import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Loader2, Download, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number;
}

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  onStart: () => void;
  onDownload: () => void;
  canStart: boolean;
  isProcessing: boolean;
  finalVideoUrl?: string;
}

const ProcessingSteps = ({
  steps,
  onStart,
  onDownload,
  canStart,
  isProcessing,
  finalVideoUrl
}: ProcessingStepsProps) => {
  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-studio-success" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-studio-purple animate-spin" />;
      case "error":
        return <Circle className="w-5 h-5 text-destructive" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-studio-purple" />
          Step 5: Process & Generate Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
              {getStepIcon(step)}
              <div className="flex-1">
                <h4 className={cn(
                  "font-medium",
                  step.status === "completed" && "text-studio-success",
                  step.status === "processing" && "text-studio-purple",
                  step.status === "error" && "text-destructive"
                )}>
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.status === "processing" && step.progress !== undefined && (
                  <Progress value={step.progress} className="mt-2 h-2" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onStart}
            disabled={!canStart || isProcessing}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Processing
              </>
            )}
          </Button>

          {finalVideoUrl && (
            <Button
              onClick={onDownload}
              variant="outline"
              className="border-studio-success text-studio-success hover:bg-studio-success/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
          )}
        </div>

        {finalVideoUrl && (
          <div className="mt-6 p-4 bg-studio-success/10 rounded-lg border border-studio-success/20">
            <h4 className="font-medium text-studio-success mb-2">✨ Your video is ready!</h4>
            <video
              src={finalVideoUrl}
              controls
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingSteps;