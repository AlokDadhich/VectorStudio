import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Move, 
  RotateCw, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Droplet,
  Square,
  Circle as CircleIcon,
  Type,
  Sliders
} from 'lucide-react';
import { CanvasObject } from '../types';

interface PropertiesPanelProps {
  selectedObjects: CanvasObject[];
  onUpdateObject: (objectId: string, updates: Partial<CanvasObject>) => void;
}

interface GradientStop {
  offset: number;
  color: string;
  opacity: number;
}

interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedObjects, 
  onUpdateObject 
}) => {
  const selectedObject = selectedObjects[0];
  const multipleSelected = selectedObjects.length > 1;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['position', 'appearance', 'fill']));
  const [gradientMode, setGradientMode] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (selectedObjects.length === 0) {
    return (
      <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
              <Settings className="text-slate-400" size={20} />
            </div>
            <h3 className="text-white font-bold text-lg">Properties</h3>
          </div>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
              <Settings className="text-slate-600" size={32} />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Select an object to edit its properties and customize its appearance
            </p>
          </div>
        </div>
      </div>
    );
  }

  const updateStyle = (property: string, value: any) => {
    selectedObjects.forEach(obj => {
      onUpdateObject(obj.id, {
        style: { ...obj.style, [property]: value }
      });
    });
  };

  const updateTransform = (property: string, value: any) => {
    selectedObjects.forEach(obj => {
      onUpdateObject(obj.id, {
        transform: { ...obj.transform, [property]: value }
      });
    });
  };

  const updateProperty = (property: string, value: any) => {
    selectedObjects.forEach(obj => {
      onUpdateObject(obj.id, { [property]: value });
    });
  };

  const createGradient = (type: 'linear' | 'radial') => {
    const gradient: Gradient = {
      type,
      stops: [
        { offset: 0, color: '#3B82F6', opacity: 1 },
        { offset: 1, color: '#1E40AF', opacity: 1 }
      ],
      angle: type === 'linear' ? 0 : undefined
    };
    
    updateStyle('gradient', gradient);
    setGradientMode(true);
  };

  const updateGradientStop = (stopIndex: number, property: string, value: any) => {
    if (!selectedObject.style.gradient) return;
    
    const newGradient = { ...selectedObject.style.gradient };
    newGradient.stops = [...newGradient.stops];
    newGradient.stops[stopIndex] = { ...newGradient.stops[stopIndex], [property]: value };
    
    updateStyle('gradient', newGradient);
  };

  const addGradientStop = () => {
    if (!selectedObject.style.gradient) return;
    
    const newGradient = { ...selectedObject.style.gradient };
    const newStop: GradientStop = {
      offset: 0.5,
      color: '#6B7280',
      opacity: 1
    };
    
    newGradient.stops = [...newGradient.stops, newStop].sort((a, b) => a.offset - b.offset);
    updateStyle('gradient', newGradient);
  };

  const removeGradientStop = (stopIndex: number) => {
    if (!selectedObject.style.gradient || selectedObject.style.gradient.stops.length <= 2) return;
    
    const newGradient = { ...selectedObject.style.gradient };
    newGradient.stops = newGradient.stops.filter((_, index) => index !== stopIndex);
    
    updateStyle('gradient', newGradient);
  };

  const clearGradient = () => {
    updateStyle('gradient', null);
    setGradientMode(false);
  };

  const SectionHeader = ({ title, icon: Icon, sectionKey, color = 'blue' }: { title: string; icon: any; sectionKey: string; color?: string }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center shadow-lg`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="font-semibold">{title}</span>
      </div>
      <div className={`transition-transform duration-200 ${expandedSections.has(sectionKey) ? 'rotate-90' : ''}`}>
        <ChevronRight size={16} />
      </div>
    </button>
  );

  return (
    <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="text-white" size={20} />
          </div>
          <h3 className="text-white font-bold text-lg">Properties</h3>
        </div>
        
        {/* Enhanced Object Info */}
        <div className="mb-6 p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-lg"></div>
            <span className="text-white font-semibold capitalize text-lg">
              {multipleSelected ? `${selectedObjects.length} Objects` : selectedObject.type}
            </span>
          </div>
          {!multipleSelected && (
            <div className="text-xs text-slate-400 mb-4 font-mono bg-slate-800/50 px-2 py-1 rounded">
              ID: {selectedObject.id}
            </div>
          )}
          
          {/* Enhanced Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => updateProperty('visible', !selectedObject.visible)}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                selectedObject.visible 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
              }`}
              title={selectedObject.visible ? 'Hide' : 'Show'}
            >
              {selectedObject.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              onClick={() => updateProperty('locked', !selectedObject.locked)}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                selectedObject.locked 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
              }`}
              title={selectedObject.locked ? 'Unlock' : 'Lock'}
            >
              {selectedObject.locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <button
              className="p-3 bg-slate-700/50 text-slate-400 rounded-xl hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              className="p-3 bg-slate-700/50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center justify-center"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Position & Transform */}
        <div className="mb-4">
          <SectionHeader title="Position" icon={Move} sectionKey="position" color="emerald" />
          {expandedSections.has('position') && (
            <div className="px-4 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-semibold">X Position</label>
                  <input
                    type="number"
                    value={multipleSelected ? '' : Math.round(selectedObject.transform.x)}
                    onChange={(e) => updateTransform('x', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder={multipleSelected ? 'Mixed' : ''}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-semibold">Y Position</label>
                  <input
                    type="number"
                    value={multipleSelected ? '' : Math.round(selectedObject.transform.y)}
                    onChange={(e) => updateTransform('y', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder={multipleSelected ? 'Mixed' : ''}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-3 font-semibold flex items-center gap-2">
                  <RotateCw size={14} />
                  Rotation
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={multipleSelected ? 0 : Math.round(selectedObject.transform.rotation * 180 / Math.PI)}
                      onChange={(e) => updateTransform('rotation', (parseFloat(e.target.value) || 0) * Math.PI / 180)}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${(multipleSelected ? 0 : Math.round(selectedObject.transform.rotation * 180 / Math.PI)) / 360 * 100}%, #374151 ${(multipleSelected ? 0 : Math.round(selectedObject.transform.rotation * 180 / Math.PI)) / 360 * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <span className="text-white text-sm font-mono w-16 text-right bg-slate-800/50 px-2 py-1 rounded-lg">
                    {multipleSelected ? '—' : Math.round(selectedObject.transform.rotation * 180 / Math.PI)}°
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-semibold">Scale X</label>
                  <input
                    type="number"
                    step="0.1"
                    value={multipleSelected ? '' : selectedObject.transform.scaleX}
                    onChange={(e) => updateTransform('scaleX', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder={multipleSelected ? 'Mixed' : ''}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-semibold">Scale Y</label>
                  <input
                    type="number"
                    step="0.1"
                    value={multipleSelected ? '' : selectedObject.transform.scaleY}
                    onChange={(e) => updateTransform('scaleY', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder={multipleSelected ? 'Mixed' : ''}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layout - Object-specific dimensions */}
        {!multipleSelected && (
          <div className="mb-4">
            <SectionHeader title="Layout" icon={Square} sectionKey="layout" color="cyan" />
            {expandedSections.has('layout') && (
              <div className="px-4 pb-6 space-y-4">
                {selectedObject.type === 'rect' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold">Width</label>
                      <input
                        type="number"
                        value={selectedObject.width}
                        onChange={(e) => onUpdateObject(selectedObject.id, { width: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold">Height</label>
                      <input
                        type="number"
                        value={selectedObject.height}
                        onChange={(e) => onUpdateObject(selectedObject.id, { height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                {selectedObject.type === 'circle' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Radius</label>
                    <input
                      type="number"
                      value={selectedObject.radius}
                      onChange={(e) => onUpdateObject(selectedObject.id, { radius: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                )}

                {selectedObject.type === 'image' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold">Width</label>
                      <input
                        type="number"
                        value={selectedObject.width}
                        onChange={(e) => onUpdateObject(selectedObject.id, { width: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold">Height</label>
                      <input
                        type="number"
                        value={selectedObject.height}
                        onChange={(e) => onUpdateObject(selectedObject.id, { height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Appearance */}
        <div className="mb-4">
          <SectionHeader title="Appearance" icon={Sliders} sectionKey="appearance" color="purple" />
          {expandedSections.has('appearance') && (
            <div className="px-4 pb-6">
              <div>
                <label className="block text-xs text-slate-400 mb-3 font-semibold flex items-center gap-2">
                  <Droplet size={14} />
                  Opacity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={multipleSelected ? 1 : selectedObject.style.opacity}
                      onChange={(e) => updateStyle('opacity', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(multipleSelected ? 1 : selectedObject.style.opacity) * 100}%, #374151 ${(multipleSelected ? 1 : selectedObject.style.opacity) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <span className="text-white text-sm font-mono w-16 text-right bg-slate-800/50 px-2 py-1 rounded-lg">
                    {multipleSelected ? '—' : Math.round(selectedObject.style.opacity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Fill */}
        <div className="mb-4">
          <SectionHeader title="Fill" icon={Palette} sectionKey="fill" color="orange" />
          {expandedSections.has('fill') && (
            <div className="px-4 pb-6 space-y-5">
              {/* Fill Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    clearGradient();
                    setGradientMode(false);
                  }}
                  className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    !selectedObject.style.gradient 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => createGradient('linear')}
                  className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedObject.style.gradient?.type === 'linear'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  Linear
                </button>
                <button
                  onClick={() => createGradient('radial')}
                  className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedObject.style.gradient?.type === 'radial'
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  Radial
                </button>
              </div>

              {/* Solid Color */}
              {!selectedObject.style.gradient && (
                <div className="flex gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={multipleSelected ? '#000000' : selectedObject.style.fill}
                      onChange={(e) => updateStyle('fill', e.target.value)}
                      className="w-14 h-12 bg-slate-800 border-2 border-slate-600 rounded-xl cursor-pointer shadow-lg"
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none"></div>
                  </div>
                  <input
                    type="text"
                    value={multipleSelected ? 'Mixed' : selectedObject.style.fill}
                    onChange={(e) => updateStyle('fill', e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-mono"
                    placeholder={multipleSelected ? 'Mixed' : '#000000'}
                  />
                </div>
              )}

              {/* Enhanced Gradient Controls */}
              {selectedObject.style.gradient && (
                <div className="space-y-5">
                  {/* Gradient Preview */}
                  <div className="h-12 rounded-xl border-2 border-slate-600/50 relative overflow-hidden shadow-lg">
                    <div 
                      className="w-full h-full"
                      style={{
                        background: selectedObject.style.gradient.type === 'linear'
                          ? `linear-gradient(90deg, ${selectedObject.style.gradient.stops.map(stop => 
                              `${stop.color} ${stop.offset * 100}%`
                            ).join(', ')})`
                          : `radial-gradient(circle, ${selectedObject.style.gradient.stops.map(stop => 
                              `${stop.color} ${stop.offset * 100}%`
                            ).join(', ')})`
                      }}
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-white/10 pointer-events-none"></div>
                  </div>

                  {/* Gradient Stops */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-semibold">Gradient Stops</label>
                      <button
                        onClick={addGradientStop}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-700/50"
                        title="Add Stop"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    {selectedObject.style.gradient.stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <input
                          type="color"
                          value={stop.color}
                          onChange={(e) => updateGradientStop(index, 'color', e.target.value)}
                          className="w-10 h-10 bg-slate-800 border-2 border-slate-600 rounded-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={stop.offset}
                            onChange={(e) => updateGradientStop(index, 'offset', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-center font-mono bg-slate-800/50 px-2 py-1 rounded">
                          {Math.round(stop.offset * 100)}%
                        </span>
                        {selectedObject.style.gradient.stops.length > 2 && (
                          <button
                            onClick={() => removeGradientStop(index)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                            title="Remove Stop"
                          >
                            <Minus size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Linear Gradient Angle */}
                  {selectedObject.style.gradient.type === 'linear' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-3 font-semibold">Angle</label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={selectedObject.style.gradient.angle || 0}
                            onChange={(e) => {
                              const newGradient = { ...selectedObject.style.gradient, angle: parseFloat(e.target.value) };
                              updateStyle('gradient', newGradient);
                            }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <span className="text-white text-sm font-mono w-16 text-right bg-slate-800/50 px-2 py-1 rounded-lg">
                          {selectedObject.style.gradient.angle || 0}°
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Stroke */}
        <div className="mb-4">
          <SectionHeader title="Stroke" icon={CircleIcon} sectionKey="stroke" color="red" />
          {expandedSections.has('stroke') && (
            <div className="px-4 pb-6 space-y-4">
              <div className="flex gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={multipleSelected ? '#000000' : selectedObject.style.stroke}
                    onChange={(e) => updateStyle('stroke', e.target.value)}
                    className="w-14 h-12 bg-slate-800 border-2 border-slate-600 rounded-xl cursor-pointer shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none"></div>
                </div>
                <input
                  type="text"
                  value={multipleSelected ? 'Mixed' : selectedObject.style.stroke}
                  onChange={(e) => updateStyle('stroke', e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-mono"
                  placeholder={multipleSelected ? 'Mixed' : '#000000'}
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">Stroke Width</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={multipleSelected ? '' : selectedObject.style.strokeWidth}
                  onChange={(e) => updateStyle('strokeWidth', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder={multipleSelected ? 'Mixed' : '0'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Text Properties */}
        {!multipleSelected && selectedObject.type === 'text' && (
          <div className="mb-4">
            <SectionHeader title="Text" icon={Type} sectionKey="text" color="indigo" />
            {expandedSections.has('text') && (
              <div className="px-4 pb-6 space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-semibold">Content</label>
                  <textarea
                    value={selectedObject.content}
                    onChange={(e) => onUpdateObject(selectedObject.id, { content: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Font Size</label>
                    <input
                      type="number"
                      value={selectedObject.fontSize}
                      onChange={(e) => onUpdateObject(selectedObject.id, { fontSize: parseFloat(e.target.value) || 12 })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Weight</label>
                    <select
                      value={selectedObject.fontWeight}
                      onChange={(e) => onUpdateObject(selectedObject.id, { fontWeight: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-semibold">Font Family</label>
                  <select
                    value={selectedObject.fontFamily}
                    onChange={(e) => onUpdateObject(selectedObject.id, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};