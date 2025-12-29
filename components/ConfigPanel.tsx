import React from 'react';
import { GridConfig } from '../types';
import { Settings, Grid3X3, LayoutGrid, Maximize, MoveHorizontal } from 'lucide-react';

interface ConfigPanelProps {
  config: GridConfig;
  setConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  disabled: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, disabled }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold text-lg border-b border-slate-100 pb-2">
        <Settings className="w-5 h-5 text-indigo-600" />
        <h2>Splitting Configuration</h2>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Row/Col Inputs */}
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Rows
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.rows}
              onChange={(e) => setConfig((prev) => ({ ...prev, rows: Math.max(1, parseInt(e.target.value) || 1) }))}
              disabled={disabled}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-center text-lg"
            />
          </div>
          <div className="flex items-center pt-6 text-slate-400 font-bold">X</div>
          <div className="w-24">
             <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Cols
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.cols}
              onChange={(e) => setConfig((prev) => ({ ...prev, cols: Math.max(1, parseInt(e.target.value) || 1) }))}
              disabled={disabled}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-center text-lg"
            />
          </div>

          {/* Gap Input */}
           <div className="flex-1 lg:w-32 border-l border-slate-100 pl-4 ml-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              Gap <span className="text-[10px] text-slate-400 normal-case">(px)</span>
            </label>
            <div className="relative">
                <input
                type="number"
                min="0"
                max="200"
                value={config.gap}
                onChange={(e) => setConfig((prev) => ({ ...prev, gap: Math.max(0, parseInt(e.target.value) || 0) }))}
                disabled={disabled}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-center text-lg"
                />
                <MoveHorizontal className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col w-full lg:w-auto flex-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Quick Presets
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setConfig({ rows: 3, cols: 3, gap: config.gap })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${config.rows === 3 && config.cols === 3 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
                3 x 3
              </button>
              <button
                onClick={() => setConfig({ rows: 2, cols: 2, gap: config.gap })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${config.rows === 2 && config.cols === 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                2 x 2
              </button>
               <button
                onClick={() => setConfig({ rows: 4, cols: 4, gap: config.gap })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${config.rows === 4 && config.cols === 4 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                4 x 4
              </button>
               <div className="w-px h-6 bg-slate-200 mx-1 self-center hidden sm:block"></div>
               <button
                onClick={() => setConfig(prev => ({ ...prev, gap: 0 }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${config.gap === 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="No Gap"
              >
                <Maximize className="w-3 h-3" />
                No Gap
              </button>
            </div>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-slate-500">
        Splitting into <strong>{config.rows * config.cols}</strong> images. 
        {config.gap > 0 && <span className="text-orange-600 ml-1">Skipping <strong>{config.gap}px</strong> gaps between images.</span>}
      </p>
    </div>
  );
};

export default ConfigPanel;