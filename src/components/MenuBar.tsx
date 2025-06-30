import React, { useState } from 'react';
import { 
  Save, 
  FolderOpen, 
  Download, 
  Undo, 
  Redo, 
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileImage,
  Upload,
  Play,
  Share,
  Settings,
  Grid,
  Ruler,
  Palette
} from 'lucide-react';
import { Layer } from '../types';
import { ExportDialog } from './ExportDialog';
import { loadImageAsObject, parseSVGFile } from '../utils/export';

interface MenuBarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  layers: Layer[];
  canvasSize: { width: number; height: number };
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onLoadProject: (data: any) => void;
  onAddObject: (obj: any) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  layers,
  canvasSize,
  zoom,
  onZoomChange,
  onLoadProject,
  onAddObject
}) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);

  const handleSave = () => {
    const data = {
      version: '1.0',
      application: 'VectorStudio Pro',
      created: new Date().toISOString(),
      layers,
      canvasSize,
      timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      if (fileType === 'application/json' || fileName.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        onLoadProject(data);
      } else if (fileType.startsWith('image/') || fileName.endsWith('.svg')) {
        if (fileName.endsWith('.svg')) {
          const svgContent = await file.text();
          const objects = parseSVGFile(svgContent);
          objects.forEach(obj => onAddObject(obj));
        } else {
          const imageObject = await loadImageAsObject(file);
          onAddObject(imageObject);
        }
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Failed to load file. Please check the file format.');
    }

    e.target.value = '';
  };

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
  const currentZoomIndex = zoomLevels.findIndex(level => Math.abs(level - zoom) < 0.01);

  return (
    <>
      {/* Top Menu Bar */}
      <div className="h-12 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 shadow-lg">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <Palette className="text-white" size={16} />
          </div>
          <div className="text-white font-bold text-sm">VectorStudio Pro</div>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* File Operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded text-sm transition-all duration-200"
          >
            <Save size={14} />
            Save
          </button>
          
          <label className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded text-sm cursor-pointer transition-all duration-200">
            <FolderOpen size={14} />
            Open
            <input
              type="file"
              accept=".json,.png,.jpg,.jpeg,.svg,.webp"
              className="hidden"
              onChange={handleFileOpen}
            />
          </label>

          <label className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded text-sm cursor-pointer transition-all duration-200">
            <Upload size={14} />
            Import
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              className="hidden"
              onChange={handleFileOpen}
            />
          </label>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Edit Operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={14} />
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={14} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const newIndex = Math.max(0, currentZoomIndex - 1);
              onZoomChange(zoomLevels[newIndex]);
            }}
            disabled={currentZoomIndex <= 0}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded border border-gray-600">
            <span className="text-xs text-gray-300 font-mono min-w-8 text-center">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          
          <button
            onClick={() => {
              const newIndex = Math.min(zoomLevels.length - 1, currentZoomIndex + 1);
              onZoomChange(zoomLevels[newIndex]);
            }}
            disabled={currentZoomIndex >= zoomLevels.length - 1}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          
          <button
            onClick={() => onZoomChange(1)}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200"
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* View Options */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-all duration-200 ${
              showGrid ? 'text-blue-400 bg-blue-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
            title="Toggle Grid"
          >
            <Grid size={14} />
          </button>
          
          <button
            onClick={() => setShowRulers(!showRulers)}
            className={`p-1.5 rounded transition-all duration-200 ${
              showRulers ? 'text-blue-400 bg-blue-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
            title="Toggle Rulers"
          >
            <Ruler size={14} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded text-sm transition-all duration-200"
          >
            <Play size={14} />
            Preview
          </button>
          
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-sm transition-all duration-200 shadow-lg"
          >
            <Share size={14} />
            Share
          </button>
          
          <button
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200"
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 text-xs text-gray-400 border-l border-gray-600 pl-3">
          <span>{layers.reduce((total, layer) => total + layer.objects.length, 0)} objects</span>
          <span>{layers.filter(layer => layer.visible).length} layers</span>
        </div>
      </div>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        layers={layers}
        canvasSize={canvasSize}
      />
    </>
  );
};