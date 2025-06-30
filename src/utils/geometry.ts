import { Point, BoundingBox, CanvasObject } from '../types';

export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getBoundingBox = (obj: CanvasObject): BoundingBox => {
  const { transform } = obj;
  
  switch (obj.type) {
    case 'rect':
      return {
        x: transform.x,
        y: transform.y,
        width: obj.width * transform.scaleX,
        height: obj.height * transform.scaleY
      };
    case 'circle':
      const r = obj.radius * Math.max(transform.scaleX, transform.scaleY);
      return {
        x: transform.x - r,
        y: transform.y - r,
        width: r * 2,
        height: r * 2
      };
    case 'line':
      const minX = Math.min(obj.x1, obj.x2);
      const maxX = Math.max(obj.x1, obj.x2);
      const minY = Math.min(obj.y1, obj.y2);
      const maxY = Math.max(obj.y1, obj.y2);
      return {
        x: minX + transform.x,
        y: minY + transform.y,
        width: maxX - minX,
        height: maxY - minY
      };
    case 'path':
    case 'curve':
      if (obj.points.length === 0) {
        return { x: transform.x, y: transform.y, width: 0, height: 0 };
      }
      const xs = obj.points.map(p => p.x);
      const ys = obj.points.map(p => p.y);
      const minPX = Math.min(...xs);
      const maxPX = Math.max(...xs);
      const minPY = Math.min(...ys);
      const maxPY = Math.max(...ys);
      return {
        x: minPX + transform.x,
        y: minPY + transform.y,
        width: maxPX - minPX,
        height: maxPY - minPY
      };
    case 'text':
      // Approximate text bounding box
      const textWidth = (obj.content?.length || 0) * (obj.fontSize || 16) * 0.6;
      const textHeight = obj.fontSize || 16;
      return {
        x: transform.x,
        y: transform.y - textHeight / 2,
        width: textWidth,
        height: textHeight
      };
    case 'image':
      return {
        x: transform.x,
        y: transform.y,
        width: obj.width * transform.scaleX,
        height: obj.height * transform.scaleY
      };
    default:
      return { x: transform.x, y: transform.y, width: 100, height: 100 };
  }
};

export const pointInBoundingBox = (point: Point, box: BoundingBox): boolean => {
  return point.x >= box.x && 
         point.x <= box.x + box.width && 
         point.y >= box.y && 
         point.y <= box.y + box.height;
};

export const rotatePoint = (point: Point, center: Point, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
};

export const snapToGrid = (point: Point, gridSize: number = 10): Point => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
};