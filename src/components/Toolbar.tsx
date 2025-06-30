import React from 'react';
import { 
  MousePointer, 
  Pen, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Brush, 
  Pipette, 
  ZoomIn, 
  Hand,
  Pentagon,
  Star,
  Triangle,
  Move3D,
  Eraser,
  Spline
} from 'lucide-react';
import { Tool } from '../types';

interface ToolbarProps {
  activeTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

const toolGroups = [
  {
    name: 'Selection',
    tools: [
      { id: 'select', icon: MousePointer, label: 'Selection Tool (V)', shortcut: 'V', color: 'blue' },
      { id: 'hand', icon: Hand, label: 'Hand Tool (H)', shortcut: 'H', color: 'green' },
      { id: 'zoom', icon: ZoomIn, label: 'Zoom Tool (Z)', shortcut: 'Z', color: 'indigo' },
    ]
  },
  {
    name: 'Drawing',
    tools: [
      { id: 'pen', icon: Pen, label: 'Pen Tool (P)', shortcut: 'P', color: 'purple' },
      { id: 'curve', icon: Spline, label: 'Curve Tool (C)', shortcut: 'C', color: 'violet' },
      { id: 'brush', icon: Brush, label: 'Brush Tool (B)', shortcut: 'B', color: 'orange' },
      { id: 'line', icon: Minus, label: 'Line Tool (L)', shortcut: 'L', color: 'yellow' },
    ]
  },
  {
    name: 'Shapes',
    tools: [
      { id: 'rect', icon: Square, label: 'Rectangle Tool (R)', shortcut: 'R', color: 'emerald' },
      { id: 'circle', icon: Circle, label: 'Ellipse Tool (E)', shortcut: 'E', color: 'cyan' },
      { id: 'triangle', icon: Triangle, label: 'Triangle Tool', shortcut: '', color: 'teal' },
      { id: 'star', icon: Star, label: 'Star Tool', shortcut: '', color: 'amber' },
      { id: 'polygon', icon: Pentagon, label: 'Polygon Tool', shortcut: '', color: 'lime' },
    ]
  },
  {
    name: 'Tools',
    tools: [
      { id: 'text', icon: Type, label: 'Text Tool (T)', shortcut: 'T', color: 'violet' },
      { id: 'eyedropper', icon: Pipette, label: 'Eyedropper Tool (I)', shortcut: 'I', color: 'pink' },
      { id: 'eraser', icon: Eraser, label: 'Eraser Tool', shortcut: '', color: 'red' },
    ]
  }
] as const;

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect }) => {
  return (
    <div className="w-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 flex flex-col shadow-2xl backdrop-blur-sm">
      {/* Enhanced Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
          <Move3D className="text-white drop-shadow-lg" size={24} />
        </div>
      </div>

      {/* Enhanced Tool Groups */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {toolGroups.map((group, groupIndex) => (
          <div key={group.name} className="mb-6">
            <div className="px-4 mb-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {group.name}
              </div>
            </div>
            <div className="px-2 space-y-2">
              {group.tools.map(({ id, icon: Icon, label, shortcut, color }) => (
                <div key={id} className="relative group">
                  <button
                    onClick={() => onToolSelect(id as Tool)}
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-sm border
                      ${activeTool === id 
                        ? `bg-gradient-to-br from-${color}-500 to-${color}-600 text-white shadow-xl shadow-${color}-500/30 scale-105 border-${color}-400/50` 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50 hover:scale-105 border-slate-700/30 hover:border-slate-600/50'
                      }
                    `}
                    title={label}
                  >
                    <Icon size={22} className="relative z-10 drop-shadow-sm" />
                    {activeTool === id && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </>
                    )}
                    {shortcut && (
                      <div className="absolute bottom-1 right-1 text-xs opacity-70 font-mono bg-black/30 px-1 rounded">
                        {shortcut}
                      </div>
                    )}
                  </button>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-slate-700/50">
                    <div className="font-semibold">{label}</div>
                    {shortcut && (
                      <div className="text-xs text-slate-400 mt-1">Press {shortcut}</div>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900/95" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};