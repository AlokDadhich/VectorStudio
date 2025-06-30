import React, { useState } from 'react';
import { X, Download, Settings } from 'lucide-react';
import { Layer } from '../types';
import { exportCanvas, downloadFile, ExportOptions } from '../utils/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  canvasSize: { width: number; height: number };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  layers,
  canvasSize
}) => {
  const [format, setFormat] = useState<ExportOptions['format']>('png');
  const [quality, setQuality] = useState(0.9);
  const [scale, setScale] = useState(1);
  const [customSize, setCustomSize] = useState(false);
  const [width, setWidth] = useState(canvasSize.width);
  const [height, setHeight] = useState(canvasSize.height);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isExporting, setIsExporting] = useState(false);
  const [filename, setFilename] = useState('design');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        quality,
        scale: customSize ? 1 : scale,
        width: customSize ? width : undefined,
        height: customSize ? height : undefined,
        backgroundColor: format === 'jpg' ? backgroundColor : undefined
      };

      const url = await exportCanvas(layers, canvasSize, options);
      const extension = format === 'jpg' ? 'jpeg' : format;
      downloadFile(url, `${filename}.${extension}`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  };

  const formatOptions = [
    { value: 'png', label: 'PNG - Portable Network Graphics', description: 'High quality with transparency support' },
    { value: 'jpg', label: 'JPG - JPEG Image', description: 'Compressed format, smaller file size' },
    { value: 'svg', label: 'SVG - Scalable Vector Graphics', description: 'Perfect for web, infinitely scalable' },
    { value: 'pdf', label: 'PDF - Portable Document Format', description: 'Professional documents, print-ready' },
    { value: 'webp', label: 'WebP - Modern Web Format', description: 'Superior compression and quality' },
    { value: 'ai', label: 'AI - Adobe Illustrator Format', description: 'Editable vector format with metadata' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Export Design</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Export Format</label>
            <div className="space-y-2">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${format === option.value 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value as ExportOptions['format'])}
                    className="mt-1 text-blue-500"
                  />
                  <div>
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filename */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              placeholder="Enter filename"
            />
          </div>

          {/* Size Options - Only for raster formats */}
          {['png', 'jpg', 'webp', 'pdf'].includes(format) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Size Options</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeOption"
                    checked={!customSize}
                    onChange={() => setCustomSize(false)}
                    className="text-blue-500"
                  />
                  <span className="text-white">Use scale factor</span>
                </label>
                
                {!customSize && (
                  <div className="ml-6">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400 w-16">Scale:</span>
                      <input
                        type="range"
                        min="0.25"
                        max="4"
                        step="0.25"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12">{scale}x</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Output: {Math.round(canvasSize.width * scale)} × {Math.round(canvasSize.height * scale)}px
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeOption"
                    checked={customSize}
                    onChange={() => setCustomSize(true)}
                    className="text-blue-500"
                  />
                  <span className="text-white">Custom dimensions</span>
                </label>
                
                {customSize && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quality Settings */}
          {['png', 'jpg', 'webp'].includes(format) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12">{Math.round(quality * 100)}%</span>
              </div>
            </div>
          )}

          {/* Background Color for JPG */}
          {format === 'jpg' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};