import { CanvasObject, Layer } from '../types';

export const generateSVG = (layers: Layer[], canvasSize: { width: number; height: number }): string => {
  const svgElements = layers
    .filter(layer => layer.visible)
    .flatMap(layer => 
      layer.objects
        .filter(obj => obj.visible)
        .map(obj => objectToSVG(obj))
    );

  return `
<svg width="${canvasSize.width}" height="${canvasSize.height}" xmlns="http://www.w3.org/2000/svg">
  ${svgElements.join('\n  ')}
</svg>`.trim();
};

const objectToSVG = (obj: CanvasObject): string => {
  const { transform, style } = obj;
  const transformStr = `translate(${transform.x},${transform.y}) rotate(${transform.rotation}) scale(${transform.scaleX},${transform.scaleY})`;
  const styleStr = `fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" opacity="${style.opacity}"`;

  switch (obj.type) {
    case 'rect':
      return `<rect x="0" y="0" width="${obj.width}" height="${obj.height}" rx="${obj.rx || 0}" ry="${obj.ry || 0}" ${styleStr} transform="${transformStr}" />`;
    
    case 'circle':
      return `<circle cx="0" cy="0" r="${obj.radius}" ${styleStr} transform="${transformStr}" />`;
    
    case 'line':
      return `<line x1="${obj.x1}" y1="${obj.y1}" x2="${obj.x2}" y2="${obj.y2}" ${styleStr} transform="${transformStr}" />`;
    
    case 'text':
      return `<text x="0" y="0" font-family="${obj.fontFamily}" font-size="${obj.fontSize}" font-weight="${obj.fontWeight}" ${styleStr} transform="${transformStr}">${obj.content}</text>`;
    
    case 'path':
      const pathData = obj.points.length > 0 ? 
        `M ${obj.points[0].x} ${obj.points[0].y} ` + 
        obj.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        (obj.closed ? ' Z' : '') : '';
      return `<path d="${pathData}" ${styleStr} transform="${transformStr}" />`;
    
    default:
      return '';
  }
};

export const exportToPNG = async (svgString: string, width: number, height: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(pngUrl);
    };

    img.src = url;
  });
};