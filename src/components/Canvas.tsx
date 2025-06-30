import React, { useRef, useCallback, useEffect, useState } from 'react';
import { CanvasObject, Point, Tool } from '../types';
import { getBoundingBox, pointInBoundingBox, snapToGrid } from '../utils/geometry';

interface CanvasProps {
  objects: CanvasObject[];
  selectedObjectIds: string[];
  tool: Tool;
  zoom: number;
  pan: Point;
  onObjectSelect: (objectIds: string[]) => void;
  onObjectUpdate: (objectId: string, updates: Partial<CanvasObject>) => void;
  onAddObject: (obj: Omit<CanvasObject, 'id'>) => void;
  onPanChange: (pan: Point) => void;
  onZoomChange: (zoom: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  objects,
  selectedObjectIds,
  tool,
  zoom,
  pan,
  onObjectSelect,
  onObjectUpdate,
  onAddObject,
  onPanChange,
  onZoomChange
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [previewObject, setPreviewObject] = useState<CanvasObject | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 4000, height: 4000 });
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 });
  
  // Pen tool state
  const [penPath, setPenPath] = useState<Point[]>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [penSettings, setPenSettings] = useState({
    color: '#1E40AF',
    width: 2
  });
  
  // Brush tool state
  const [brushStrokes, setBrushStrokes] = useState<Point[]>([]);
  const [isBrushing, setIsBrushing] = useState(false);
  const [brushSettings, setBrushSettings] = useState({
    size: 10,
    opacity: 1,
    color: '#1E40AF'
  });

  // Curve tool state
  const [curvePoints, setCurvePoints] = useState<Point[]>([]);
  const [isDrawingCurve, setIsDrawingCurve] = useState(false);

  // Previous tool ref to detect tool changes
  const prevToolRef = useRef<Tool>(tool);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  const getScreenPoint = useCallback((canvasPoint: Point): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: canvasPoint.x * zoom + pan.x + rect.left,
      y: canvasPoint.y * zoom + pan.y + rect.top
    };
  }, [pan, zoom]);

  // Dynamic canvas resizing - expands in all 4 directions
  const updateCanvasSize = useCallback((newPoint?: Point, additionalObjects: CanvasObject[] = []) => {
    const allObjects = [...objects, ...additionalObjects];
    if (previewObject) allObjects.push(previewObject);
    
    // Include the new point if provided (for live drawing)
    const pointsToCheck: Point[] = [];
    if (newPoint) pointsToCheck.push(newPoint);
    if (penPath.length > 0) pointsToCheck.push(...penPath);
    if (brushStrokes.length > 0) pointsToCheck.push(...brushStrokes);
    if (curvePoints.length > 0) pointsToCheck.push(...curvePoints);

    let minX = 0, minY = 0, maxX = 4000, maxY = 4000;

    // Check all objects
    allObjects.forEach(obj => {
      if (!obj.visible) return;
      const bbox = getBoundingBox(obj);
      minX = Math.min(minX, bbox.x - 100);
      minY = Math.min(minY, bbox.y - 100);
      maxX = Math.max(maxX, bbox.x + bbox.width + 100);
      maxY = Math.max(maxY, bbox.y + bbox.height + 100);
    });

    // Check live drawing points
    pointsToCheck.forEach(point => {
      minX = Math.min(minX, point.x - 100);
      minY = Math.min(minY, point.y - 100);
      maxX = Math.max(maxX, point.x + 100);
      maxY = Math.max(maxY, point.y + 100);
    });

    // Calculate required canvas bounds with padding
    const padding = 500;
    const requiredMinX = minX - padding;
    const requiredMinY = minY - padding;
    const requiredMaxX = maxX + padding;
    const requiredMaxY = maxY + padding;

    // Calculate new canvas dimensions
    const newWidth = Math.max(4000, requiredMaxX - requiredMinX);
    const newHeight = Math.max(4000, requiredMaxY - requiredMinY);

    // Check if canvas needs to expand
    const needsResize = newWidth > canvasSize.width || newHeight > canvasSize.height;

    if (needsResize) {
      console.log('🎨 Canvas expanding:', {
        from: `${canvasSize.width}×${canvasSize.height}`,
        to: `${newWidth}×${newHeight}`,
        bounds: { minX, minY, maxX, maxY }
      });
      
      setCanvasSize({ width: newWidth, height: newHeight });
    }
  }, [objects, previewObject, penPath, brushStrokes, curvePoints, canvasSize]);

  // Update canvas size when objects change
  useEffect(() => {
    updateCanvasSize();
  }, [objects, previewObject]);

  // Save current drawing when tool changes
  useEffect(() => {
    const prevTool = prevToolRef.current;
    
    if (prevTool !== tool) {
      // Save any active drawing from the previous tool
      if (prevTool === 'pen' && penPath.length > 1) {
        finishPenPath();
      } else if (prevTool === 'brush' && brushStrokes.length > 1) {
        finishBrushStroke();
      } else if (prevTool === 'curve' && curvePoints.length > 1) {
        finishCurve();
      }
      
      // Clear text editing when switching tools
      if (prevTool === 'text' && editingTextId) {
        finishTextEditing();
      }
      
      // Update the ref
      prevToolRef.current = tool;
    }
  }, [tool]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && !editingTextId) {
        setIsSpacePressed(true);
        e.preventDefault();
      }
      
      // Handle text editing
      if (editingTextId && e.key === 'Enter' && !e.shiftKey) {
        finishTextEditing();
        e.preventDefault();
      } else if (editingTextId && e.key === 'Escape') {
        cancelTextEditing();
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, editingTextId]);

  // Generate smooth curve using Catmull-Rom spline
  const generateSmoothCurve = (points: Point[]): string => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || points[i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const finishPenPath = useCallback(() => {
    if (penPath.length > 1) {
      const pathObject: Omit<CanvasObject, 'id'> = {
        type: 'path',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        style: {
          fill: 'none',
          stroke: penSettings.color,
          strokeWidth: penSettings.width,
          opacity: 1,
          fillOpacity: 1,
          strokeOpacity: 1,
          gradient: null
        },
        visible: true,
        locked: false,
        selected: false,
        points: [...penPath],
        closed: false
      };
      onAddObject(pathObject);
    }
    setPenPath([]);
    setIsDrawingPath(false);
  }, [penPath, penSettings, onAddObject]);

  const finishBrushStroke = useCallback(() => {
    if (brushStrokes.length > 1) {
      const pathObject: Omit<CanvasObject, 'id'> = {
        type: 'path',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        style: {
          fill: 'none',
          stroke: brushSettings.color,
          strokeWidth: brushSettings.size,
          opacity: brushSettings.opacity,
          fillOpacity: 1,
          strokeOpacity: 1,
          gradient: null
        },
        visible: true,
        locked: false,
        selected: false,
        points: [...brushStrokes],
        closed: false
      };
      onAddObject(pathObject);
    }
    setBrushStrokes([]);
    setIsBrushing(false);
  }, [brushStrokes, brushSettings, onAddObject]);

  const finishCurve = useCallback(() => {
    if (curvePoints.length > 1) {
      const curveObject: Omit<CanvasObject, 'id'> = {
        type: 'curve',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        style: {
          fill: 'none',
          stroke: '#3B82F6',
          strokeWidth: 2,
          opacity: 1,
          fillOpacity: 1,
          strokeOpacity: 1,
          gradient: null
        },
        visible: true,
        locked: false,
        selected: false,
        points: [...curvePoints],
        controlPoints: [],
        closed: false
      };
      onAddObject(curveObject);
    }
    setCurvePoints([]);
    setIsDrawingCurve(false);
  }, [curvePoints, onAddObject]);

  const finishTextEditing = useCallback(() => {
    if (editingTextId && textInput.trim()) {
      onObjectUpdate(editingTextId, { content: textInput.trim() });
    } else if (editingTextId && !textInput.trim()) {
      // Remove empty text objects
      const textObj = objects.find(obj => obj.id === editingTextId);
      if (textObj) {
        onObjectUpdate(editingTextId, { visible: false });
      }
    }
    setEditingTextId(null);
    setTextInput('');
  }, [editingTextId, textInput, onObjectUpdate, objects]);

  const cancelTextEditing = useCallback(() => {
    if (editingTextId) {
      // Remove the text object if it was just created
      const textObj = objects.find(obj => obj.id === editingTextId);
      if (textObj && textObj.content === 'Text') {
        onObjectUpdate(editingTextId, { visible: false });
      }
    }
    setEditingTextId(null);
    setTextInput('');
  }, [editingTextId, onObjectUpdate, objects]);

  const handleEraserTool = (point: Point) => {
    const objectsToErase = objects.filter(obj => {
      const bbox = getBoundingBox(obj);
      return pointInBoundingBox(point, bbox) && !obj.locked;
    });

    objectsToErase.forEach(obj => {
      onObjectUpdate(obj.id, { visible: false });
    });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);
    
    // Don't handle mouse events if editing text
    if (editingTextId) return;
    
    if (tool === 'hand' || isSpacePressed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'pen') {
      if (!isDrawingPath) {
        setPenPath([point]);
        setIsDrawingPath(true);
      } else {
        setPenPath(prev => {
          const newPath = [...prev, point];
          updateCanvasSize(point);
          return newPath;
        });
      }
      return;
    }

    if (tool === 'curve') {
      setCurvePoints(prev => {
        const newPoints = [...prev, point];
        updateCanvasSize(point);
        return newPoints;
      });
      setIsDrawingCurve(true);
      return;
    }

    if (tool === 'brush') {
      setIsBrushing(true);
      setBrushStrokes([point]);
      updateCanvasSize(point);
      return;
    }

    if (tool === 'eraser') {
      handleEraserTool(point);
      return;
    }

    if (tool === 'select') {
      const clickedObject = objects.find(obj => {
        const bbox = getBoundingBox(obj);
        return pointInBoundingBox(point, bbox);
      });

      if (clickedObject) {
        if (!selectedObjectIds.includes(clickedObject.id)) {
          if (e.shiftKey) {
            onObjectSelect([...selectedObjectIds, clickedObject.id]);
          } else {
            onObjectSelect([clickedObject.id]);
          }
        }
        setIsDragging(true);
        setDragStart(point);
      } else {
        if (!e.shiftKey) {
          onObjectSelect([]);
        }
        setSelectionBox({ start: point, end: point });
        setIsDragging(true);
        setDragStart(point);
      }
      return;
    }

    // Drawing tools
    if (['rect', 'circle', 'line', 'ellipse', 'polygon', 'star', 'triangle'].includes(tool)) {
      setIsDrawing(true);
      setDrawingStart(point);
    } else if (tool === 'text') {
      // Create new text object and start editing
      const textObject: Omit<CanvasObject, 'id'> = {
        type: 'text',
        transform: { x: point.x, y: point.y, rotation: 0, scaleX: 1, scaleY: 1 },
        style: {
          fill: '#000000',
          stroke: 'none',
          strokeWidth: 0,
          opacity: 1,
          fillOpacity: 1,
          strokeOpacity: 1,
          gradient: null
        },
        visible: true,
        locked: false,
        selected: false,
        content: 'Text',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal'
      };
      
      // Update canvas size for the new text
      updateCanvasSize(point);
      
      // Add the object
      onAddObject(textObject);
      
      // Start editing the text after a short delay to ensure the object is created
      setTimeout(() => {
        // Find the newly created text object
        const allObjects = objects;
        const newTextObj = allObjects[allObjects.length - 1];
        if (newTextObj && newTextObj.type === 'text') {
          setEditingTextId(newTextObj.id);
          setTextInput(newTextObj.content || 'Text');
          setTextPosition(getScreenPoint(point));
        }
      }, 100);
    }
  }, [tool, objects, selectedObjectIds, getCanvasPoint, onObjectSelect, onAddObject, isSpacePressed, isDrawingPath, editingTextId, getScreenPoint, updateCanvasSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);

    // Don't handle mouse events if editing text
    if (editingTextId) return;

    if (isDragging && (tool === 'hand' || isSpacePressed) && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'pen' && isDrawingPath && e.buttons === 1) {
      setPenPath(prev => {
        const newPath = [...prev, point];
        updateCanvasSize(point);
        return newPath;
      });
      return;
    }

    if (tool === 'brush' && isBrushing && e.buttons === 1) {
      setBrushStrokes(prev => {
        const newStrokes = [...prev, point];
        updateCanvasSize(point);
        return newStrokes;
      });
      return;
    }

    if (tool === 'eraser' && e.buttons === 1) {
      handleEraserTool(point);
      return;
    }

    if (isDragging && tool === 'select' && dragStart) {
      if (selectedObjectIds.length > 0) {
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        
        selectedObjectIds.forEach(id => {
          const obj = objects.find(o => o.id === id);
          if (obj) {
            const newTransform = {
              ...obj.transform,
              x: obj.transform.x + dx,
              y: obj.transform.y + dy
            };
            onObjectUpdate(id, { transform: newTransform });
            // Update canvas size for moved objects
            updateCanvasSize({ x: newTransform.x, y: newTransform.y });
          }
        });
        setDragStart(point);
      } else if (selectionBox) {
        setSelectionBox({ ...selectionBox, end: point });
      }
    }

    if (isDrawing && drawingStart && ['rect', 'circle', 'line', 'ellipse', 'polygon', 'star', 'triangle'].includes(tool)) {
      const width = Math.abs(point.x - drawingStart.x);
      const height = Math.abs(point.y - drawingStart.y);
      const x = Math.min(point.x, drawingStart.x);
      const y = Math.min(point.y, drawingStart.y);

      // Update canvas size for preview
      updateCanvasSize({ x: x + width, y: y + height });

      const baseStyle = {
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 2,
        opacity: 0.7,
        fillOpacity: 0.7,
        strokeOpacity: 1,
        gradient: null
      };

      let preview: CanvasObject | null = null;

      if (tool === 'rect') {
        preview = {
          id: 'preview',
          type: 'rect',
          transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
          style: baseStyle,
          visible: true,
          locked: false,
          selected: false,
          width,
          height
        } as CanvasObject;
      } else if (tool === 'circle' || tool === 'ellipse') {
        const radius = Math.min(width, height) / 2;
        preview = {
          id: 'preview',
          type: 'circle',
          transform: { x: x + width/2, y: y + height/2, rotation: 0, scaleX: 1, scaleY: 1 },
          style: baseStyle,
          visible: true,
          locked: false,
          selected: false,
          radius
        } as CanvasObject;
      } else if (tool === 'line') {
        preview = {
          id: 'preview',
          type: 'line',
          transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
          style: { ...baseStyle, fill: 'none' },
          visible: true,
          locked: false,
          selected: false,
          x1: drawingStart.x,
          y1: drawingStart.y,
          x2: point.x,
          y2: point.y
        } as CanvasObject;
      } else if (tool === 'triangle') {
        const points = [
          { x: x + width/2, y: y },
          { x: x, y: y + height },
          { x: x + width, y: y + height }
        ];
        preview = {
          id: 'preview',
          type: 'path',
          transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
          style: baseStyle,
          visible: true,
          locked: false,
          selected: false,
          points,
          closed: true
        } as CanvasObject;
      } else if (tool === 'star') {
        const centerX = x + width/2;
        const centerY = y + height/2;
        const outerRadius = Math.min(width, height) / 2;
        const innerRadius = outerRadius * 0.4;
        const points = [];
        
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          points.push({
            x: centerX + radius * Math.cos(angle - Math.PI/2),
            y: centerY + radius * Math.sin(angle - Math.PI/2)
          });
        }
        
        preview = {
          id: 'preview',
          type: 'path',
          transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
          style: baseStyle,
          visible: true,
          locked: false,
          selected: false,
          points,
          closed: true
        } as CanvasObject;
      }

      setPreviewObject(preview);
    }
  }, [isDragging, isDrawing, tool, dragStart, drawingStart, selectedObjectIds, objects, getCanvasPoint, pan, onPanChange, onObjectUpdate, isSpacePressed, selectionBox, isBrushing, isDrawingPath, editingTextId, updateCanvasSize]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);

    // Don't handle mouse events if editing text
    if (editingTextId) return;

    if (tool === 'brush' && isBrushing) {
      finishBrushStroke();
      return;
    }

    if (selectionBox && tool === 'select') {
      const box = {
        x: Math.min(selectionBox.start.x, selectionBox.end.x),
        y: Math.min(selectionBox.start.y, selectionBox.end.y),
        width: Math.abs(selectionBox.end.x - selectionBox.start.x),
        height: Math.abs(selectionBox.end.y - selectionBox.start.y)
      };

      const selectedIds = objects
        .filter(obj => {
          const bbox = getBoundingBox(obj);
          return bbox.x >= box.x && bbox.y >= box.y && 
                 bbox.x + bbox.width <= box.x + box.width &&
                 bbox.y + bbox.height <= box.y + box.height;
        })
        .map(obj => obj.id);

      if (e.shiftKey) {
        onObjectSelect([...new Set([...selectedObjectIds, ...selectedIds])]);
      } else {
        onObjectSelect(selectedIds);
      }
      
      setSelectionBox(null);
    }

    if (isDrawing && drawingStart && ['rect', 'circle', 'line', 'ellipse', 'polygon', 'star', 'triangle'].includes(tool)) {
      const width = Math.abs(point.x - drawingStart.x);
      const height = Math.abs(point.y - drawingStart.y);
      const x = Math.min(point.x, drawingStart.x);
      const y = Math.min(point.y, drawingStart.y);

      if (width > 5 || height > 5) {
        const baseStyle = {
          fill: '#3B82F6',
          stroke: '#1E40AF',
          strokeWidth: 2,
          opacity: 1,
          fillOpacity: 1,
          strokeOpacity: 1,
          gradient: null
        };

        if (tool === 'rect') {
          const rectObject: Omit<CanvasObject, 'id'> = {
            type: 'rect',
            transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
            style: baseStyle,
            visible: true,
            locked: false,
            selected: false,
            width,
            height
          };
          onAddObject(rectObject);
        } else if (tool === 'circle' || tool === 'ellipse') {
          const radius = Math.min(width, height) / 2;
          const circleObject: Omit<CanvasObject, 'id'> = {
            type: 'circle',
            transform: { x: x + width/2, y: y + height/2, rotation: 0, scaleX: 1, scaleY: 1 },
            style: baseStyle,
            visible: true,
            locked: false,
            selected: false,
            radius
          };
          onAddObject(circleObject);
        } else if (tool === 'line') {
          const lineObject: Omit<CanvasObject, 'id'> = {
            type: 'line',
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { ...baseStyle, fill: 'none' },
            visible: true,
            locked: false,
            selected: false,
            x1: drawingStart.x,
            y1: drawingStart.y,
            x2: point.x,
            y2: point.y
          };
          onAddObject(lineObject);
        } else if (tool === 'triangle') {
          const points = [
            { x: x + width/2, y: y },
            { x: x, y: y + height },
            { x: x + width, y: y + height }
          ];
          const triangleObject: Omit<CanvasObject, 'id'> = {
            type: 'path',
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            style: baseStyle,
            visible: true,
            locked: false,
            selected: false,
            points,
            closed: true
          };
          onAddObject(triangleObject);
        } else if (tool === 'star') {
          const centerX = x + width/2;
          const centerY = y + height/2;
          const outerRadius = Math.min(width, height) / 2;
          const innerRadius = outerRadius * 0.4;
          const points = [];
          
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            points.push({
              x: centerX + radius * Math.cos(angle - Math.PI/2),
              y: centerY + radius * Math.sin(angle - Math.PI/2)
            });
          }
          
          const starObject: Omit<CanvasObject, 'id'> = {
            type: 'path',
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            style: baseStyle,
            visible: true,
            locked: false,
            selected: false,
            points,
            closed: true
          };
          onAddObject(starObject);
        }
      }
    }

    setIsDragging(false);
    setIsDrawing(false);
    setDragStart(null);
    setDrawingStart(null);
    setPreviewObject(null);
    setSelectionBox(null);
  }, [isDrawing, drawingStart, tool, getCanvasPoint, onAddObject, selectionBox, objects, selectedObjectIds, onObjectSelect, isBrushing, finishBrushStroke, editingTextId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
      onZoomChange(newZoom);
    } else if (tool === 'brush') {
      const delta = e.deltaY > 0 ? -2 : 2;
      setBrushSettings(prev => ({
        ...prev,
        size: Math.max(1, Math.min(100, prev.size + delta))
      }));
    } else if (tool === 'pen') {
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      setPenSettings(prev => ({
        ...prev,
        width: Math.max(0.5, Math.min(20, prev.width + delta))
      }));
    } else {
      // Pan canvas with mouse wheel
      const delta = e.deltaY > 0 ? -50 : 50;
      if (e.shiftKey) {
        // Horizontal pan with Shift + wheel
        onPanChange({ x: pan.x + delta, y: pan.y });
      } else {
        // Vertical pan with wheel
        onPanChange({ x: pan.x, y: pan.y + delta });
      }
    }
  }, [zoom, onZoomChange, tool, pan, onPanChange]);

  const renderGradient = (gradient: any, id: string) => {
    if (!gradient) return null;
    
    if (gradient.type === 'linear') {
      return (
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          {gradient.stops.map((stop: any, index: number) => (
            <stop key={index} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity || 1} />
          ))}
        </linearGradient>
      );
    } else if (gradient.type === 'radial') {
      return (
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          {gradient.stops.map((stop: any, index: number) => (
            <stop key={index} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity || 1} />
          ))}
        </radialGradient>
      );
    }
    return null;
  };

  const renderObject = (obj: CanvasObject) => {
    const { transform, style } = obj;
    const isSelected = selectedObjectIds.includes(obj.id);
    const isPreview = obj.id === 'preview';
    const isEditing = editingTextId === obj.id;
    
    const gradientId = `gradient-${obj.id}`;
    const fillValue = style.gradient ? `url(#${gradientId})` : style.fill;
    
    const commonProps = {
      fill: fillValue,
      stroke: isSelected ? '#3B82F6' : style.stroke,
      strokeWidth: isSelected ? Math.max(2, style.strokeWidth) : style.strokeWidth,
      opacity: isEditing ? 0.5 : style.opacity,
      fillOpacity: style.fillOpacity,
      strokeOpacity: style.strokeOpacity,
      transform: `translate(${transform.x},${transform.y}) rotate(${transform.rotation * 180 / Math.PI}) scale(${transform.scaleX},${transform.scaleY})`,
      className: `${isSelected ? 'drop-shadow-lg' : ''} ${isPreview ? 'animate-pulse' : ''} transition-all duration-150`,
      style: { 
        vectorEffect: 'non-scaling-stroke',
        shapeRendering: 'geometricPrecision',
        cursor: tool === 'select' ? 'move' : 'default'
      }
    };

    switch (obj.type) {
      case 'rect':
        return (
          <g key={obj.id}>
            {style.gradient && renderGradient(style.gradient, gradientId)}
            <rect
              x={0}
              y={0}
              width={obj.width}
              height={obj.height}
              rx={obj.rx}
              ry={obj.ry}
              {...commonProps}
            />
          </g>
        );
      case 'circle':
        return (
          <g key={obj.id}>
            {style.gradient && renderGradient(style.gradient, gradientId)}
            <circle
              cx={0}
              cy={0}
              r={obj.radius}
              {...commonProps}
            />
          </g>
        );
      case 'line':
        return (
          <line
            key={obj.id}
            x1={obj.x1}
            y1={obj.y1}
            x2={obj.x2}
            y2={obj.y2}
            {...commonProps}
          />
        );
      case 'text':
        return (
          <text
            key={obj.id}
            x={0}
            y={0}
            fontSize={obj.fontSize}
            fontFamily={obj.fontFamily}
            fontWeight={obj.fontWeight}
            dominantBaseline="central"
            {...commonProps}
          >
            {obj.content}
          </text>
        );
      case 'path':
        const pathData = obj.points.length > 0 ? 
          `M ${obj.points[0].x} ${obj.points[0].y} ` + 
          obj.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
          (obj.closed ? ' Z' : '') : '';
        return (
          <g key={obj.id}>
            {style.gradient && renderGradient(style.gradient, gradientId)}
            <path
              d={pathData}
              {...commonProps}
            />
          </g>
        );
      case 'curve':
        const curveData = generateSmoothCurve(obj.points);
        return (
          <g key={obj.id}>
            {style.gradient && renderGradient(style.gradient, gradientId)}
            <path
              d={curveData}
              {...commonProps}
            />
          </g>
        );
      case 'image':
        return (
          <image
            key={obj.id}
            x={0}
            y={0}
            width={obj.width}
            height={obj.height}
            href={obj.src}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  const currentTool = isSpacePressed ? 'hand' : tool;

  return (
    <div className="flex-1 flex flex-col bg-gray-100 relative">
      {/* Main Canvas Area */}
      <div
        ref={canvasRef}
        className={`
          flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative
          ${currentTool === 'hand' ? 'cursor-grab' : 
            currentTool === 'select' ? 'cursor-default' : 
            currentTool === 'pen' ? 'cursor-crosshair' :
            currentTool === 'brush' ? 'cursor-none' :
            currentTool === 'eraser' ? 'cursor-none' :
            currentTool === 'text' ? 'cursor-text' :
            'cursor-crosshair'}
          ${isDragging && (currentTool === 'hand' || isSpacePressed) ? 'cursor-grabbing' : ''}
        `}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #d1d5db 1px, transparent 1px),
              linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        />
        
        {/* Canvas */}
        <div
          className="absolute bg-white shadow-2xl border border-gray-300"
          style={{
            left: pan.x,
            top: pan.y,
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom,
            borderRadius: '4px'
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1"/>
              </filter>
            </defs>
            
            {/* Render all objects */}
            {objects.filter(obj => obj.visible).map(renderObject)}
            
            {/* Render preview object */}
            {previewObject && renderObject(previewObject)}
            
            {/* Pen tool live drawing */}
            {tool === 'pen' && penPath.length > 0 && (
              <path
                d={penPath.length > 1 ? 
                  `M ${penPath[0].x} ${penPath[0].y} ` + penPath.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : ''
                }
                fill="none"
                stroke={penSettings.color}
                strokeWidth={penSettings.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            )}
            
            {/* Brush stroke live drawing */}
            {tool === 'brush' && brushStrokes.length > 0 && (
              <path
                d={`M ${brushStrokes[0].x} ${brushStrokes[0].y} ` + brushStrokes.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke={brushSettings.color}
                strokeWidth={brushSettings.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={brushSettings.opacity}
              />
            )}
            
            {/* Curve tool live drawing */}
            {tool === 'curve' && curvePoints.length > 0 && (
              <g>
                {curvePoints.length > 1 && (
                  <path
                    d={generateSmoothCurve(curvePoints)}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                )}
                {curvePoints.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
              </g>
            )}
            
            {/* Selection box */}
            {selectionBox && (
              <rect
                x={Math.min(selectionBox.start.x, selectionBox.end.x)}
                y={Math.min(selectionBox.start.y, selectionBox.end.y)}
                width={Math.abs(selectionBox.end.x - selectionBox.start.x)}
                height={Math.abs(selectionBox.end.y - selectionBox.start.y)}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3B82F6"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            )}
            
            {/* Selection handles */}
            {selectedObjectIds.map(id => {
              const obj = objects.find(o => o.id === id);
              if (!obj) return null;
              
              const bbox = getBoundingBox(obj);
              return (
                <g key={`handles-${id}`}>
                  <rect
                    x={bbox.x - 2}
                    y={bbox.y - 2}
                    width={bbox.width + 4}
                    height={bbox.height + 4}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  {[
                    { x: bbox.x - 4, y: bbox.y - 4 },
                    { x: bbox.x + bbox.width, y: bbox.y - 4 },
                    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                    { x: bbox.x - 4, y: bbox.y + bbox.height }
                  ].map((handle, i) => (
                    <rect
                      key={i}
                      x={handle.x}
                      y={handle.y}
                      width="8"
                      height="8"
                      fill="white"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      className="cursor-nw-resize"
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Text Input Overlay */}
        {editingTextId && (
          <div
            className="absolute z-50"
            style={{
              left: textPosition.x,
              top: textPosition.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onBlur={finishTextEditing}
              className="bg-transparent border-2 border-blue-500 text-black text-2xl font-normal outline-none px-2 py-1 rounded"
              style={{
                fontFamily: 'Arial',
                fontSize: '24px',
                minWidth: '100px'
              }}
              autoFocus
            />
          </div>
        )}
        
        {/* Enhanced Status Bar */}
        <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border border-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                currentTool === 'select' ? 'bg-blue-400' :
                currentTool === 'hand' ? 'bg-green-400' :
                currentTool === 'pen' ? 'bg-purple-400' :
                currentTool === 'brush' ? 'bg-orange-400' :
                currentTool === 'eraser' ? 'bg-pink-400' :
                'bg-yellow-400'
              }`} />
              <span className="font-semibold">
                {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
              </span>
              {isSpacePressed && <span className="text-xs opacity-75 bg-white/20 px-2 py-1 rounded">(Space)</span>}
              {tool === 'pen' && isDrawingPath && <span className="text-xs opacity-75 bg-purple-500/30 px-2 py-1 rounded">(Drawing)</span>}
              {tool === 'brush' && <span className="text-xs opacity-75 bg-orange-500/30 px-2 py-1 rounded">Size: {brushSettings.size}px</span>}
            </div>
            <div className="text-xs opacity-75 bg-white/10 px-2 py-1 rounded">
              Zoom: {Math.round(zoom * 100)}%
            </div>
            <div className="text-xs opacity-75 bg-white/10 px-2 py-1 rounded">
              Objects: {objects.length}
            </div>
            <div className="text-xs opacity-75 bg-white/10 px-2 py-1 rounded font-mono">
              Canvas: {canvasSize.width}×{canvasSize.height}
            </div>
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => onZoomChange(Math.min(5, zoom * 1.2))}
            className="w-12 h-12 bg-black/90 backdrop-blur-sm text-white rounded-xl hover:bg-black/95 transition-all duration-200 flex items-center justify-center text-lg font-bold shadow-xl border border-gray-600"
          >
            +
          </button>
          <button
            onClick={() => onZoomChange(Math.max(0.1, zoom * 0.8))}
            className="w-12 h-12 bg-black/90 backdrop-blur-sm text-white rounded-xl hover:bg-black/95 transition-all duration-200 flex items-center justify-center text-lg font-bold shadow-xl border border-gray-600"
          >
            −
          </button>
          <button
            onClick={() => onZoomChange(1)}
            className="w-12 h-12 bg-black/90 backdrop-blur-sm text-white rounded-xl hover:bg-black/95 transition-all duration-200 flex items-center justify-center text-xs font-bold shadow-xl border border-gray-600"
          >
            1:1
          </button>
        </div>
      </div>
    </div>
  );
};