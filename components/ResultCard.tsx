import React from 'react';
import { ProcessedImage } from '../types';
import { Download, Grid, FileImage, Scissors } from 'lucide-react';
import { downloadSingleImageZip } from '../services/zipService';

interface ResultCardProps {
  image: ProcessedImage;
}

const ResultCard: React.FC<ResultCardProps> = ({ image }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar: Original Image & Controls */}
      <div className="md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 truncate mb-1" title={image.originalFile.name}>
            {image.originalFile.name}
          </h3>
          <p className="text-xs text-slate-500">
            Original: {image.width} x {image.height}px
          </p>
           <p className="text-xs text-slate-500 flex items-center gap-1">
            <Grid className="w-3 h-3" /> {image.rows} x {image.cols}
            {image.gap > 0 && <span className="text-slate-400 ml-1">| Gap: {image.gap}px</span>}
          </p>
        </div>

        <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm relative group">
          <img
            src={image.previewUrl}
            alt="Original"
            className="w-full h-full object-cover"
          />
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Original</span>
           </div>
        </div>

        <button
          onClick={() => downloadSingleImageZip(image)}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download ZIP
        </button>
      </div>

      {/* Main Content: Grid Preview */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Scissors className="w-4 h-4 text-indigo-500" />
            Split Preview ({image.pieces.length} pieces)
          </h4>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
             Scroll to see all
          </span>
        </div>
        
        <div 
            className="grid gap-2 overflow-y-auto max-h-[400px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200"
            style={{
                gridTemplateColumns: `repeat(${image.cols}, minmax(0, 1fr))`,
            }}
        >
          {image.pieces.map((piece) => (
            <div key={piece.id} className="relative aspect-square group">
                <img
                  src={piece.url}
                  alt={`Part ${piece.row + 1}-${piece.col + 1}`}
                  className="w-full h-full object-cover rounded-md shadow-sm border border-slate-200 bg-white"
                />
                <a 
                    href={piece.url} 
                    download={piece.fileName}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-md"
                    title="Click to download single piece"
                >
                     <Download className="w-6 h-6 text-white drop-shadow-md" />
                </a>
                <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {piece.row + 1},{piece.col + 1}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;