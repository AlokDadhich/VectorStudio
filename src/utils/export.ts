import { CanvasObject, Layer, Gradient } from '../types';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'svg' | 'png' | 'jpg' | 'pdf' | 'webp' | 'ai';
  quality?: number;
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
}

export const generateSVG = (layers: Layer[], canvasSize: { width: number; height: number }): string => {
  const svgElements = layers
    .filter(layer => layer.visible)
    .flatMap(layer => 
      layer.objects
        .filter(obj => obj.visible)
        .map(obj => objectToSVG(obj))
    );

  const gradientDefs = layers
    .filter(layer => layer.visible)
    .flatMap(layer => 
      layer.objects
        .filter(obj => obj.visible && obj.style.gradient)
        .map(obj => generateGradientDef(obj.style.gradient!, `gradient-${obj.id}`))
    );

  return `
<svg width="${canvasSize.width}" height="${canvasSize.height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}">
  <defs>
    <style>
      .smooth-edges { 
        shape-rendering: geometricPrecision; 
        text-rendering: optimizeLegibility;
      }
    </style>
    ${gradientDefs.join('\n    ')}
  </defs>
  ${svgElements.join('\n  ')}
</svg>`.trim();
};

const generateGradientDef = (gradient: Gradient, id: string): string => {
  if (gradient.type === 'linear') {
    const angle = gradient.angle || 0;
    const x1 = 50 + 50 * Math.cos((angle - 90) * Math.PI / 180);
    const y1 = 50 + 50 * Math.sin((angle - 90) * Math.PI / 180);
    const x2 = 50 + 50 * Math.cos((angle + 90) * Math.PI / 180);
    const y2 = 50 + 50 * Math.sin((angle + 90) * Math.PI / 180);
    
    return `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${gradient.stops.map(stop => 
        `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}" stop-opacity="${stop.opacity}" />`
      ).join('\n      ')}
    </linearGradient>`;
  } else {
    return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">
      ${gradient.stops.map(stop => 
        `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}" stop-opacity="${stop.opacity}" />`
      ).join('\n      ')}
    </radialGradient>`;
  }
};

const objectToSVG = (obj: CanvasObject): string => {
  const { transform, style } = obj;
  const transformStr = `translate(${transform.x},${transform.y}) rotate(${transform.rotation * 180 / Math.PI}) scale(${transform.scaleX},${transform.scaleY})`;
  const fillValue = style.gradient ? `url(#gradient-${obj.id})` : style.fill;
  const styleStr = `fill="${fillValue}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" opacity="${style.opacity}" fill-opacity="${style.fillOpacity}" stroke-opacity="${style.strokeOpacity}"`;

  switch (obj.type) {
    case 'rect':
      return `<rect x="0" y="0" width="${obj.width}" height="${obj.height}" rx="${obj.rx || 0}" ry="${obj.ry || 0}" ${styleStr} transform="${transformStr}" class="smooth-edges" />`;
    
    case 'circle':
      return `<circle cx="0" cy="0" r="${obj.radius}" ${styleStr} transform="${transformStr}" class="smooth-edges" />`;
    
    case 'line':
      return `<line x1="${obj.x1}" y1="${obj.y1}" x2="${obj.x2}" y2="${obj.y2}" ${styleStr} transform="${transformStr}" class="smooth-edges" />`;
    
    case 'text':
      return `<text x="0" y="0" font-family="${obj.fontFamily}" font-size="${obj.fontSize}" font-weight="${obj.fontWeight}" dominant-baseline="central" ${styleStr} transform="${transformStr}" class="smooth-edges">${obj.content}</text>`;
    
    case 'path':
      const pathData = obj.points.length > 0 ? 
        `M ${obj.points[0].x} ${obj.points[0].y} ` + 
        obj.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        (obj.closed ? ' Z' : '') : '';
      return `<path d="${pathData}" ${styleStr} transform="${transformStr}" class="smooth-edges" />`;
    
    case 'image':
      return `<image x="0" y="0" width="${obj.width}" height="${obj.height}" href="${obj.src}" ${styleStr} transform="${transformStr}" class="smooth-edges" />`;
    
    default:
      return '';
  }
};

export const exportCanvas = async (
  layers: Layer[], 
  canvasSize: { width: number; height: number }, 
  options: ExportOptions
): Promise<string> => {
  const { format, quality = 0.9, width, height, scale = 1, backgroundColor = 'white' } = options;
  
  const exportWidth = width || canvasSize.width * scale;
  const exportHeight = height || canvasSize.height * scale;

  switch (format) {
    case 'svg':
      return exportSVG(layers, canvasSize);
    
    case 'png':
    case 'jpg':
    case 'webp':
      return exportRaster(layers, canvasSize, format, quality, exportWidth, exportHeight, backgroundColor);
    
    case 'pdf':
      return exportPDF(layers, canvasSize, exportWidth, exportHeight);
    
    case 'ai':
      return exportAI(layers, canvasSize);
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

const exportSVG = (layers: Layer[], canvasSize: { width: number; height: number }): string => {
  const svgString = generateSVG(layers, canvasSize);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
};

const exportRaster = async (
  layers: Layer[], 
  canvasSize: { width: number; height: number }, 
  format: 'png' | 'jpg' | 'webp',
  quality: number,
  width: number,
  height: number,
  backgroundColor: string
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (format === 'jpg') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const svgString = generateSVG(layers, canvasSize);
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      
      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    img.src = url;
  });
};

const exportPDF = async (
  layers: Layer[], 
  canvasSize: { width: number; height: number },
  width: number,
  height: number
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height]
  });

  const svgString = generateSVG(layers, canvasSize);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;

  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      URL.revokeObjectURL(url);
      resolve(pdfUrl);
    };

    img.src = url;
  });
};

const exportAI = (layers: Layer[], canvasSize: { width: number; height: number }): string => {
  const aiData = {
    version: '1.0',
    application: 'Graphite Editor Clone',
    created: new Date().toISOString(),
    canvasSize,
    layers: layers.map(layer => ({
      ...layer,
      objects: layer.objects.map(obj => ({
        ...obj,
        metadata: {
          created: new Date().toISOString(),
          type: obj.type,
          editable: true,
          hasGradient: !!obj.style.gradient
        }
      }))
    })),
    svg: generateSVG(layers, canvasSize)
  };

  const blob = new Blob([JSON.stringify(aiData, null, 2)], { type: 'application/json' });
  return URL.createObjectURL(blob);
};

export const downloadFile = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const loadImageAsObject = (file: File): Promise<CanvasObject> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const imageObject: CanvasObject = {
          id: `img-${Date.now()}`,
          type: 'image',
          transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          style: {
            fill: 'none',
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
          src: e.target?.result as string,
          width: img.naturalWidth,
          height: img.naturalHeight,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight
        } as any;
        
        resolve(imageObject);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const parseSVGFile = (svgContent: string): CanvasObject[] => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  if (!svgElement) return [];
  
  const objects: CanvasObject[] = [];
  const elements = svgElement.querySelectorAll('rect, circle, line, text, path, image');
  
  elements.forEach((element, index) => {
    const obj = svgElementToObject(element, `svg-${Date.now()}-${index}`);
    if (obj) objects.push(obj);
  });
  
  return objects;
};

const svgElementToObject = (element: Element, id: string): CanvasObject | null => {
  const getAttr = (name: string, defaultValue: any = 0) => {
    const value = element.getAttribute(name);
    return value ? (isNaN(Number(value)) ? value : Number(value)) : defaultValue;
  };

  const transform = parseTransform(element.getAttribute('transform') || '');
  const style = {
    fill: getAttr('fill', '#000000'),
    stroke: getAttr('stroke', 'none'),
    strokeWidth: getAttr('stroke-width', 0),
    opacity: getAttr('opacity', 1),
    fillOpacity: getAttr('fill-opacity', 1),
    strokeOpacity: getAttr('stroke-opacity', 1),
    gradient: null
  };

  const baseObject = {
    id,
    transform,
    style,
    visible: true,
    locked: false,
    selected: false
  };

  switch (element.tagName.toLowerCase()) {
    case 'rect':
      return {
        ...baseObject,
        type: 'rect',
        width: getAttr('width', 100),
        height: getAttr('height', 100),
        rx: getAttr('rx'),
        ry: getAttr('ry')
      } as CanvasObject;
    
    case 'circle':
      return {
        ...baseObject,
        type: 'circle',
        radius: getAttr('r', 50)
      } as CanvasObject;
    
    case 'line':
      return {
        ...baseObject,
        type: 'line',
        x1: getAttr('x1'),
        y1: getAttr('y1'),
        x2: getAttr('x2'),
        y2: getAttr('y2')
      } as CanvasObject;
    
    case 'text':
      return {
        ...baseObject,
        type: 'text',
        content: element.textContent || 'Text',
        fontSize: getAttr('font-size', 16),
        fontFamily: getAttr('font-family', 'Arial'),
        fontWeight: getAttr('font-weight', 'normal')
      } as CanvasObject;
    
    default:
      return null;
  }
};

const parseTransform = (transformStr: string) => {
  const transform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  
  if (!transformStr) return transform;
  
  const translateMatch = transformStr.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const values = translateMatch[1].split(/[,\s]+/).map(Number);
    transform.x = values[0] || 0;
    transform.y = values[1] || 0;
  }
  
  const rotateMatch = transformStr.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    transform.rotation = (Number(rotateMatch[1]) || 0) * Math.PI / 180;
  }
  
  const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const values = scaleMatch[1].split(/[,\s]+/).map(Number);
    transform.scaleX = values[0] || 1;
    transform.scaleY = values[1] || values[0] || 1;
  }
  
  return transform;
};