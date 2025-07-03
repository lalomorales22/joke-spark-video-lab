import { useState } from "react";
import StudioHeader from "@/components/studio/StudioHeader";
import JokeInput from "@/components/studio/JokeInput";
import FileUpload from "@/components/studio/FileUpload";
import ProcessingSteps from "@/components/studio/ProcessingSteps";
import { useToast } from "@/hooks/use-toast";
import { rewriteJokeWithAI, hasValidApiKeys, generateVoiceWithElevenLabs, generateCaptions, downloadFile, getAudioDuration, AVAILABLE_VOICES } from "@/lib/api";
import { VideoProcessor } from "@/lib/videoProcessor";
import { transcodeToMp4, canTranscodeToMp4 } from "@/lib/transcoder";

const Index = () => {
  const { toast } = useToast();

  // State management
  const [joke, setJoke] = useState("");
  const [rewrittenJoke, setRewrittenJoke] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[0].id);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>();
  const [finalVideoBlob, setFinalVideoBlob] = useState<Blob>();
  const [webmVideoBlob, setWebmVideoBlob] = useState<Blob>(); // Store WebM as fallback

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
      id: "transcode",
      title: "Transcode to MP4",
      description: "Converting video for maximum compatibility",
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

    if (!hasValidApiKeys()) {
      toast({
        title: "API Keys Required",
        description: "Please configure your API keys in settings first",
        variant: "destructive"
      });
      return;
    }

    setIsRewriting(true);
    
    try {
      const enhancedJoke = await rewriteJokeWithAI(joke);
      setRewrittenJoke(enhancedJoke);
      toast({
        title: "Joke rewritten!",
        description: "Your joke has been enhanced by AI"
      });
    } catch (error) {
      console.error('Failed to rewrite joke:', error);
      toast({
        title: "Error rewriting joke",
        description: "Please check your API key and try again",
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
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
    return !!(rewrittenJoke.trim() && videoFile && thumbnailFile && avatarFile && hasValidApiKeys());
  };

  const handleStartProcessing = async () => {
    if (!canStartProcessing()) {
      toast({
        title: "Missing requirements",
        description: "Please complete all steps and configure API keys before processing",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const steps = [...processingSteps];
    
    const updateStep = (stepId: string, status: "processing" | "completed" | "error", progress?: number) => {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      if (stepIndex !== -1) {
        steps[stepIndex].status = status;
        if (progress !== undefined) steps[stepIndex].progress = progress;
        setProcessingSteps([...steps]);
      }
    };
    
    try {
      // Step 1: Generate Voice-Over with ElevenLabs
      updateStep("tts", "processing");
      const audioBlob = await generateVoiceWithElevenLabs(rewrittenJoke, selectedVoice);
      updateStep("tts", "completed");

      // Step 2: Generate Captions
      updateStep("captions", "processing");
      const audioDuration = await getAudioDuration(audioBlob);
      const captions = generateCaptions(rewrittenJoke, audioDuration);
      updateStep("captions", "completed");

      // Step 3: Compose Video
      updateStep("composition", "processing");
      const videoProcessor = new VideoProcessor();
      
      const compositionData = {
        videoFile: videoFile!,
        thumbnailFile: thumbnailFile!,
        avatarFile: avatarFile!,
        audioBlob,
        captions
      };

      const webmVideoBlob = await videoProcessor.processVideo(compositionData, (progress) => {
        updateStep("composition", "processing", progress);
      });
      updateStep("composition", "completed");
      
      // Store WebM blob as fallback
      setWebmVideoBlob(webmVideoBlob);

      // Check if we already have MP4 (browser might support direct MP4 recording)
      const isAlreadyMp4 = webmVideoBlob.type.includes('mp4');
      
      if (isAlreadyMp4) {
        console.log('Video is already in MP4 format! No transcoding needed.');
        updateStep("transcode", "completed");
        updateStep("render", "processing");
        
        const videoUrl = URL.createObjectURL(webmVideoBlob);
        setFinalVideoUrl(videoUrl);
        setFinalVideoBlob(webmVideoBlob);
        
        updateStep("render", "completed");
        setIsProcessing(false);
        
        toast({
          title: "Video generated successfully!",
          description: "Your joke short is ready for download (MP4 format)"
        });
        
        return;
      }

      // Step 4: Transcode to MP4 (only if needed)
      updateStep("transcode", "processing");
      
      // Check if transcoding is likely to work
      if (!canTranscodeToMp4()) {
        console.warn('MP4 transcoding may not work in this browser environment');
        toast({
          title: "Browser Compatibility Notice",
          description: "MP4 transcoding may not work due to browser security policies. WebM format will be used.",
          variant: "default"
        });
      }
      
      let mp4VideoBlob: Blob;
      try {
        mp4VideoBlob = await transcodeToMp4(webmVideoBlob, (progress) => {
          updateStep("transcode", "processing", progress);
        });
        updateStep("transcode", "completed");
        
        toast({
          title: "MP4 conversion successful!",
          description: "Video has been converted to MP4 format"
        });
      } catch (transcodeError) {
        console.error('Transcoding to MP4 failed:', transcodeError);
        updateStep("transcode", "error");
        
        // Show warning but continue with WebM
        const errorMessage = transcodeError instanceof Error ? transcodeError.message : 'Unknown error';
        
        toast({
          title: "MP4 transcoding failed",
          description: errorMessage.includes('SharedArrayBuffer') 
            ? "Your browser doesn't support MP4 conversion. Download the WebM video instead."
            : `Video will be available in WebM format. Error: ${errorMessage}`,
          variant: "default"
        });
        
        // Use WebM as fallback
        mp4VideoBlob = webmVideoBlob;
      }

      // Step 5: Final Processing
      updateStep("render", "processing");
      
      // Convert to downloadable format
      const videoUrl = URL.createObjectURL(mp4VideoBlob);
      setFinalVideoUrl(videoUrl);
      setFinalVideoBlob(mp4VideoBlob);
      
      updateStep("render", "completed");
      setIsProcessing(false);
      
      toast({
        title: "Video generated successfully!",
        description: "Your joke short is ready for download"
      });

    } catch (error) {
      console.error('Video processing failed:', error);
      
      // Mark current step as error
      const currentStepId = steps.find(s => s.status === "processing")?.id;
      if (currentStepId) {
        updateStep(currentStepId, "error");
      }
      
      setIsProcessing(false);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred during processing",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (finalVideoBlob) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const isMp4 = finalVideoBlob.type.includes('mp4');
      const extension = isMp4 ? 'mp4' : 'webm';
      const filename = `joke-short-${timestamp}.${extension}`;
      downloadFile(finalVideoBlob, filename);
      toast({
        title: "Download started",
        description: `${filename} is being downloaded`
      });
    } else {
      toast({
        title: "No video available",
        description: "Please process your video first",
        variant: "destructive"
      });
    }
  };

  const handleDownloadWebM = () => {
    if (webmVideoBlob) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `joke-short-${timestamp}.webm`;
      downloadFile(webmVideoBlob, filename);
      toast({
        title: "Download started",
        description: `${filename} (WebM format) is being downloaded`
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
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
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