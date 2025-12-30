import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Plus } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  compact?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isProcessing, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isProcessing) return;

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file: File) =>
        file.type.startsWith('image/')
      );
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    },
    [onFilesSelected, isProcessing]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter((file: File) =>
        file.type.startsWith('image/')
      );
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
      // CRITICAL BUG FIX: Reset input value so the same file can be picked again if deleted
      e.target.value = '';
    }
  };

  if (compact) {
    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
                ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-white bg-slate-50/50'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
            />
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-slate-700">Add More Images</p>
                    <p className="text-xs text-slate-500">Drag or click to upload</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
        ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
            ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}
        `}>
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">
          {isDragging ? 'Drop images here' : 'Drag & Drop Images'}
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
          Upload your photos to split them. Supports JPG, PNG, WEBP.
        </p>
        <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors">
          Select Files
        </button>
      </div>
    </div>
  );
};

export default Dropzone;