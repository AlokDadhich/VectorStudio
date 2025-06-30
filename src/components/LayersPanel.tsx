import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, Layers, ChevronDown, ChevronRight, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { Layer } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onSetActiveLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onUpdateLayer,
  onSetActiveLayer,
  onMoveLayer
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(layers.map(l => l.id)));

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const getLayerIndex = (layerId: string) => {
    return layers.findIndex(layer => layer.id === layerId);
  };

  const canMoveUp = (layerId: string) => {
    return getLayerIndex(layerId) > 0;
  };

  const canMoveDown = (layerId: string) => {
    return getLayerIndex(layerId) < layers.length - 1;
  };

  return (
    <div className="h-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="text-white" size={16} />
          </div>
          <h3 className="text-white font-bold text-lg">Layers</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddLayer}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group border border-slate-700/50 hover:border-slate-600/50"
            title="Add Layer"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </div>
      
      <div className="p-3 space-y-2 overflow-y-auto max-h-60 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {layers.map((layer, index) => {
          const isExpanded = expandedLayers.has(layer.id);
          const isActive = layer.id === activeLayerId;
          const layerIndex = getLayerIndex(layer.id);
          
          return (
            <div key={layer.id} className="space-y-1">
              {/* Layer Header */}
              <div
                className={`
                  flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 group border
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/40 shadow-lg backdrop-blur-sm' 
                    : 'hover:bg-slate-700/30 border-slate-700/30 hover:border-slate-600/50'
                  }
                `}
                onClick={() => onSetActiveLayer(layer.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerExpansion(layer.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-300 transition-colors duration-200"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${layer.visible 
                      ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10' 
                      : 'text-slate-500 hover:text-slate-400 bg-slate-700/30'
                    }
                  `}
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${layer.locked 
                      ? 'text-red-400 hover:text-red-300 bg-red-500/10' 
                      : 'text-slate-400 hover:text-slate-300 bg-slate-700/30'
                    }
                  `}
                  title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                >
                  {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                
                <input
                  type="text"
                  value={layer.name}
                  onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                  className="flex-1 bg-transparent text-white text-sm outline-none focus:bg-slate-800/50 px-2 py-1 rounded transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex items-center gap-2">
                  {/* Layer Order Controls - Always visible */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Moving layer up:', layer.id);
                        onMoveLayer(layer.id, 'up');
                      }}
                      disabled={!canMoveUp(layer.id)}
                      className={`p-1 rounded transition-all duration-200 ${
                        canMoveUp(layer.id) 
                          ? 'text-slate-400 hover:text-white hover:bg-slate-600/50' 
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                      title="Move Layer Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Moving layer down:', layer.id);
                        onMoveLayer(layer.id, 'down');
                      }}
                      disabled={!canMoveDown(layer.id)}
                      className={`p-1 rounded transition-all duration-200 ${
                        canMoveDown(layer.id) 
                          ? 'text-slate-400 hover:text-white hover:bg-slate-600/50' 
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                      title="Move Layer Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    ${layer.objects.length > 0 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-slate-700 text-slate-400'
                    }
                  `}>
                    {layer.objects.length}
                  </span>
                  
                  <div className="text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded">
                    {layerIndex + 1}
                  </div>
                  
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Delete Layer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Layer Objects */}
              {isExpanded && layer.objects.length > 0 && (
                <div className="ml-6 space-y-1">
                  {layer.objects.map((obj, objIndex) => (
                    <div
                      key={obj.id}
                      className="flex items-center gap-2 p-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/30 transition-all duration-200 cursor-pointer border border-slate-700/20 hover:border-slate-600/30"
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        obj.type === 'rect' ? 'bg-emerald-400' :
                        obj.type === 'circle' ? 'bg-cyan-400' :
                        obj.type === 'text' ? 'bg-violet-400' :
                        obj.type === 'line' ? 'bg-yellow-400' :
                        obj.type === 'path' ? 'bg-purple-400' :
                        obj.type === 'curve' ? 'bg-pink-400' :
                        obj.type === 'image' ? 'bg-orange-400' :
                        'bg-slate-400'
                      }`} />
                      <span className="flex-1 capitalize">
                        {obj.type} {objIndex + 1}
                      </span>
                      <button
                        className={`p-1 rounded ${
                          obj.visible ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      >
                        {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {layers.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
              <Layers className="text-slate-600" size={24} />
            </div>
            <p className="text-slate-400 text-sm mb-3">No layers yet</p>
            <button
              onClick={onAddLayer}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 hover:border-blue-500/40"
            >
              Create your first layer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};