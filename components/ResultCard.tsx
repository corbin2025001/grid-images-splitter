import React, { useState, useRef, useEffect } from 'react';
import { ProcessedImage, Transition, SplitPiece, GridConfig } from '../types';
import { Download, Grid, Scissors, Sparkles, Copy, Check, FileText, Loader2, Wand2, RotateCcw, Send, Image as ImageIcon, X, Eraser, Brush, Undo2, ChevronRight, LayoutGrid, Settings2, Trash2 } from 'lucide-react';
import { downloadSingleImageZip } from '../services/zipService';
import { generateVideoPrompts, fileToBase64 } from '../services/promptService';
import { generateEditOptions, EditOption, EditMode } from '../services/editService';

interface ResultCardProps {
  image: ProcessedImage;
  onUpdateImage: (updatedImage: ProcessedImage) => void;
  onRemove: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ image, onUpdateImage, onRemove }) => {
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [activeEditPiece, setActiveEditPiece] = useState<SplitPiece | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [referencePieceId, setReferencePieceId] = useState<string | null>(null);
  const [variationCount, setVariationCount] = useState<number>(4);
  const [workshopMode, setWorkshopMode] = useState<EditMode>('erase');
  
  // AI Refinement States
  const [editResults, setEditResults] = useState<EditOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);

  // Canvas State for Masking
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize Workshop State
  useEffect(() => {
    if (activeEditPiece && canvasRef.current) {
      resetWorkshopSession();
    }
  }, [activeEditPiece?.id]); // Reset when opening or switching pieces

  const resetWorkshopSession = () => {
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, 800, 800);
    setHasMask(false);
    lastPos.current = null;
    // Clear old result URLs to prevent leaks
    editResults.forEach(res => URL.revokeObjectURL(res.url));
    setEditResults([]);
    setSelectedIndex(-1);
  };

  const handleGeneratePrompts = async () => {
    if (isGeneratingPrompts) return;
    setIsGeneratingPrompts(true);
    try {
      const base64 = await fileToBase64(image.originalFile);
      const prompts = await generateVideoPrompts(base64, image.originalFile.type, image.rows, image.cols);
      onUpdateImage({ ...image, transitions: prompts });
    } catch (err) {
      alert("AI prompts generation failed.");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX; clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    lastPos.current = coords;
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; 
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 35;
    ctx.beginPath();
    if (lastPos.current) ctx.moveTo(lastPos.current.x, lastPos.current.y);
    else ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y); ctx.stroke();
    lastPos.current = coords;
    setHasMask(true);
  };

  const stopDrawing = () => { setIsDrawing(false); lastPos.current = null; };

  const handleApplyEdit = async () => {
    if (!activeEditPiece) return;
    if (workshopMode === 'creative' && !editPrompt.trim() && !hasMask) {
        alert("Please enter an instruction or paint a mask.");
        return;
    }
    if (workshopMode === 'erase' && !hasMask) {
        alert("Please paint over the area you want to erase.");
        return;
    }

    setIsProcessingEdit(true);
    editResults.forEach(res => URL.revokeObjectURL(res.url));
    setEditResults([]);
    setSelectedIndex(-1);

    const refPiece = image.pieces.find(p => p.id === referencePieceId);
    let maskBlob: Blob | undefined;
    if (hasMask && canvasRef.current) {
      maskBlob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/png');
      });
    }

    try {
      const options = await generateEditOptions(
        activeEditPiece.blob, 
        editPrompt, 
        activeEditPiece.blob.type, 
        variationCount, 
        workshopMode,
        refPiece?.blob, 
        maskBlob
      );
      setEditResults(options);
      setSelectedIndex(0);
    } catch (err) {
      console.error(err);
      alert("AI processing failed.");
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const confirmAndContinue = () => {
    if (selectedIndex === -1 || !activeEditPiece) return;
    const bestResult = editResults[selectedIndex];
    
    // 1. Update the image in the main list
    const updatedPiece = { ...activeEditPiece, blob: bestResult.blob, url: bestResult.url, isModified: true };
    const updatedPieces = image.pieces.map(p => p.id === activeEditPiece.id ? updatedPiece : p);
    onUpdateImage({ ...image, pieces: updatedPieces });
    
    // 2. IMPORTANT: Update current edit piece so user can edit the result again immediately
    setActiveEditPiece(updatedPiece);
    
    // 3. Clear the workspace but keep mask if they want to reuse it? No, usually cleaner to reset.
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, 800, 800);
    setHasMask(false);
    setEditResults([]);
    setSelectedIndex(-1);
  };

  const handleRestorePiece = (piece: SplitPiece) => {
    const updatedPieces = image.pieces.map(p => 
      p.id === piece.id ? { ...p, blob: p.originalBlob, url: p.originalUrl, isModified: false } : p
    );
    onUpdateImage({ ...image, pieces: updatedPieces });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-h-[700px] relative">
      
      {/* 1. Main Grid Canvas */}
      <div className="lg:col-span-9 p-10 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"><Scissors className="w-5 h-5 text-white" /></div>
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">Piece Explorer</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tap a segment to refine with AI</p>
            </div>
          </div>
          <button 
            onClick={onRemove}
            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Remove Project"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200/60 overflow-hidden">
            <div className="grid gap-5 w-full h-fit max-w-4xl" style={{ gridTemplateColumns: `repeat(${image.cols}, minmax(0, 1fr))`, aspectRatio: `${image.cols} / ${image.rows}` }}>
                {image.pieces.map((piece) => (
                    <div key={piece.id} className="relative group perspective-1000">
                        <div className={`relative w-full h-full rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all duration-500 border-4 ${activeEditPiece?.id === piece.id ? 'border-indigo-600 scale-105 z-10' : 'border-white hover:border-indigo-300 group-hover:translate-y-[-5px]'}`} onClick={() => setActiveEditPiece(piece)}>
                            <img src={piece.url} className="w-full h-full object-cover bg-white" />
                            {piece.isModified && (
                                <button onClick={(e) => { e.stopPropagation(); handleRestorePiece(piece); }} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg z-10 hover:bg-red-700 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                            )}
                            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none" />
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                                <div className="bg-white text-indigo-600 p-2 rounded-xl shadow-2xl border border-indigo-100"><Wand2 className="w-5 h-5" /></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 2. Sidebar View */}
      <div className="lg:col-span-3 bg-slate-50 flex flex-col h-full border-t lg:border-t-0 border-slate-200">
        <div className="p-8 border-b border-slate-200 bg-white">
            <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 relative mb-6 shadow-inner">
                <img src={image.previewUrl} className="w-full h-full object-contain" />
            </div>
            <button onClick={() => downloadSingleImageZip(image)} className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white text-sm font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"><Download className="w-5 h-5" /> Pack & Download</button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-5">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> AI Suggestions</h4>
                {!image.transitions && <button onClick={handleGeneratePrompts} disabled={isGeneratingPrompts} className="text-[10px] bg-purple-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-md">Analyze</button>}
            </div>
            {isGeneratingPrompts ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Reading pixels...</p>
                </div>
            ) : image.transitions?.map((t, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group hover:border-indigo-400 transition-all">
                    <div className="text-[9px] font-black text-slate-300 uppercase mb-2 tracking-widest">SEQ {idx+1}</div>
                    <p className="text-xs text-slate-700 font-bold mb-1 leading-relaxed">{t.prompt_zh}</p>
                    <p className="text-[10px] text-slate-400 italic font-medium">{t.prompt_en}</p>
                </div>
            ))}
        </div>
      </div>

      {/* 3. AI Creative Workshop (Modal) ... (rest of the component remains the same) */}
      {activeEditPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-12 bg-slate-950/95 backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-[1300px] overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-200"><Wand2 className="w-7 h-7" /></div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Workshop Mode</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">Segment {activeEditPiece.row+1},{activeEditPiece.col+1} <ChevronRight className="w-3 h-3"/> {workshopMode === 'erase' ? 'Object Removal' : 'Creative Transformation'}</p>
                        </div>
                    </div>
                    <button onClick={() => setActiveEditPiece(null)} className="p-3 hover:bg-slate-100 rounded-full transition-all group"><X className="w-8 h-8 text-slate-300 group-hover:text-slate-900" /></button>
                </div>

                <div className="flex-1 overflow-hidden grid lg:grid-cols-2">
                    {/* Panel A: Tools */}
                    <div className="p-10 overflow-y-auto space-y-10 border-r border-slate-100 bg-slate-50/30">
                        {/* Mode Switcher */}
                        <div className="grid grid-cols-2 p-1.5 bg-slate-200/50 rounded-2xl">
                            <button onClick={() => setWorkshopMode('erase')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${workshopMode === 'erase' ? 'bg-white shadow-lg text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}><Eraser className="w-4 h-4" /> Smart Erase</button>
                            <button onClick={() => setWorkshopMode('creative')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${workshopMode === 'creative' ? 'bg-white shadow-lg text-purple-600' : 'text-slate-500 hover:text-slate-800'}`}><Sparkles className="w-4 h-4" /> AI Edit</button>
                        </div>

                        {/* Interactive Canvas */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">{workshopMode === 'erase' ? 'Paint over watermarks or objects' : 'Apply mask for targeted editing'}</label>
                            <div className="relative aspect-square bg-slate-100 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200">
                                <img src={activeEditPiece.url} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                                <canvas ref={canvasRef} width={800} height={800} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="absolute inset-0 w-full h-full cursor-crosshair touch-none mix-blend-multiply" />
                                {hasMask && <button onClick={() => { const ctx = canvasRef.current?.getContext('2d'); ctx?.clearRect(0, 0, 800, 800); setHasMask(false); }} className="absolute bottom-6 right-6 bg-red-600 text-white text-[10px] px-4 py-2 rounded-full font-black shadow-xl hover:bg-red-700 transition-all flex items-center gap-2"><Undo2 className="w-3 h-3" /> Clear Paint</button>}
                            </div>
                        </div>

                        {/* Prompt Input (Only for Creative Mode) */}
                        {workshopMode === 'creative' && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Send className="w-4 h-4 text-indigo-500" /> Creative Brief</label>
                                <textarea placeholder="Describe the change you want... (e.g., 'Change car to red', 'Add blue sky', 'Cinematic lighting')" className="w-full h-28 p-6 bg-white border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-bold shadow-inner" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
                                
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-yellow-500" /> Reference Continuity</label>
                                    <div className="grid grid-cols-6 gap-3 p-3 bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-x-auto">
                                        {image.pieces.map((p) => (
                                            <div key={p.id} onClick={() => setReferencePieceId(referencePieceId === p.id ? null : p.id)} className={`relative aspect-square rounded-xl border-4 overflow-hidden cursor-pointer transition-all ${referencePieceId === p.id ? 'border-indigo-600 scale-105 shadow-xl' : 'border-white opacity-50 hover:opacity-100 shadow-sm'}`}>
                                                <img src={p.url} className="w-full h-full object-cover" />
                                                {referencePieceId === p.id && <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center"><Check className="w-5 h-5 text-white stroke-[3px]" /></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Batch Control */}
                        <div className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 className="w-4 h-4" /> Batch Options</label>
                                <p className="text-[10px] text-slate-300 font-bold">Generate multiple options</p>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 4].map(num => (
                                    <button key={num} onClick={() => setVariationCount(num)} className={`w-10 h-10 rounded-xl font-black text-sm border-2 transition-all ${variationCount === num ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>{num}</button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleApplyEdit} disabled={isProcessingEdit} className={`w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-4 ${workshopMode === 'erase' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 text-white' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-100 text-white'}`}>
                            {isProcessingEdit ? <><Loader2 className="w-7 h-7 animate-spin" /> Processing AI...</> : <><Sparkles className="w-7 h-7" /> Run Workshop Transformation</>}
                        </button>
                    </div>

                    {/* Panel B: Results Gallery */}
                    <div className="p-10 bg-slate-100/30 flex flex-col min-h-0">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-500" /> Development Timeline</label>
                        
                        {isProcessingEdit ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-white/60 border-4 border-dashed border-slate-200 rounded-[48px] p-12">
                                <div className="grid grid-cols-2 gap-6 scale-125">
                                    {Array.from({length: Math.min(4, variationCount)}).map((_, i) => <div key={i} className="w-20 h-20 bg-indigo-100 animate-pulse rounded-2xl" />)}
                                </div>
                                <div>
                                    <p className="text-slate-800 font-black text-lg">AI is dreaming...</p>
                                    <p className="text-slate-400 text-sm font-medium">Synthesizing pixels and textures</p>
                                </div>
                            </div>
                        ) : editResults.length > 0 ? (
                            <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                {/* Large Result Display */}
                                <div className="relative flex-1 bg-white rounded-[40px] border-4 border-white overflow-hidden shadow-2xl group ring-1 ring-slate-200">
                                    <img src={editResults[selectedIndex].url} className="w-full h-full object-contain" />
                                    <div className="absolute top-6 left-6 bg-indigo-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase shadow-lg tracking-widest">Variation {selectedIndex + 1}</div>
                                </div>

                                {/* Variations Swatcher */}
                                <div className="flex gap-4 p-2 overflow-x-auto scrollbar-hide">
                                    {editResults.map((result, idx) => (
                                        <div key={idx} onClick={() => setSelectedIndex(idx)} className={`relative min-w-[100px] h-[100px] rounded-[24px] border-4 overflow-hidden cursor-pointer transition-all flex-shrink-0 ${selectedIndex === idx ? 'border-indigo-600 scale-110 shadow-2xl z-10' : 'border-white opacity-60 hover:opacity-100 shadow-sm'}`}>
                                            <img src={result.url} className="w-full h-full object-cover" />
                                            {selectedIndex === idx && <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full"><Check className="w-3 h-3 stroke-[4px]" /></div>}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-5">
                                    <button onClick={handleApplyEdit} className="flex-1 py-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3"><RotateCcw className="w-5 h-5" /> Regenerate</button>
                                    <button onClick={confirmAndContinue} className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-slate-300 flex items-center justify-center gap-3"><Check className="w-6 h-6" /> Commit & Keep Editing</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-16 opacity-30 border-4 border-dashed border-slate-200 rounded-[48px] space-y-6">
                                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-400" /></div>
                                <div>
                                    <p className="text-xl font-black text-slate-500 italic">No Results Developed</p>
                                    <p className="text-sm font-bold text-slate-400">Configure parameters on the left to start</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;