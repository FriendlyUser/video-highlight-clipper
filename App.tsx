
import React, { useState, useCallback, useRef } from 'react';
import { GeminiService } from './services/geminiService';
import { FFmpegService } from './services/ffmpegService';
import { fileToBase64, formatBytes } from './services/utils';
import { AppStatus, Highlight, ProcessedClip, LogMessage } from './types';
import { MAX_FILE_SIZE_BYTES } from './constants';
import { ProcessingLog } from './components/ProcessingLog';
import { ResultsGrid } from './components/ResultsGrid';

// Initialize services outside component to persist instance
const ffmpegService = new FFmpegService();
let geminiService: GeminiService | null = null;

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [clips, setClips] = useState<ProcessedClip[]>([]);
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);

  const addLog = useCallback((message: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: Date.now(), message, type }]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cast target to any to avoid TS errors about 'files' missing on EventTarget in some environments
    const target = e.target as any;
    if (target.files && target.files[0]) {
      const selectedFile = target.files[0];
      
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        addLog(`File too large (${formatBytes(selectedFile.size)}). Demo limit is ${formatBytes(MAX_FILE_SIZE_BYTES)} to prevent crashes.`, 'error');
        return;
      }
      
      setFile(selectedFile);
      addLog(`Selected: ${selectedFile.name} (${formatBytes(selectedFile.size)})`, 'success');
      setStatus(AppStatus.IDLE);
      setClips([]);
    }
  };

  const processVideo = async () => {
    if (!file) return;
    
    try {
      // 0. Init Gemini
      if (!geminiService) {
         try {
           geminiService = new GeminiService();
         } catch (e) {
            addLog(String(e), 'error');
            addLog("API Key missing. Ensure process.env.API_KEY is set.", 'error');
            return;
         }
      }

      // 1. Load FFmpeg (Lazy load)
      setStatus(AppStatus.UPLOADING);
      addLog("Initializing FFmpeg engine...", 'info');
      
      try {
        await ffmpegService.load((msg) => {
          // Optional: detailed verbose ffmpeg logs
          // console.debug(msg); 
        });
        addLog("FFmpeg engine ready.", 'success');
      } catch (e: any) {
        addLog(`FFmpeg Load Error: ${e.message}`, 'error');
        addLog("Try refreshing the page or using a different browser.", 'error');
        setStatus(AppStatus.ERROR);
        return;
      }

      // 2. Analyze with Gemini
      setStatus(AppStatus.ANALYZING);
      addLog("Reading video file for analysis...", 'info');
      
      const base64 = await fileToBase64(file);
      
      addLog(`Sending to Gemini ${geminiService ? '2.5 Flash' : ''} for semantic analysis...`, 'info');
      
      let highlights: Highlight[] = [];
      if (geminiService) {
          highlights = await geminiService.analyzeVideo(base64, file.type);
      }

      if (highlights.length === 0) {
        throw new Error("No highlights found by AI.");
      }

      addLog(`AI identified ${highlights.length} viral moments.`, 'success');
      highlights.forEach(h => addLog(`> [${h.start_time}-${h.end_time}] ${h.subtitle}`, 'info'));

      // 3. Cut Video
      setStatus(AppStatus.CUTTING);
      addLog("Cutting video segments locally...", 'info');
      
      const processedClips = await ffmpegService.processClips(file, highlights, (curr, total) => {
        setProgress({ current: curr, total });
        addLog(`Processing clip ${curr}/${total}...`, 'info');
      });

      setClips(processedClips);
      setStatus(AppStatus.COMPLETED);
      addLog("Processing complete! Your clips are ready.", 'success');

    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      addLog(`Error: ${error.message || "Unknown error occurred"}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white selection:bg-indigo-500/30">
      <header className="border-b border-slate-800 bg-[#0B1120]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <h1 className="font-bold text-xl tracking-tight">VideoCutter<span className="text-indigo-400">AI</span></h1>
          </div>
          <div className="text-sm font-medium text-slate-400 border border-slate-800 rounded-full px-3 py-1 bg-slate-900/50">
            Powered by Gemini 2.0 Flash
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Turn Long Videos into <br/> Viral Shorts Instantly.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload an MP4. Gemini AI analyzes the content, finds the best moments, and our in-browser engine cuts them for you. No data leaves your browser during editing.
          </p>
        </div>

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto">
          <div className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
            ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'}
          `}>
            <input 
              type="file" 
              accept="video/mp4" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {file ? (
               <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-medium text-white">{file.name}</p>
                    <p className="text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); processVideo(); }}
                    disabled={status !== AppStatus.IDLE}
                    className={`
                      relative z-20 px-8 py-3 rounded-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all
                      ${status !== AppStatus.IDLE 
                        ? 'bg-slate-700 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'}
                    `}
                  >
                    {status === AppStatus.IDLE ? 'Start Magic Process' : 'Processing...'}
                  </button>
               </div>
            ) : (
              <div className="space-y-4 pointer-events-none">
                <div className="w-16 h-16 mx-auto bg-slate-800 text-slate-500 rounded-full flex items-center justify-center border border-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-200">Drop your MP4 here</p>
                  <p className="text-slate-500 text-sm mt-1">Maximum 100MB (Browser Demo Limit)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Section */}
        {(status !== AppStatus.IDLE || logs.length > 0) && (
           <div className="max-w-4xl mx-auto space-y-6">
             {status !== AppStatus.IDLE && status !== AppStatus.COMPLETED && status !== AppStatus.ERROR && (
               <div className="space-y-2">
                 <div className="flex justify-between text-sm font-medium text-slate-400">
                   <span>
                     {status === AppStatus.UPLOADING && 'Initializing Engine...'}
                     {status === AppStatus.ANALYZING && 'AI Analyzing Video...'}
                     {status === AppStatus.CUTTING && `Cutting Clips (${progress?.current || 0}/${progress?.total || 0})...`}
                   </span>
                   <span className="animate-pulse text-indigo-400">Processing</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className={`h-full bg-indigo-500 rounded-full transition-all duration-500 relative overflow-hidden ${
                      status === AppStatus.ANALYZING ? 'w-1/3' :
                      status === AppStatus.CUTTING ? 'w-2/3' : 'w-10'
                   }`}>
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]"></div>
                   </div>
                 </div>
               </div>
             )}
             
             <ProcessingLog logs={logs} />
           </div>
        )}

        {/* Results */}
        {clips.length > 0 && (
          <div className="max-w-6xl mx-auto pt-8 border-t border-slate-800">
             <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
               <span className="text-emerald-400">✨</span> Results Generated
             </h3>
             <ResultsGrid clips={clips} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
