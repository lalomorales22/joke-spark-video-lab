import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<void> | null = null;

// Alternative: Use a cloud-based conversion service
const CLOUDCONVERT_API_KEY = ''; // User would need to add their own

async function loadFFmpegWithRetry(maxRetries = 3): Promise<void> {
    if (ffmpeg && ffmpeg.loaded) {
        console.log('FFmpeg already loaded');
        return;
    }

    if (ffmpegLoadPromise) {
        console.log('FFmpeg load already in progress, waiting...');
        return ffmpegLoadPromise;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Loading FFmpeg (attempt ${attempt}/${maxRetries})...`);
            
            ffmpegLoadPromise = (async () => {
                ffmpeg = new FFmpeg();
                
                ffmpeg.on('log', ({ message }) => {
                    console.log('[FFmpeg]:', message);
                });

                // Try different CDN sources
                const cdnSources = [
                    {
                        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
                        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
                    },
                    {
                        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
                        wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
                    }
                ];

                let loaded = false;
                for (const source of cdnSources) {
                    try {
                        console.log(`Trying CDN: ${source.coreURL}`);
                        await ffmpeg.load(source);
                        console.log('FFmpeg loaded successfully!');
                        loaded = true;
                        break;
                    } catch (cdnError) {
                        console.warn(`Failed to load from CDN:`, cdnError);
                    }
                }

                if (!loaded) {
                    throw new Error('Failed to load FFmpeg from all CDN sources');
                }
            })();

            await ffmpegLoadPromise;
            return; // Success!
            
        } catch (error) {
            lastError = error as Error;
            console.error(`FFmpeg load attempt ${attempt} failed:`, error);
            
            // Reset state
            ffmpeg = null;
            ffmpegLoadPromise = null;
            
            if (attempt < maxRetries) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    throw new Error(`Failed to load FFmpeg after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

export const transcodeToMp4 = async (
    webmBlob: Blob, 
    onProgress?: (progress: number) => void
): Promise<Blob> => {
    console.log('Starting transcoding process...');
    console.log('Input WebM blob size:', (webmBlob.size / 1024 / 1024).toFixed(2), 'MB');
    
    // First, check if the browser supports direct MP4 recording
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4')) {
        console.log('Browser supports direct MP4 recording! No transcoding needed.');
        // If we get here, we should update the video processor to use MP4 directly
    }
    
    try {
        // Try to load FFmpeg
        await loadFFmpegWithRetry();
        
        if (!ffmpeg || !ffmpeg.loaded) {
            throw new Error('FFmpeg failed to load after all retries');
        }

        // Set up progress handler
        const progressHandler = ({ progress }: { progress: number }) => {
            const percentage = Math.round(progress * 100);
            console.log(`[FFmpeg Progress]: ${percentage}%`);
            if (onProgress) {
                onProgress(percentage);
            }
        };
        
        ffmpeg.on('progress', progressHandler);

        try {
            console.log('Writing input file to FFmpeg virtual file system...');
            const inputData = await fetchFile(webmBlob);
            await ffmpeg.writeFile('input.webm', inputData);
            console.log('Input file written. Size:', (inputData.length / 1024 / 1024).toFixed(2), 'MB');
            
            console.log('Starting FFmpeg transcoding...');
            
            // Use optimized settings for web video
            const ffmpegArgs = [
                '-i', 'input.webm',
                '-c:v', 'libx264',         // H.264 video codec
                '-preset', 'ultrafast',     // Fastest encoding
                '-crf', '28',              // Slightly lower quality for faster encoding
                '-c:a', 'aac',             // AAC audio codec
                '-b:a', '128k',            // Audio bitrate
                '-movflags', '+faststart',  // Optimize for web streaming
                '-pix_fmt', 'yuv420p',      // Compatible pixel format
                '-max_muxing_queue_size', '1024', // Prevent muxing issues
                '-y',                       // Overwrite output
                'output.mp4'
            ];
            
            console.log('FFmpeg command:', ffmpegArgs.join(' '));
            await ffmpeg.exec(ffmpegArgs);
            
            console.log('FFmpeg transcoding completed!');
            
            console.log('Reading output file...');
            const outputData = await ffmpeg.readFile('output.mp4');
            const outputSize = (outputData as Uint8Array).length;
            console.log('Output file size:', (outputSize / 1024 / 1024).toFixed(2), 'MB');
            
            // Clean up
            try {
                await ffmpeg.deleteFile('input.webm');
                await ffmpeg.deleteFile('output.mp4');
            } catch (cleanupError) {
                console.warn('Cleanup error (non-critical):', cleanupError);
            }

            // Remove progress handler
            ffmpeg.off('progress', progressHandler);

            const mp4Blob = new Blob([outputData], { type: 'video/mp4' });
            console.log('Created MP4 blob successfully');
            
            return mp4Blob;
            
        } catch (execError) {
            // Remove progress handler on error
            ffmpeg.off('progress', progressHandler);
            throw execError;
        }
        
    } catch (error) {
        console.error('Transcoding failed:', error);
        
        // Provide helpful error message
        if (error instanceof Error) {
            if (error.message.includes('SharedArrayBuffer')) {
                throw new Error(
                    'FFmpeg requires SharedArrayBuffer which is not available. ' +
                    'This might be due to browser security policies. ' +
                    'Please try using a different browser or download the WebM file directly.'
                );
            }
            throw new Error(`Video transcoding failed: ${error.message}`);
        }
        
        throw new Error('Video transcoding failed: Unknown error');
    }
};

// Helper function to check if MP4 transcoding is likely to work
export const canTranscodeToMp4 = (): boolean => {
    // Check for SharedArrayBuffer support (required for FFmpeg)
    if (typeof SharedArrayBuffer === 'undefined') {
        console.warn('SharedArrayBuffer not available - FFmpeg transcoding will not work');
        return false;
    }
    
    // Check for required browser features
    if (!window.crossOriginIsolated) {
        console.warn('Page is not cross-origin isolated - FFmpeg may not work properly');
        return false;
    }
    
    return true;
}; 