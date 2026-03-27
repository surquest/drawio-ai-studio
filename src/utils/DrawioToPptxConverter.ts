import type pptxgen from 'pptxgenjs';
import { config } from "@/config";

export const CONVERTER_CONFIG = config.pptxConverter;

export class DrawioUtils {
    static colorToHex(color: string | null): string | null {
        if (!color) return null;
        if (color.startsWith('#')) return color.replace('#', '');
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                return ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1).toUpperCase();
            }
        }
        return color;
    }

    static normalizeImageDataURI(imageData: string | null): string | null {
        if (!imageData || !imageData.startsWith('data:')) return imageData;
        let commaIdx = imageData.indexOf(',');
        if (commaIdx > -1) {
            let prefix = imageData.substring(0, commaIdx);
            let dataPart = imageData.substring(commaIdx + 1);
            if (!prefix.includes(';base64') && !dataPart.includes('%')) {
                return prefix + ';base64,' + dataPart;
            }
        }
        return imageData;
    }

    static parseRichText(htmlString: string, baseStyle: any, scale: number): any[] {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        const textRuns: any[] = [];

        function traverse(node: Node, currentStyle: any) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent) {
                    textRuns.push({ text: node.textContent, options: { ...currentStyle } });
                }
                return;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                let newStyle = { ...currentStyle };
                
                if (el.tagName === 'B' || el.tagName === 'STRONG') newStyle.bold = true;
                if (el.tagName === 'I' || el.tagName === 'EM') newStyle.italic = true;
                if (el.tagName === 'U') newStyle.underline = true;
                
                if (el.tagName === 'BR') {
                    textRuns.push({ text: '\n', options: { ...newStyle } });
                    return;
                }

                if (el.hasAttribute('face')) newStyle.fontFace = el.getAttribute('face');
                if (el.hasAttribute('color')) newStyle.color = DrawioUtils.colorToHex(el.getAttribute('color'));

                if (el.style.fontFamily) newStyle.fontFace = el.style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
                if (el.style.color) {
                    let hex = DrawioUtils.colorToHex(el.style.color);
                    if (hex) newStyle.color = hex;
                }
                if (el.style.fontSize) {
                    let size = parseFloat(el.style.fontSize);
                    if (!isNaN(size)) newStyle.fontSize = size * scale;
                }
                if (el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 600) newStyle.bold = true;
                if (el.style.fontStyle === 'italic') newStyle.italic = true;
                if (el.style.textDecoration && el.style.textDecoration.includes('underline')) newStyle.underline = true;

                Array.from(el.childNodes).forEach(child => traverse(child, newStyle));
                
                let isBlock = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName);
                if (isBlock && el.nextSibling) {
                    textRuns.push({ text: '\n', options: { ...newStyle } });
                }
            }
        }

        traverse(tempDiv, baseStyle);
        if (textRuns.length === 0) return [{ text: '', options: baseStyle }];
        return textRuns;
    }

    static parseStyle(styleStr: string | null): Record<string, string | boolean> {
        if (!styleStr) return {};
        const parts = styleStr.split(';');
        const styleObj: Record<string, string | boolean> = {};
        parts.forEach(p => {
            const idx = p.indexOf('=');
            if (idx > -1) {
                styleObj[p.substring(0, idx)] = p.substring(idx + 1);
            } else if (p) {
                styleObj[p] = true;
            }
        });
        return styleObj;
    }

    static getArrowType(drawioArrow: string | null): string {
        if (!drawioArrow || drawioArrow === 'none') return 'none';
        const type = drawioArrow.toLowerCase();
        if (type.includes('classic') || type.includes('block')) return 'triangle';
        if (type.includes('open')) return 'arrow';
        if (type.includes('diamond')) return 'diamond';
        if (type.includes('oval')) return 'oval';
        return 'triangle';
    }

    static getPerimeterPoint(box: any, nextPoint: any, shapeType: string | undefined): {x: number, y: number} {
        let cx = box.x + box.w / 2;
        let cy = box.y + box.h / 2;
        let dx = nextPoint.x - cx;
        let dy = nextPoint.y - cy;

        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        if (shapeType === 'ellipse') {
            let a = box.w / 2;
            let b = box.h / 2;
            if (a === 0 || b === 0) return { x: cx, y: cy };
            let t = 1 / Math.sqrt(Math.pow(dx/a, 2) + Math.pow(dy/b, 2));
            return { x: cx + t * dx, y: cy + t * dy };
        } else if (shapeType === 'rhombus') {
            let a = box.w / 2;
            let b = box.h / 2;
            if (a === 0 || b === 0) return { x: cx, y: cy };
            let t = 1 / (Math.abs(dx/a) + Math.abs(dy/b));
            return { x: cx + t * dx, y: cy + t * dy };
        } else {
            let t_x = Infinity, t_y = Infinity;
            if (dx > 0) t_x = (box.w / 2) / dx;
            else if (dx < 0) t_x = -(box.w / 2) / dx;
            if (dy > 0) t_y = (box.h / 2) / dy;
            else if (dy < 0) t_y = -(box.h / 2) / dy;
            let t = Math.min(t_x, t_y);
            return { x: cx + t * dx, y: cy + t * dy };
        }
    }

    static getTextHtml(textContent: any[], defaultAlign: string | undefined, defaultValign: string | undefined): string {
        let justifyMap: any = { 'left': 'flex-start', 'center': 'center', 'right': 'flex-end' };
        let alignMap: any = { 'top': 'flex-start', 'middle': 'center', 'bottom': 'flex-end' };
        let flexJ = alignMap[defaultValign || 'middle']; 
        let flexA = justifyMap[defaultAlign || 'center'];

        let html = `<div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; width:100%; height:100%; flex-direction:column; justify-content:${flexJ}; align-items:${flexA}; text-align:${defaultAlign || 'center'}; box-sizing:border-box; padding:4px;">`;
        html += `<div style="max-width:100%;">`; 
        
        textContent.forEach(run => {
            if (run.text === '\n') { html += `<br/>`; return; }
            let opts = run.options || {};
            let style = `font-family:'${opts.fontFace || CONVERTER_CONFIG.defaults.fontFamily}', sans-serif; `;
            if (opts.fontSize) style += `font-size:${opts.fontSize}px; `; 
            if (opts.color) style += `color:#${opts.color}; `;
            if (opts.bold) style += `font-weight:bold; `;
            if (opts.italic) style += `font-style:italic; `;
            if (opts.underline) style += `text-decoration:underline; `;
            
            let safeText = run.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += `<span style="${style}">${safeText}</span>`;
        });
        html += `</div></div>`;
        return html;
    }
}

export class DrawioToPptxConverter {
    config: any;
    pptx: pptxgen;
    slide: any;
    shapeDict: Record<string, any>;
    svgBody: string;
    svgDefs: string;
    svgMarkersMap: Set<string>;
    scale: number;
    offsetX: number;
    offsetY: number;
    minX: number;
    minY: number;

    static async create(config = CONVERTER_CONFIG): Promise<DrawioToPptxConverter> {
        // We import the browser bundle directly to avoid turbopack issues with node:https
        // const PptxGenJslib = (await import('pptxgenjs/dist/pptxgen.bundle.js')).default;
        const PptxGenJS = (await import('pptxgenjs')).default;
        return new DrawioToPptxConverter(PptxGenJS, config);
    }
    
    constructor(PptxGenJsClass: any, config = CONVERTER_CONFIG) {
        this.config = config;
        this.pptx = new PptxGenJsClass();
        this.slide = this.pptx.addSlide();
        this.shapeDict = {};
        this.svgBody = '';
        this.svgDefs = '<defs>';
        this.svgMarkersMap = new Set();
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minX = 0;
        this.minY = 0;
        
        this.pptx.defineLayout({name:"CUSTOM", width: this.config.slideWidth, height: this.config.slideHeight});
        this.pptx.layout = "CUSTOM";
    }

    processXml(xmlText: string) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        if (xmlDoc.querySelector("parsererror")) throw new Error("Invalid XML formatting.");
        if (xmlText.startsWith("<mxfile") && !xmlDoc.querySelector('mxGraphModel')) {
            throw new Error("Detected compressed Draw.io XML. Please export as Uncompressed XML.");
        }

        const cells = Array.from(xmlDoc.querySelectorAll('mxCell'));
        if (cells.length === 0) throw new Error("No shapes found. Ensure you pasted a valid mxGraphModel XML.");

        this._calculateBoundsAndSetup(cells);

        cells.forEach(cell => {
            const isVertex = cell.getAttribute('vertex') === '1';
            const isEdge = cell.getAttribute('edge') === '1';

            if (isVertex) this._processVertex(cell);
            else if (isEdge) this._processEdge(cell);
        });

        this.svgDefs += '</defs>';
        const finalSvg = `<svg width="100%" height="100%" viewBox="0 0 ${this.config.slideWidth * this.config.previewDpi} ${this.config.slideHeight * this.config.previewDpi}" xmlns="http://www.w3.org/2000/svg" style="background-color: #ffffff;">${this.svgDefs}${this.svgBody}</svg>`;

        return {
            pptx: this.pptx,
            svgHtml: finalSvg
        };
    }

    _calculateBoundsAndSetup(cells: Element[]) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        cells.forEach(cell => {
            if (cell.getAttribute('vertex') === '1') {
                let geo = cell.querySelector('mxGeometry');
                if (geo) {
                    let x = parseFloat(geo.getAttribute('x') || "0");
                    let y = parseFloat(geo.getAttribute('y') || "0");
                    let w = parseFloat(geo.getAttribute('width') || "0");
                    let h = parseFloat(geo.getAttribute('height') || "0");
                    
                    this.shapeDict[cell.getAttribute('id') || ''] = { 
                        x, y, w, h, cell,
                        style: DrawioUtils.parseStyle(cell.getAttribute('style'))
                    };

                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x + w > maxX) maxX = x + w;
                    if (y + h > maxY) maxY = y + h;
                }
            }
        });

        if (minX === Infinity) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

        const availableW = this.config.slideWidth - (this.config.slideMargin * 2);
        const availableH = this.config.slideHeight - (this.config.slideMargin * 2);
        const diagramW = (maxX - minX) / this.config.previewDpi;
        const diagramH = (maxY - minY) / this.config.previewDpi;
        
        this.scale = Math.min(availableW / diagramW, availableH / diagramH);
        if (this.scale > 1) this.scale = 1;

        this.offsetX = (this.config.slideWidth - diagramW * this.scale) / 2;
        this.offsetY = (this.config.slideHeight - diagramH * this.scale) / 2;
        this.minX = minX;
        this.minY = minY;
    }

    scalePx(px: number) { return ((px - this.minX) / this.config.previewDpi) * this.scale + this.offsetX; }
    scalePy(py: number) { return ((py - this.minY) / this.config.previewDpi) * this.scale + this.offsetY; }
    scaleDim(dim: number) { return (dim / this.config.previewDpi) * this.scale; }

    _getSvgMarker(color: string, isStart: boolean) {
        let hex = color === 'transparent' || color === 'none' ? '000000' : color.replace('#','');
        let id = `arrow-${isStart ? 'start' : 'end'}-${hex}`;
        if (!this.svgMarkersMap.has(id)) {
            this.svgMarkersMap.add(id);
            let path = isStart ? `M 10 0 L 0 5 L 10 10 z` : `M 0 0 L 10 5 L 0 10 z`;
            let refX = isStart ? 0 : 10;
            this.svgDefs += `<marker id="${id}" viewBox="0 0 10 10" refX="${refX}" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="${path}" fill="#${hex}"/></marker>`;
        }
        return `url(#${id})`;
    }

    _extractTextContent(cell: Element, style: any) {
        let baseTextOpts: any = {
            fontFace: style.fontFamily || this.config.defaults.fontFamily,
            fontSize: parseFloat(style.fontSize || this.config.defaults.fontSize) * this.scale * this.config.fontSizeScaler,
            color: (style.fontColor || this.config.defaults.fontColor).replace('#', '')
        };
        
        let fontStyleBitmask = parseInt(style.fontStyle || "0");
        if (fontStyleBitmask & 1) baseTextOpts.bold = true;
        if (fontStyleBitmask & 2) baseTextOpts.italic = true;
        if (fontStyleBitmask & 4) baseTextOpts.underline = true;

        let rawValue = cell.getAttribute('value') || '';
        let textContent = (style.html === '1' || rawValue.includes('<')) 
                            ? DrawioUtils.parseRichText(rawValue, baseTextOpts, this.scale * this.config.fontSizeScaler)
                            : [{ text: rawValue, options: baseTextOpts }];

        return { rawValue, textContent };
    }

    _processVertex(cell: Element) {
        let cellId = cell.getAttribute('id') || '';
        const sData = this.shapeDict[cellId];
        if (!sData) return;

        const style = DrawioUtils.parseStyle(cell.getAttribute('style'));
        const { rawValue, textContent } = this._extractTextContent(cell, style);

        let isImage = style.shape === 'image' && style.image;

        let cornerRadiusPx = 0;
        let pptxShape = this.pptx.ShapeType.rect;
        
        if (style.shape === 'ellipse') pptxShape = this.pptx.ShapeType.ellipse;
        else if (style.shape === 'rhombus') pptxShape = this.pptx.ShapeType.diamond;
        else if (style.shape === 'cylinder') pptxShape = this.pptx.ShapeType.can;
        else if (style.shape === 'cloud') pptxShape = this.pptx.ShapeType.cloud;
        else if (style.shape === 'triangle') pptxShape = this.pptx.ShapeType.triangle;
        else if (style.shape === 'hexagon') pptxShape = this.pptx.ShapeType.hexagon;
        
        if (style.rounded === '1') {
            if (pptxShape === this.pptx.ShapeType.rect) pptxShape = this.pptx.ShapeType.roundRect;
            let arcSize = parseFloat((style.arcSize as string) || "15");
            let minDim = Math.min(sData.w, sData.h) * this.scale;
            let radiusPx = style.absoluteArcSize === '1' ? arcSize * this.scale : minDim * (arcSize / 100);
            cornerRadiusPx = Math.min(radiusPx, this.config.maxEdgeRound);
        }

        let shapeOpts: any = {
            x: this.scalePx(sData.x), y: this.scalePy(sData.y),
            w: this.scaleDim(sData.w), h: this.scaleDim(sData.h),
            shape: pptxShape,
            align: style.align || 'center',
            valign: style.verticalAlign || 'middle'
        };

        if (cornerRadiusPx > 0) {
            let maxPossibleRadius = Math.min(shapeOpts.w, shapeOpts.h) * this.config.previewDpi / 2;
            shapeOpts.rectRadius = Math.min(1.0, cornerRadiusPx / maxPossibleRadius);
        }

        if (style.fillColor && style.fillColor !== 'none') {
            shapeOpts.fill = { color: (style.fillColor as string).replace('#', '') };
        } else {
            shapeOpts.fill = { color: 'FFFFFF', transparency: 100 };
        }

        if (style.strokeColor && style.strokeColor !== 'none') {
            shapeOpts.line = { 
                color: (style.strokeColor as string).replace('#', ''), 
                width: parseFloat((style.strokeWidth as string) || String(this.config.defaults.strokeWidth)) * this.scale
            };
            if(style.dashed === '1') shapeOpts.line.dashType = 'dash';
        } else if (style.strokeColor === 'none') {
            shapeOpts.line = { type: 'none' };
        } else {
            if (rawValue !== "") shapeOpts.line = { type: 'none' };
            else shapeOpts.line = { color: this.config.defaults.defaultLineColor, width: this.config.defaults.strokeWidth * this.scale };
        }

        if (isImage) {
            let imageData = DrawioUtils.normalizeImageDataURI(style.image as string);
            if (imageData) {
                 if (imageData.startsWith('data:')) {
                     this.slide.addImage({ data: imageData, x: shapeOpts.x, y: shapeOpts.y, w: shapeOpts.w, h: shapeOpts.h });
                 } else {
                     this.slide.addImage({ path: imageData, x: shapeOpts.x, y: shapeOpts.y, w: shapeOpts.w, h: shapeOpts.h });
                 }
            }

            let overlayOpts = { ...shapeOpts, fill: { type: 'none' } };
            let hasBorder = overlayOpts.line && overlayOpts.line.type !== 'none';
            let hasText = textContent.length > 0 && (textContent.length > 1 || textContent[0].text !== '');
            
            if (hasBorder || hasText) {
                this.slide.addText(hasText ? textContent : '', overlayOpts);
            }
        } else {
            this.slide.addText(textContent, shapeOpts);
        }

        this._renderSvgVertex(shapeOpts, pptxShape, cornerRadiusPx, textContent, style, !!isImage);
    }

    _renderSvgVertex(shapeOpts: any, pptxShape: any, cornerRadiusPx: number, textContent: any[], style: any, isImage: boolean) {
        let pxX = shapeOpts.x * this.config.previewDpi;
        let pxY = shapeOpts.y * this.config.previewDpi;
        let pxW = shapeOpts.w * this.config.previewDpi;
        let pxH = shapeOpts.h * this.config.previewDpi;
        
        let svgFill = shapeOpts.fill && shapeOpts.fill.color ? '#' + shapeOpts.fill.color : 'transparent';
        if(shapeOpts.fill && shapeOpts.fill.color === 'FFFFFF' && shapeOpts.fill.transparency !== 100) svgFill = '#FFFFFF';
        if(shapeOpts.fill && shapeOpts.fill.transparency === 100) svgFill = 'transparent';
        
        let svgStroke = shapeOpts.line && shapeOpts.line.color ? '#' + shapeOpts.line.color : 'transparent';
        let svgStrokeWidth = shapeOpts.line && shapeOpts.line.width ? shapeOpts.line.width : 1;
        let svgDash = shapeOpts.line && shapeOpts.line.dashType === 'dash' ? '5,5' : 'none';
        if (shapeOpts.line && shapeOpts.line.type === 'none') { svgStroke = 'transparent'; svgStrokeWidth = 0; }

        let shapeSvg = '';
        if (isImage) {
            let href = DrawioUtils.normalizeImageDataURI(style.image as string)?.replace(/&/g, '&amp;').replace(/"/g, '&quot;') || '';
            shapeSvg = `<image href="${href}" x="${pxX}" y="${pxY}" width="${pxW}" height="${pxH}" preserveAspectRatio="none" />`;
            
            if (svgStroke !== 'transparent' && svgStrokeWidth > 0) {
                shapeSvg += `<rect x="${pxX}" y="${pxY}" width="${pxW}" height="${pxH}" fill="none" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
            }
        } else if (pptxShape === this.pptx.ShapeType.ellipse) {
            shapeSvg = `<ellipse cx="${pxX+pxW/2}" cy="${pxY+pxH/2}" rx="${pxW/2}" ry="${pxH/2}" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
        } else if (pptxShape === this.pptx.ShapeType.diamond) {
            shapeSvg = `<polygon points="${pxX+pxW/2},${pxY} ${pxX+pxW},${pxY+pxH/2} ${pxX+pxW/2},${pxY+pxH} ${pxX},${pxY+pxH/2}" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
        } else if (pptxShape === this.pptx.ShapeType.triangle) {
            shapeSvg = `<polygon points="${pxX+pxW/2},${pxY} ${pxX+pxW},${pxY+pxH} ${pxX},${pxY+pxH}" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
        } else if (pptxShape === this.pptx.ShapeType.hexagon) {
            shapeSvg = `<polygon points="${pxX+pxW/4},${pxY} ${pxX+pxW*3/4},${pxY} ${pxX+pxW},${pxY+pxH/2} ${pxX+pxW*3/4},${pxY+pxH} ${pxX+pxW/4},${pxY+pxH} ${pxX},${pxY+pxH/2}" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
        } else if (pptxShape === this.pptx.ShapeType.roundRect) {
            shapeSvg = `<rect x="${pxX}" y="${pxY}" width="${pxW}" height="${pxH}" rx="${cornerRadiusPx}" ry="${cornerRadiusPx}" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
        } else {
            shapeSvg = `<rect x="${pxX}" y="${pxY}" width="${pxW}" height="${pxH}" fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" />`;
        }

        let textSvg = '';
        if (textContent.length > 0 && (textContent.length > 1 || textContent[0].text !== '')) {
            textSvg = `<foreignObject x="${pxX}" y="${pxY}" width="${pxW}" height="${pxH}">${DrawioUtils.getTextHtml(textContent, shapeOpts.align, shapeOpts.valign)}</foreignObject>`;
        }

        this.svgBody += shapeSvg + textSvg;
    }

    _processEdge(cell: Element) {
        const style = DrawioUtils.parseStyle(cell.getAttribute('style'));
        const { rawValue, textContent } = this._extractTextContent(cell, style);

        let sourceId = cell.getAttribute('source');
        let targetId = cell.getAttribute('target');
        let geo = cell.querySelector('mxGeometry');

        let sBox = sourceId && this.shapeDict[sourceId] ? this.shapeDict[sourceId] : null;
        let tBox = targetId && this.shapeDict[targetId] ? this.shapeDict[targetId] : null;

        let sCenter = sBox ? { x: sBox.x + sBox.w / 2, y: sBox.y + sBox.h / 2 } : null;
        let tCenter = tBox ? { x: tBox.x + tBox.w / 2, y: tBox.y + tBox.h / 2 } : null;

        let pts: {x: number, y: number}[] = [];
        let geoSp = null, geoTp = null;

        if (geo) {
            let arr = geo.querySelector('Array[as="points"]');
            if (arr) {
                let mPts = arr.querySelectorAll('mxPoint');
                mPts.forEach(p => pts.push({ x: parseFloat(p.getAttribute('x')||"0"), y: parseFloat(p.getAttribute('y')||"0") }));
            }
            geoSp = geo.querySelector('mxPoint[as="sourcePoint"]');
            geoTp = geo.querySelector('mxPoint[as="targetPoint"]');
        }

        let rawSp = geoSp ? { x: parseFloat(geoSp.getAttribute('x')||"0"), y: parseFloat(geoSp.getAttribute('y')||"0") } : null;
        let rawTp = geoTp ? { x: parseFloat(geoTp.getAttribute('x')||"0"), y: parseFloat(geoTp.getAttribute('y')||"0") } : null;

        let sp, tp;

        if (sBox) {
            if (style.exitX !== undefined && style.exitY !== undefined) {
                sp = {
                    x: sBox.x + sBox.w * parseFloat(style.exitX as string) + (parseFloat(style.exitDx as string) || 0),
                    y: sBox.y + sBox.h * parseFloat(style.exitY as string) + (parseFloat(style.exitDy as string) || 0)
                };
            } else {
                let nextPt = pts.length > 0 ? pts[0] : (tCenter || rawTp);
                sp = nextPt ? DrawioUtils.getPerimeterPoint(sBox, nextPt, sBox.style.shape) : sCenter;
            }
        } else if (rawSp) sp = rawSp;

        if (tBox) {
            if (style.entryX !== undefined && style.entryY !== undefined) {
                tp = {
                    x: tBox.x + tBox.w * parseFloat(style.entryX as string) + (parseFloat(style.entryDx as string) || 0),
                    y: tBox.y + tBox.h * parseFloat(style.entryY as string) + (parseFloat(style.entryDy as string) || 0)
                };
            } else {
                let prevPt = pts.length > 0 ? pts[pts.length - 1] : (sp || rawSp);
                tp = prevPt ? DrawioUtils.getPerimeterPoint(tBox, prevPt, tBox.style.shape) : tCenter;
            }
        } else if (rawTp) tp = rawTp;

        let fullPts: any[] = [];
        if (sp) fullPts.push(sp);
        fullPts = fullPts.concat(pts);
        if (tp) fullPts.push(tp);

        if (fullPts.length >= 2) {
            for (let i = 0; i < fullPts.length - 1; i++) {
                let pA = fullPts[i], pB = fullPts[i+1];

                let finalSx = this.scalePx(pA.x), finalSy = this.scalePy(pA.y);
                let finalTx = this.scalePx(pB.x), finalTy = this.scalePy(pB.y);

                let boxX = Math.min(finalSx, finalTx), boxY = Math.min(finalSy, finalTy);
                let boxW = Math.max(Math.abs(finalTx - finalSx), 0.01), boxH = Math.max(Math.abs(finalTy - finalSy), 0.01);

                let flipV = finalSy > finalTy, flipH = finalSx > finalTx;

                let lineOpts: any = {
                    x: boxX, y: boxY, w: boxW, h: boxH,
                    flipV: flipV, flipH: flipH,
                    line: {
                        color: ((style.strokeColor as string) || this.config.defaults.strokeColor).replace('#', ''),
                        width: parseFloat((style.strokeWidth as string) || String(this.config.defaults.strokeWidth)) * this.scale
                    }
                };

                if (style.dashed === '1') lineOpts.line.dashType = 'dash';
                if (i === 0 && style.startArrow && style.startArrow !== 'none') lineOpts.line.beginArrowType = DrawioUtils.getArrowType(style.startArrow as string);
                if (i === fullPts.length - 2 && style.endArrow && style.endArrow !== 'none') lineOpts.line.endArrowType = DrawioUtils.getArrowType(style.endArrow as string);

                this.slide.addShape(this.pptx.ShapeType.line, lineOpts);
            }

            this._renderSvgEdge(style, rawValue, textContent, fullPts);
        }
    }

    _renderSvgEdge(style: any, rawValue: string, textContent: any[], fullPts: any[]) {
        let ptsPx = fullPts.map(p => `${this.scalePx(p.x) * this.config.previewDpi},${this.scalePy(p.y) * this.config.previewDpi}`).join(' ');
        let svgStroke = style.strokeColor && style.strokeColor !== 'none' ? '#' + style.strokeColor.replace('#', '') : '#000000';
        let svgStrokeWidth = style.strokeWidth ? parseFloat(style.strokeWidth) * this.scale : 1 * this.scale;
        let svgDash = style.dashed === '1' ? '5,5' : 'none';
        
        let markerStartAttr = '', markerEndAttr = '';
        if (style.startArrow && style.startArrow !== 'none') markerStartAttr = `marker-start="${this._getSvgMarker(svgStroke, true)}"`;
        if (style.endArrow && style.endArrow !== 'none') markerEndAttr = `marker-end="${this._getSvgMarker(svgStroke, false)}"`;

        this.svgBody += `<polyline points="${ptsPx}" fill="none" stroke="${svgStroke}" stroke-width="${svgStrokeWidth}" stroke-dasharray="${svgDash}" ${markerStartAttr} ${markerEndAttr} />`;

        if (rawValue) {
            let minX = Math.min(...fullPts.map(p => this.scalePx(p.x))) * this.config.previewDpi;
            let maxX = Math.max(...fullPts.map(p => this.scalePx(p.x))) * this.config.previewDpi;
            let minY = Math.min(...fullPts.map(p => this.scalePy(p.y))) * this.config.previewDpi;
            let maxY = Math.max(...fullPts.map(p => this.scalePy(p.y))) * this.config.previewDpi;
            
            let cx = minX + (maxX - minX) / 2, cy = minY + (maxY - minY) / 2;
            let lblW = 2 * this.config.previewDpi, lblH = 0.5 * this.config.previewDpi;
            let lblX = cx - (lblW / 2), lblY = cy - (lblH / 2);

            this.slide.addText(textContent, { x: lblX / this.config.previewDpi, y: lblY / this.config.previewDpi, w: 2, h: 0.5, align: 'center', valign: 'middle' });
            this.svgBody += `<foreignObject x="${lblX}" y="${lblY}" width="${lblW}" height="${lblH}">${DrawioUtils.getTextHtml(textContent, 'center', 'middle')}</foreignObject>`;
        }
    }
}
