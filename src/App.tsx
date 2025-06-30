import React, { useEffect, useState } from 'react';
import { useCanvas } from './hooks/useCanvas';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';
import { MenuBar } from './components/MenuBar';

function App() {
  const {
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    setTool,
    addObject,
    updateObject,
    deleteObject,
    selectObjects,
    setZoom,
    setPan,
    addLayer,
    deleteLayer,
    updateLayer,
    moveLayer,
    loadProject
  } = useCanvas();

  // Get active layer and selected objects
  const activeLayer = state.layers.find(layer => layer.id === state.activeLayerId);
  const allObjects = state.layers.flatMap(layer => layer.objects);
  const selectedObjects = allObjects.filter(obj => state.selectedObjectIds.includes(obj.id));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            // Save functionality would go here
            break;
        }
      } else {
        // Tool shortcuts
        switch (e.key) {
          case 'v':
            setTool('select');
            break;
          case 'p':
            setTool('pen');
            break;
          case 'c':
            setTool('curve');
            break;
          case 'r':
            setTool('rect');
            break;
          case 'e':
            setTool('circle');
            break;
          case 'l':
            setTool('line');
            break;
          case 't':
            setTool('text');
            break;
          case 'b':
            setTool('brush');
            break;
          case 'i':
            setTool('eyedropper');
            break;
          case 'z':
            setTool('zoom');
            break;
          case 'h':
            setTool('hand');
            break;
          case 'Delete':
          case 'Backspace':
            state.selectedObjectIds.forEach(id => deleteObject(id));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setTool, state.selectedObjectIds, deleteObject]);

  const handleSetActiveLayer = (layerId: string) => {
    updateLayer(state.activeLayerId, { id: layerId });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Menu Bar */}
      <MenuBar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        layers={state.layers}
        canvasSize={state.canvasSize}
        zoom={state.zoom}
        onZoomChange={setZoom}
        onLoadProject={loadProject}
        onAddObject={addObject}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar
          activeTool={state.tool}
          onToolSelect={setTool}
        />

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col relative">
          <Canvas
            objects={allObjects}
            selectedObjectIds={state.selectedObjectIds}
            tool={state.tool}
            zoom={state.zoom}
            pan={state.pan}
            onObjectSelect={selectObjects}
            onObjectUpdate={updateObject}
            onAddObject={addObject}
            onPanChange={setPan}
            onZoomChange={setZoom}
          />
          
          {/* Layers Panel */}
          <LayersPanel
            layers={state.layers}
            activeLayerId={state.activeLayerId}
            onAddLayer={addLayer}
            onDeleteLayer={deleteLayer}
            onUpdateLayer={updateLayer}
            onSetActiveLayer={handleSetActiveLayer}
            onMoveLayer={moveLayer}
          />
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedObjects={selectedObjects}
          onUpdateObject={updateObject}
        />
      </div>
    </div>
  );
}

export default App;