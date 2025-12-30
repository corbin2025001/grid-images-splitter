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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-base">
        <Settings className="w-5 h-5 text-indigo-600" />
        Grid Settings
      </div>
      
      <div className="flex flex-wrap gap-x-8 gap-y-6">
        {/* Row/Col Inputs */}
        <div className="flex items-end gap-3">
          <div className="w-16">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rows</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.rows}
              onChange={(e) => setConfig((prev) => ({ ...prev, rows: Math.max(1, parseInt(e.target.value) || 1) }))}
              disabled={disabled}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-center"
            />
          </div>
          <div className="pb-3 text-slate-300 font-bold">×</div>
          <div className="w-16">
             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cols</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.cols}
              onChange={(e) => setConfig((prev) => ({ ...prev, cols: Math.max(1, parseInt(e.target.value) || 1) }))}
              disabled={disabled}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-center"
            />
          </div>
          <div className="w-20 ml-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gap (px)</label>
            <input
              type="number"
              min="0"
              max="200"
              value={config.gap}
              onChange={(e) => setConfig((prev) => ({ ...prev, gap: Math.max(0, parseInt(e.target.value) || 0) }))}
              disabled={disabled}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-center"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex gap-2">
            <button
            onClick={() => setConfig({ rows: 3, cols: 3, gap: config.gap })}
            className={`p-2 rounded-lg border transition-all ${config.rows === 3 && config.cols === 3 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'}`}
            title="3x3"
            >
                <Grid3X3 className="w-5 h-5" />
            </button>
            <button
            onClick={() => setConfig({ rows: 2, cols: 2, gap: config.gap })}
            className={`p-2 rounded-lg border transition-all ${config.rows === 2 && config.cols === 2 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'}`}
            title="2x2"
            >
                <LayoutGrid className="w-5 h-5" />
            </button>
            <button
            onClick={() => setConfig({ ...config, gap: 0 })}
            className={`p-2 rounded-lg border transition-all ${config.gap === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'}`}
            title="Remove Gap"
            >
                <Maximize className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;