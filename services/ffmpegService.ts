
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FF_CORE_URL, FF_WASM_URL, FF_WORKER_URL } from '../constants';
import { Highlight, ProcessedClip } from '../types';
import { parseTimeToSeconds } from './utils';

export class FFmpegService {
  private ffmpeg: FFmpeg;
  private loaded: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(logCallback: (msg: string) => void) {
    if (this.loaded) return;

    this.ffmpeg.on('log', ({ message }) => {
        // Filter out noisy logs
        if(message.includes('frame=')) return; 
        logCallback(message);
    });

    try {
      logCallback("Loading FFmpeg core...");
      
      // Use toBlobURL to fetch and ensure correct MIME types.
      // This loads the scripts into Blobs locally, bypassing cross-origin worker restrictions.
      const workerBlobURL = await toBlobURL(FF_WORKER_URL, 'text/javascript');
      const coreBlobURL = await toBlobURL(FF_CORE_URL, 'text/javascript');
      const wasmBlobURL = await toBlobURL(FF_WASM_URL, 'application/wasm');

      logCallback("Initializing engine...");
      
      await this.ffmpeg.load({
        coreURL: coreBlobURL,
        wasmURL: wasmBlobURL,
        workerURL: workerBlobURL,
      });
      
      this.loaded = true;
    } catch (error) {
      console.error("Failed to load FFmpeg", error);
      throw new Error(
        "Failed to load video engine. " + 
        (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  async processClips(
    videoFile: File,
    highlights: Highlight[],
    onProgress: (current: number, total: number) => void
  ): Promise<ProcessedClip[]> {
    if (!this.loaded) throw new Error("FFmpeg not loaded");

    const inputFileName = 'input.mp4';
    
    // Write file to MEMFS
    await this.ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

    const results: ProcessedClip[] = [];

    for (let i = 0; i < highlights.length; i++) {
      const highlight = highlights[i];
      const outputName = `clip_${i}.mp4`;
      
      const startSec = parseTimeToSeconds(highlight.start_time);
      const endSec = parseTimeToSeconds(highlight.end_time);
      
      // Ensure valid duration
      let duration = endSec - startSec;
      if (duration <= 0) duration = 15; // Default fallback

      onProgress(i + 1, highlights.length);

      try {
        // Perform the cut
        // -ss before -i for input seeking (faster)
        // -c:v copy would be fastest but imprecise for non-keyframes. 
        // We use ultrafast re-encoding for frame-accurate cuts in browser.
        await this.ffmpeg.exec([
          '-ss', `${startSec}`,
          '-i', inputFileName,
          '-t', `${duration}`,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'aac',
          outputName
        ]);

        // Read result
        const data = await this.ffmpeg.readFile(outputName);
        const blob = new Blob([data], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);

        results.push({
          ...highlight,
          id: `clip-${i}`,
          url,
          blob,
          duration
        });
        
        // Cleanup individual clip
        await this.ffmpeg.deleteFile(outputName);
        
      } catch (clipError) {
        console.error(`Error processing clip ${i}`, clipError);
        // Continue with other clips even if one fails
      }
    }

    // Cleanup input file
    await this.ffmpeg.deleteFile(inputFileName);

    return results;
  }
}