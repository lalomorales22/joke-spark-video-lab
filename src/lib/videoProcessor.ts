export interface VideoCompositionData {
  videoFile: File;
  thumbnailFile: File;
  avatarFile: File;
  audioBlob: Blob;
  captions: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1080; // 9:16 aspect ratio for shorts
    this.canvas.height = 1920;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async processVideo(data: VideoCompositionData, onProgress?: (progress: number) => void): Promise<Blob> {
    try {
      onProgress?.(10);

      // Load all media files
      const [video, thumbnail, avatar, audio] = await Promise.all([
        this.loadVideo(data.videoFile),
        this.loadImage(data.thumbnailFile),
        this.loadImage(data.avatarFile),
        this.loadAudio(data.audioBlob)
      ]);

      onProgress?.(30);

      // Create media stream from canvas
      const stream = this.canvas.captureStream(30); // 30 FPS
      
      // Add audio track to the stream
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(await data.audioBlob.arrayBuffer());
      const audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      
      const dest = audioContext.createMediaStreamDestination();
      audioSource.connect(dest);
      
      // Combine video and audio streams
      const audioTrack = dest.stream.getAudioTracks()[0];
      stream.addTrack(audioTrack);

      onProgress?.(50);

      // Set up media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      audioSource.start();

      onProgress?.(60);

      // Render video frames
      await this.renderVideoFrames(video, thumbnail, avatar, data.captions, audioBuffer.duration, onProgress);

      onProgress?.(90);

      // Stop recording and return result
      return new Promise((resolve) => {
        this.mediaRecorder!.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          onProgress?.(100);
          resolve(blob);
        };
        this.mediaRecorder!.stop();
        audioSource.stop();
        audioContext.close();
      });

    } catch (error) {
      console.error('Video processing failed:', error);
      throw error;
    }
  }

  private async renderVideoFrames(
    video: HTMLVideoElement, 
    thumbnail: HTMLImageElement,
    avatar: HTMLImageElement,
    captions: any[],
    duration: number,
    onProgress?: (progress: number) => void
  ) {
    const fps = 30;
    const totalFrames = Math.floor(duration * fps);
    const thumbnailDuration = 1; // 1 second thumbnail
    const thumbnailFrames = fps * thumbnailDuration;

    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTime = frame / fps;
      
      // Clear canvas
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      if (frame < thumbnailFrames) {
        // Show thumbnail for first second
        this.drawThumbnail(thumbnail);
      } else {
        // Show main video content
        video.currentTime = currentTime - thumbnailDuration;
        this.drawMainVideo(video, avatar, captions, currentTime - thumbnailDuration);
      }

      // Update progress during rendering
      if (frame % 30 === 0) { // Update every second
        const progress = 60 + (frame / totalFrames) * 30; // 60-90% range
        onProgress?.(progress);
      }

      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, 1000 / fps));
    }
  }

  private drawThumbnail(thumbnail: HTMLImageElement) {
    // Draw thumbnail centered and scaled to fit
    const scale = Math.min(this.canvas.width / thumbnail.width, this.canvas.height / thumbnail.height);
    const scaledWidth = thumbnail.width * scale;
    const scaledHeight = thumbnail.height * scale;
    const x = (this.canvas.width - scaledWidth) / 2;
    const y = (this.canvas.height - scaledHeight) / 2;
    
    this.ctx.drawImage(thumbnail, x, y, scaledWidth, scaledHeight);
  }

  private drawMainVideo(video: HTMLVideoElement, avatar: HTMLImageElement, captions: any[], currentTime: number) {
    // Draw main video (centered, maintaining aspect ratio)
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = this.canvas.width / this.canvas.height;
    
    let drawWidth, drawHeight, x, y;
    
    if (videoAspect > canvasAspect) {
      // Video is wider than canvas
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.width / videoAspect;
      x = 0;
      y = (this.canvas.height - drawHeight) / 2;
    } else {
      // Video is taller than canvas
      drawWidth = this.canvas.height * videoAspect;
      drawHeight = this.canvas.height;
      x = (this.canvas.width - drawWidth) / 2;
      y = 0;
    }
    
    this.ctx.drawImage(video, x, y, drawWidth, drawHeight);

    // Draw avatar (top-right corner)
    const avatarSize = 100;
    const avatarX = this.canvas.width - avatarSize - 20;
    const avatarY = 20;
    
    // Draw circular avatar
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    this.ctx.clip();
    this.ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    this.ctx.restore();

    // Draw captions
    this.drawCaptions(captions, currentTime);
  }

  private drawCaptions(captions: any[], currentTime: number) {
    const activeWords = captions.filter(caption => 
      currentTime >= caption.start && currentTime <= caption.end
    );

    if (activeWords.length > 0) {
      const text = activeWords.map(w => w.word).join(' ');
      
      // Caption styling
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4;
      this.ctx.textAlign = 'center';
      
      // Draw text with outline
      const x = this.canvas.width / 2;
      const y = this.canvas.height - 200; // Bottom area
      
      this.ctx.strokeText(text, x, y);
      this.ctx.fillText(text, x, y);
    }
  }

  private loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.onloadeddata = () => resolve(video);
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private loadAudio(blob: Blob): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadeddata = () => resolve(audio);
      audio.onerror = reject;
      audio.src = URL.createObjectURL(blob);
    });
  }
}