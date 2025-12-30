import React, { useState, useEffect, useRef } from 'react';
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

  // Use a ref to track images for cleanup on unmount
  const imagesRef = useRef<ProcessedImage[]>([]);
  useEffect(() => {
    imagesRef.current = processedImages;
  }, [processedImages]);

  useEffect(() => {
    // Only cleanup when the entire App unmounts
    return () => {
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        img.pieces.forEach((piece) => {
          URL.revokeObjectURL(piece.url);
          URL.revokeObjectURL(piece.originalUrl);
        });
      });
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const results: ProcessedImage[] = [];
      for (const file of files) {
        const result = await splitImage(file, config);
        results.push(result);
      }
      setProcessedImages((prev) => [...results, ...prev]);
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateProcessedImage = (updatedImage: ProcessedImage) => {
    setProcessedImages(prev => 
      prev.map(img => img.id === updatedImage.id ? updatedImage : img)
    );
  };

  const removeProcessedImage = (id: string) => {
    const imageToRemove = processedImages.find(img => img.id === id);
    if (imageToRemove) {
      // Cleanup URLs to prevent memory leaks
      URL.revokeObjectURL(imageToRemove.previewUrl);
      imageToRemove.pieces.forEach((piece) => {
        URL.revokeObjectURL(piece.url);
        URL.revokeObjectURL(piece.originalUrl);
      });
      // Filter out from state
      setProcessedImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all projects?')) {
      // Manually revoke URLs before clearing state
      processedImages.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        img.pieces.forEach((piece) => {
          URL.revokeObjectURL(piece.url);
          URL.revokeObjectURL(piece.originalUrl);
        });
      });
      setProcessedImages([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md shadow-indigo-100">
                <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
              Grid<span className="text-indigo-600">Splitter</span> Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {processedImages.length > 0 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearAll}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Clear All"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <button
                        onClick={() => downloadAllZip(processedImages)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-100"
                    >
                        <DownloadCloud className="w-4 h-4" />
                        Download All
                    </button>
                </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          
          <div className={`grid gap-6 ${processedImages.length > 0 ? 'lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto w-full'}`}>
            <div className={processedImages.length > 0 ? 'lg:col-span-1' : ''}>
                <ConfigPanel 
                    config={config} 
                    setConfig={setConfig} 
                    disabled={isProcessing} 
                />
            </div>
            
            <div className={processedImages.length > 0 ? 'lg:col-span-2' : ''}>
                <Dropzone 
                    onFilesSelected={handleFilesSelected} 
                    isProcessing={isProcessing} 
                    compact={processedImages.length > 0} 
                />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Splitting and preparing editor...</p>
            </div>
          )}

          {processedImages.length > 0 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              {processedImages.map((image) => (
                <ResultCard 
                    key={image.id} 
                    image={image} 
                    onUpdateImage={updateProcessedImage}
                    onRemove={() => removeProcessedImage(image.id)}
                />
              ))}
            </div>
          )}

          {!isProcessing && processedImages.length === 0 && (
            <div className="text-center py-32 opacity-30">
                <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Layers className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-600">No Projects Found</h3>
                <p className="mt-2 text-slate-500">Configure your grid and upload images to start editing.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;