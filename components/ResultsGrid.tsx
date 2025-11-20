import React from 'react';
import { ProcessedClip } from '../types';

interface Props {
  clips: ProcessedClip[];
}

export const ResultsGrid: React.FC<Props> = ({ clips }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {clips.map((clip) => (
        <div key={clip.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors duration-300 group">
          <div className="aspect-video bg-black relative">
            <video 
              src={clip.url} 
              controls 
              className="w-full h-full object-contain" 
            />
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-white/10">
              {clip.start_time} - {clip.end_time}
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-medium text-lg truncate pr-2">{clip.subtitle || "Highlight"}</h3>
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                {Math.round(clip.duration)}s
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2 h-10">{clip.description}</p>
            
            <a 
              href={clip.url} 
              download={`highlight_${clip.start_time.replace(':','-')}.mp4`}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0 3-3m-3 3h7.5" />
              </svg>
              Download Clip
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};
