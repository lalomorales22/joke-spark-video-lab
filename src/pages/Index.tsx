import { useState } from "react";
import StudioHeader from "@/components/studio/StudioHeader";
import JokeInput from "@/components/studio/JokeInput";
import FileUpload from "@/components/studio/FileUpload";
import ProcessingSteps from "@/components/studio/ProcessingSteps";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  // State management
  const [joke, setJoke] = useState("");
  const [rewrittenJoke, setRewrittenJoke] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>();

  // File previews
  const [thumbnailPreview, setThumbnailPreview] = useState<string>();
  const [avatarPreview, setAvatarPreview] = useState<string>();

  // Processing steps
  const [processingSteps, setProcessingSteps] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: "pending" | "processing" | "completed" | "error";
    progress?: number;
  }>>([
    {
      id: "tts",
      title: "Generate Voice-Over",
      description: "Converting your joke to speech with ElevenLabs",
      status: "pending"
    },
    {
      id: "captions",
      title: "Create Captions",
      description: "Generating synchronized captions",
      status: "pending"
    },
    {
      id: "composition",
      title: "Compose Video",
      description: "Combining thumbnail, video, audio, and captions",
      status: "pending"
    },
    {
      id: "render",
      title: "Final Render",
      description: "Exporting your finished video",
      status: "pending"
    }
  ]);

  const handleRewriteJoke = async () => {
    if (!joke.trim()) {
      toast({
        title: "No joke entered",
        description: "Please enter a joke first!",
        variant: "destructive"
      });
      return;
    }

    setIsRewriting(true);
    
    // TODO: Integrate with OpenAI API
    // For now, simulate the API call
    setTimeout(() => {
      setRewrittenJoke(`Here's your enhanced joke: ${joke} (This is a placeholder - OpenAI integration needed)`);
      setIsRewriting(false);
      toast({
        title: "Joke rewritten!",
        description: "Your joke has been enhanced by AI"
      });
    }, 2000);
  };

  const handleFileSelect = (file: File, type: "video" | "thumbnail" | "avatar") => {
    switch (type) {
      case "video":
        setVideoFile(file);
        toast({
          title: "Video uploaded",
          description: `${file.name} ready for processing`
        });
        break;
      case "thumbnail":
        setThumbnailFile(file);
        const thumbnailUrl = URL.createObjectURL(file);
        setThumbnailPreview(thumbnailUrl);
        toast({
          title: "Thumbnail uploaded",
          description: "Thumbnail will be shown for 1 second at the start"
        });
        break;
      case "avatar":
        setAvatarFile(file);
        const avatarUrl = URL.createObjectURL(file);
        setAvatarPreview(avatarUrl);
        toast({
          title: "Avatar uploaded",
          description: "Avatar will be displayed on your video"
        });
        break;
    }
  };

  const canStartProcessing = (): boolean => {
    return !!(rewrittenJoke.trim() && videoFile && thumbnailFile && avatarFile);
  };

  const handleStartProcessing = async () => {
    if (!canStartProcessing()) {
      toast({
        title: "Missing requirements",
        description: "Please complete all steps before processing",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // TODO: Implement actual video processing pipeline
    // This will involve:
    // 1. Sending rewritten joke to ElevenLabs for TTS
    // 2. Generating captions with timing
    // 3. Video composition with FFmpeg or similar
    // 4. Combining all elements

    // Simulate processing steps
    const steps = [...processingSteps];
    
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = "processing";
      setProcessingSteps([...steps]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      steps[i].status = "completed";
      setProcessingSteps([...steps]);
    }

    // Simulate final video
    setFinalVideoUrl("https://example.com/final-video.mp4"); // This would be the actual generated video
    setIsProcessing(false);
    
    toast({
      title: "Video generated successfully!",
      description: "Your joke short is ready for download"
    });
  };

  const handleDownload = () => {
    if (finalVideoUrl) {
      // TODO: Implement actual download functionality
      toast({
        title: "Download started",
        description: "Your video is being downloaded"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <StudioHeader />
        
        <div className="grid gap-8 max-w-6xl mx-auto">
          {/* Step 1: Joke Input */}
          <JokeInput
            joke={joke}
            setJoke={setJoke}
            rewrittenJoke={rewrittenJoke}
            setRewrittenJoke={setRewrittenJoke}
            isRewriting={isRewriting}
            onRewrite={handleRewriteJoke}
          />

          {/* Steps 2-4: File Uploads */}
          <div className="grid md:grid-cols-3 gap-6">
            <FileUpload
              title="Upload Video"
              description="Upload your 1-1.5 minute MP4 clip"
              accept="video/mp4"
              icon="video"
              file={videoFile}
              onFileSelect={(file) => handleFileSelect(file, "video")}
              step={2}
            />
            
            <FileUpload
              title="Upload Thumbnail"
              description="Thumbnail shown for 1 second at start"
              accept="image/*"
              icon="image"
              file={thumbnailFile}
              onFileSelect={(file) => handleFileSelect(file, "thumbnail")}
              preview={thumbnailPreview}
              step={3}
            />
            
            <FileUpload
              title="Upload Avatar"
              description="Your avatar displayed on the video"
              accept="image/*"
              icon="avatar"
              file={avatarFile}
              onFileSelect={(file) => handleFileSelect(file, "avatar")}
              preview={avatarPreview}
              step={4}
            />
          </div>

          {/* Step 5: Processing */}
          <ProcessingSteps
            steps={processingSteps}
            onStart={handleStartProcessing}
            onDownload={handleDownload}
            canStart={canStartProcessing()}
            isProcessing={isProcessing}
            finalVideoUrl={finalVideoUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;