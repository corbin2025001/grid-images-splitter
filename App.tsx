import React, { useState, useEffect } from 'react';
import { GridConfig, ProcessedImage } from './types';
import { splitImage } from './services/imageService';
import { downloadAllZip } from './services/zipService';
import ConfigPanel from './components/ConfigPanel';
import Dropzone from './components/Dropzone';
import ResultCard from './components/ResultCard';
import { Layers, Trash2, DownloadCloud, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<GridConfig>({ rows: 3, cols: 3, gap: 0 });
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      processedImages.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        img.pieces.forEach((piece) => URL.revokeObjectURL(piece.url));
      });
    };
  }, [processedImages]);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const results: ProcessedImage[] = [];
      // Process strictly sequentially to avoid browser hanging on massive images
      for (const file of files) {
        const result = await splitImage(file, config);
        results.push(result);
      }
      setProcessedImages((prev) => [...results, ...prev]);
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing images. Please ensure they are valid image files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all processed images?')) {
      setProcessedImages([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Grid<span className="text-indigo-600">Splitter</span> Pro
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
             <span className="hidden sm:inline">Bulk Image Splitter</span>
             <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">v1.0</a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        <ConfigPanel 
            config={config} 
            setConfig={setConfig} 
            disabled={isProcessing} 
        />

        <div className="mb-8">
          <Dropzone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
            </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Processing images...</p>
          </div>
        )}

        {processedImages.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Results <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{processedImages.length}</span>
              </h2>
              <div className="flex gap-3">
                 <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  onClick={() => downloadAllZip(processedImages)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Download All as ZIP
                </button>
              </div>
            </div>

            <div className="grid gap-8">
              {processedImages.map((image) => (
                <ResultCard key={image.id} image={image} />
              ))}
            </div>
          </div>
        )}

        {!isProcessing && processedImages.length === 0 && (
            <div className="text-center py-12 opacity-40">
                <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Layers className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-lg text-slate-500">No images processed yet.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;