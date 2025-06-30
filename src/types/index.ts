export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface GradientStop {
  offset: number;
  color: string;
  opacity: number;
}

export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;
}

export interface StyleProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fillOpacity: number;
  strokeOpacity: number;
  gradient?: Gradient | null;
}

export interface BaseObject {
  id: string;
  type: string;
  transform: Transform;
  style: StyleProperties;
  visible: boolean;
  locked: boolean;
  selected: boolean;
}

export interface RectObject extends BaseObject {
  type: 'rect';
  width: number;
  height: number;
  rx?: number;
  ry?: number;
}

export interface CircleObject extends BaseObject {
  type: 'circle';
  radius: number;
}

export interface PathObject extends BaseObject {
  type: 'path';
  points: Point[];
  closed: boolean;
}

export interface CurveObject extends BaseObject {
  type: 'curve';
  points: Point[];
  controlPoints: Point[];
  closed: boolean;
}

export interface TextObject extends BaseObject {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
}

export interface LineObject extends BaseObject {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export type CanvasObject = RectObject | CircleObject | PathObject | CurveObject | TextObject | LineObject | ImageObject;

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  objects: CanvasObject[];
}

export interface CanvasState {
  layers: Layer[];
  activeLayerId: string;
  selectedObjectIds: string[];
  zoom: number;
  pan: Point;
  tool: string;
  canvasSize: { width: number; height: number };
}

export interface HistoryState {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

export type Tool = 
  | 'select'
  | 'pen'
  | 'curve'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'brush'
  | 'eyedropper'
  | 'zoom'
  | 'hand'
  | 'polygon'
  | 'star'
  | 'triangle'
  | 'eraser';