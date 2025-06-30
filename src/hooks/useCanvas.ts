import { useState, useCallback, useRef } from 'react';
import { CanvasState, CanvasObject, Layer, Tool, Point, HistoryState } from '../types';

const createInitialState = (): CanvasState => ({
  layers: [{
    id: 'layer-1',
    name: 'Layer 1',
    visible: true,
    locked: false,
    objects: []
  }],
  activeLayerId: 'layer-1',
  selectedObjectIds: [],
  zoom: 1,
  pan: { x: 100, y: 100 },
  tool: 'select',
  canvasSize: { width: 4000, height: 4000 }
});

export const useCanvas = () => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: createInitialState(),
    future: []
  });

  const { present: state } = history;
  const nextObjectId = useRef(1);

  const pushToHistory = useCallback((newState: CanvasState) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-50), prev.present], // Keep last 50 states
      present: newState,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future.slice(0, 49)] // Keep last 50 states
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const setTool = useCallback((tool: Tool) => {
    const newState = { ...state, tool, selectedObjectIds: [] };
    setHistory(prev => ({ ...prev, present: newState }));
  }, [state]);

  const addObject = useCallback((obj: Omit<CanvasObject, 'id'>) => {
    const newObject = { ...obj, id: `obj-${nextObjectId.current++}` } as CanvasObject;
    const activeLayer = state.layers.find(layer => layer.id === state.activeLayerId);
    
    if (!activeLayer) return;

    const newLayers = state.layers.map(layer => 
      layer.id === state.activeLayerId 
        ? { ...layer, objects: [...layer.objects, newObject] }
        : layer
    );

    const newState = { 
      ...state, 
      layers: newLayers,
      selectedObjectIds: [newObject.id]
    };
    pushToHistory(newState);
  }, [state, pushToHistory]);

  const updateObject = useCallback((objectId: string, updates: Partial<CanvasObject>) => {
    const newLayers = state.layers.map(layer => ({
      ...layer,
      objects: layer.objects.map(obj => 
        obj.id === objectId ? { ...obj, ...updates } : obj
      )
    }));

    const newState = { ...state, layers: newLayers };
    setHistory(prev => ({ ...prev, present: newState }));
  }, [state]);

  const deleteObject = useCallback((objectId: string) => {
    const newLayers = state.layers.map(layer => ({
      ...layer,
      objects: layer.objects.filter(obj => obj.id !== objectId)
    }));

    const newState = { 
      ...state, 
      layers: newLayers,
      selectedObjectIds: state.selectedObjectIds.filter(id => id !== objectId)
    };
    pushToHistory(newState);
  }, [state, pushToHistory]);

  const selectObjects = useCallback((objectIds: string[]) => {
    const newState = { ...state, selectedObjectIds: objectIds };
    setHistory(prev => ({ ...prev, present: newState }));
  }, [state]);

  const setZoom = useCallback((zoom: number) => {
    const newState = { ...state, zoom: Math.max(0.1, Math.min(5, zoom)) };
    setHistory(prev => ({ ...prev, present: newState }));
  }, [state]);

  const setPan = useCallback((pan: Point) => {
    const newState = { ...state, pan };
    setHistory(prev => ({ ...prev, present: newState }));
  }, [state]);

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${state.layers.length + 1}`,
      visible: true,
      locked: false,
      objects: []
    };

    const newState = {
      ...state,
      layers: [...state.layers, newLayer],
      activeLayerId: newLayer.id
    };
    pushToHistory(newState);
  }, [state, pushToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    if (state.layers.length <= 1) return;

    const newLayers = state.layers.filter(layer => layer.id !== layerId);
    const newActiveLayerId = layerId === state.activeLayerId 
      ? newLayers[0].id 
      : state.activeLayerId;

    const newState = {
      ...state,
      layers: newLayers,
      activeLayerId: newActiveLayerId
    };
    pushToHistory(newState);
  }, [state, pushToHistory]);

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    const newLayers = state.layers.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    );

    const newState = { ...state, layers: newLayers };
    setHistory(prev => ({ ...prev, present: newState }));
  }, [state]);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    console.log('moveLayer called:', layerId, direction);
    console.log('Current layers:', state.layers.map(l => ({ id: l.id, name: l.name })));
    
    const currentIndex = state.layers.findIndex(layer => layer.id === layerId);
    console.log('Current index:', currentIndex);
    
    if (currentIndex === -1) {
      console.log('Layer not found');
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    console.log('New index:', newIndex);
    
    if (newIndex < 0 || newIndex >= state.layers.length) {
      console.log('Invalid new index');
      return;
    }

    const newLayers = [...state.layers];
    const [movedLayer] = newLayers.splice(currentIndex, 1);
    newLayers.splice(newIndex, 0, movedLayer);

    console.log('New layers order:', newLayers.map(l => ({ id: l.id, name: l.name })));

    const newState = { ...state, layers: newLayers };
    pushToHistory(newState);
  }, [state, pushToHistory]);

  const loadProject = useCallback((data: any) => {
    try {
      const newState: CanvasState = {
        layers: data.layers || createInitialState().layers,
        activeLayerId: data.activeLayerId || data.layers?.[0]?.id || 'layer-1',
        selectedObjectIds: [],
        zoom: 1,
        pan: { x: 100, y: 100 },
        tool: 'select',
        canvasSize: data.canvasSize || { width: 4000, height: 4000 }
      };
      
      setHistory({
        past: [],
        present: newState,
        future: []
      });
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  }, []);

  return {
    state,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
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
  };
};