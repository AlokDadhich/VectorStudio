import React from 'react';
import { Brush, Minus, Plus, Palette, Droplet } from 'lucide-react';

interface BrushPanelProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushOpacity: number;
  onBrushOpacityChange: (opacity: number) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  isVisible: boolean;
}

export const BrushPanel: React.FC<BrushPanelProps> = ({
  brushSize,
  onBrushSizeChange,
  brushOpacity,
  onBrushOpacityChange,
  brushColor,
  onBrushColorChange,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-20 left-24 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 z-50 min-w-80">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <Brush className="text-white" size={20} />
        </div>
        <h3 className="text-white font-bold text-lg">Brush Settings</h3>
      </div>
      
      <div className="space-y-6">
        {/* Brush Size */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            Size
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onBrushSizeChange(Math.max(1, brushSize - 2))}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
            >
              <Minus size={16} />
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${brushSize}%, #374151 ${brushSize}%, #374151 100%)`
                }}
              />
            </div>
            <button
              onClick={() => onBrushSizeChange(Math.min(100, brushSize + 2))}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
            >
              <Plus size={16} />
            </button>
            <span className="text-white text-sm font-mono w-12 text-right bg-slate-800/50 px-2 py-1 rounded-lg">
              {brushSize}
            </span>
          </div>
        </div>

        {/* Brush Color */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Palette size={16} className="text-blue-400" />
            Color
          </label>
          <div className="flex gap-4">
            <div className="relative">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => onBrushColorChange(e.target.value)}
                className="w-14 h-12 bg-slate-800 border-2 border-slate-600 rounded-xl cursor-pointer shadow-lg"
              />
              <div className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none"></div>
            </div>
            <input
              type="text"
              value={brushColor}
              onChange={(e) => onBrushColorChange(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Brush Opacity */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Droplet size={16} className="text-cyan-400" />
            Opacity
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={brushOpacity}
                onChange={(e) => onBrushOpacityChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${brushOpacity * 100}%, #374151 ${brushOpacity * 100}%, #374151 100%)`
                }}
              />
            </div>
            <span className="text-white text-sm font-mono w-16 text-right bg-slate-800/50 px-2 py-1 rounded-lg">
              {Math.round(brushOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* Enhanced Brush Preview */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            Preview
          </label>
          <div className="h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-600/50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
            <div
              className="rounded-full border-2 border-slate-500/50 shadow-xl relative z-10"
              style={{
                width: `${Math.min(brushSize, 60)}px`,
                height: `${Math.min(brushSize, 60)}px`,
                backgroundColor: brushColor,
                opacity: brushOpacity,
                boxShadow: `0 0 20px ${brushColor}40`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};