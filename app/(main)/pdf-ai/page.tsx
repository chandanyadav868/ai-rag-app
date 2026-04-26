"use client";

import React, { useEffect, useState } from 'react'
import { FilePlus, Download, MoreVertical } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { GoogleGenAI, createPartFromUri, createUserContent } from '@google/genai'
import { Models } from '@/constant'
import Markdown from '@/components/Markdown'
import ModelSelect from '@/components/ModelSelect'

type ModalSpec =
    | { open: true; type: 'confirm'; title?: string; message?: string; onConfirm: () => void }
    | { open: true; type: 'input'; title?: string; message?: string; placeholder?: string; defaultValue?: string; onConfirm: (value?: string) => void }
    | { open: true; type: 'info'; title?: string; message?: string }
    | { open: false }

export default function PdfPage() {
    const [pdfFiles, setPdfFiles] = useState<any[]>([]);
    const [modal, setModal] = useState<ModalSpec>({ open: false });
    const [modalInput, setModalInput] = useState('');
    const [mergedBytes, setMergedBytes] = useState<Uint8Array | null>(null);
    const [mergedPreviewUrl, setMergedPreviewUrl] = useState<string | null>(null);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>(Models && Models.length ? Models[0].value : 'gemini-2.5-flash');
    const [insertGeneratedIntoPdf, setInsertGeneratedIntoPdf] = useState(false);
    const [openMoreIndex, setOpenMoreIndex] = useState<number | null>(null);
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);
        const SYSTEM_PROMPT = `You are a document-layout assistant that must produce visually formatted content intended for rendering with pdf-lib. ALWAYS respond with valid JSON only (no explanatory text, no markdown) that strictly follows the schema below. If you cannot fulfill the request, return {"error":"brief reason"}.

Schema:
{
    "pages": [
        {
            "size": { "width": number, "height": number },
            "margin": { "top": number, "right": number, "bottom": number, "left": number },
            "blocks": [
                {
                    "type": "text",
                    "align": "left"|"center"|"right"|"justify",
                    "lineHeight": number,
                    "spans": [
                        { "text": string, "font": "Helvetica"| "Helvetica-Bold" | "Helvetica-Oblique" | "Times-Roman" | "Courier" | string, "size": number, "color": "#RRGGBB", "bold": boolean, "italic": boolean, "opacity": number }
                    ]
                },
                { "type":"heading", "level": 1|2|3, "spans":[ ... ], "align":"left" },
                { "type":"image", "src":"data:image/png;base64,..." | "https://...", "width": number, "height": number, "x": number?, "y": number?, "fit":"contain"|"cover" },
                { "type":"list", "ordered": true|false, "items": [ { "spans": [ ... ] } ], "indent": number },
                { "type":"rule", "thickness": number, "color":"#RRGGBB" },
                { "type":"newline" }
            ],
            "flow": { "startY": number }
        }
    ]
}

Important rules:
- Output only JSON that exactly matches the schema. No extra fields, no prose.
- Use colors as hex '#RRGGBB' and opacity 0..1.
- Use StandardFonts names when possible. Units are PDF points (1 pt = 1/72 inch). A4 = 595.28 x 841.89 pts.
- Convert any styling (bold/italic/color) into 'spans' so renderer can apply them.
- If multi-page output is required, return multiple 'pages' entries.
`;

    // NOTE: Streaming parsing removed — server now returns final JSON reply.

    const extractTextFromGenAIObj = (obj: any) => {
        // Try common shapes: obj.reply.parts[].text or obj.raw.candidates[].content.parts[].text
        try {
            // 1) top-level parts (e.g. { parts: [{ text: '...' }] })
            if (obj?.parts && Array.isArray(obj.parts)) {
                return obj.parts.map((p: any) => (p && (p.text || (typeof p === 'string' ? p : ''))) || '').join('');
            }

            // 2) legacy reply.parts
            if (obj?.reply?.parts && Array.isArray(obj.reply.parts)) {
                return obj.reply.parts.map((p: any) => p.text || '').join('');
            }

            // 3) raw candidates (SDK v1 shape)
            if (obj?.raw?.candidates && Array.isArray(obj.raw.candidates)) {
                const texts: string[] = [];
                for (const c of obj.raw.candidates) {
                    if (c?.content?.parts && Array.isArray(c.content.parts)) texts.push(c.content.parts.map((p: any) => p.text || '').join(''));
                    else if (c?.content?.text) texts.push(c.content.text);
                }
                return texts.join('\n');
            }

            // 4) candidates array (other SDK shapes)
            if (obj?.candidates && Array.isArray(obj.candidates)) {
                const texts: string[] = [];
                for (const c of obj.candidates) {
                    if (c?.message?.content?.parts && Array.isArray(c.message.content.parts)) texts.push(c.message.content.parts.map((p: any) => p.text || '').join(''));
                    else if (c?.text) texts.push(c.text);
                }
                if (texts.length) return texts.join('\n');
            }
            // If the SDK returned a JSON string, try parsing it and extracting text
            if (typeof obj === 'string') {
                const s = obj.trim();
                if (s.startsWith('{') || s.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(s);
                        return extractTextFromGenAIObj(parsed);
                    } catch (e) {
                        // fallthrough to returning raw string
                    }
                }
                return s;
            }

            // fallback to text-like properties
            if (obj?.text) return obj.text;
            // last resort: stringify
            try { return JSON.stringify(obj); } catch { return String(obj); }
        } catch (e) {
            return '';
        }
    };

        const SYSTEM_PROMPT_RENDER = `You are a converter assistant: receive an LLM assistant response (may include markdown, lists, headings, images, code blocks, or raw prose) and OUTPUT ONLY valid JSON that exactly matches the layout schema below for rendering with pdf-lib. Do NOT output any prose, explanations, or code fences — only the JSON object. If you cannot convert, return {"error":"brief reason"}.

    Schema: (same as above, produce pages/blocks/spans/images/lists/rule/newline)

    Rules:
    - Preserve headings, lists, bold, italic, code blocks as spans with appropriate font/size markers.
    - Convert markdown headings (#, ##) to blocks with type "heading" and level 1/2/3.
    - Convert lists into {type:"list", ordered: true|false, items:[{spans:[...] }] }.
    - For images, if a URL or data URI is present, place as {type:'image', src: '...', width:, height:, x?, y?}.
    - Use StandardFonts names where possible (Helvetica, Helvetica-Bold, Times-Roman, Courier).
    - Use color hex strings like '#RRGGBB' and opacity 0..1.
    - Units: PDF points (1/72 inch). A sensible default page is A4 (595.28x841.89).

`;

    const SYSTEM_PROMPT_HTML = `You are a converter assistant. Receive the assistant message (which may include markdown, lists, headings, images, code blocks, or raw prose) and CONVERT IT INTO A STANDALONE HTML DOCUMENT (including minimal CSS) that when rendered by the html2pdf.js library will produce a beautiful, print-ready PDF page or pages. Output ONLY the HTML (no JSON, no prose, no markdown fences). The HTML should be self-contained: inline styles or embedded <style> are preferred. Make conservative choices that work well with html2pdf.js and html2canvas (use web-safe fonts, avoid external resources when possible, embed images as data URLs if the original message contained data URIs). Ensure reasonable page sizing for A4 (595.28x841.89 points) and include CSS page-break rules for multi-page content. DO NOT include any surrounding comments or explanatory text.`;

    useEffect(() => {
        return () => {
            try { if (mergedPreviewUrl) URL.revokeObjectURL(mergedPreviewUrl); } catch { }
        };
    }, [mergedPreviewUrl]);

    const showModal = (spec: ModalSpec) => {
        setModal(spec);
        if (spec.open && spec.type === 'input') setModalInput(spec.defaultValue ?? '');
    };
    const closeModal = () => setModal({ open: false });

    const downloadArrayBuffer = async (data: Uint8Array | ArrayBuffer, name = 'file.pdf') => {
        try {
            const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
            const blob = new Blob([uint8.buffer as ArrayBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed', err);
            showModal({ open: true, type: 'info', title: 'Error', message: 'Download failed' });
        }
    };

    const generateMergedPreview = async (files: any[]) => {
        try {
            if (!files || files.length === 0) {
                if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }
                setMergedBytes(null);
                setMergedPreviewUrl(null);
                return;
            }
            const merged = await PDFDocument.create();
            for (const p of files) {
                const donor = await PDFDocument.load(p.arrayBuffer instanceof Uint8Array ? p.arrayBuffer : p.arrayBuffer);
                const indices = Array.from({ length: donor.getPageCount() }, (_, i) => i);
                const copied = await merged.copyPages(donor, indices);
                copied.forEach((cp) => merged.addPage(cp));
            }
            const bytes = await merged.save();
            setMergedBytes(new Uint8Array(bytes));
            if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedPreviewUrl(url);
        } catch (err) {
            console.error('Merge preview failed', err);
            showModal({ open: true, type: 'info', title: 'Error', message: 'Failed to create preview' });
        }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files) return;
        const arr = Array.from(files);
        const loaded: any[] = [];
        for (const f of arr) {
            try {
                const ab = await f.arrayBuffer();
                const doc = await PDFDocument.load(ab);
                loaded.push({ id: `${f.name}-${Date.now()}`, file: f, name: f.name, arrayBuffer: ab, pageCount: doc.getPageCount(), previewUrl: undefined, insertPos: 1 });
            } catch (err) {
                console.error('Failed to load PDF', err);
                showModal({ open: true, type: 'info', title: 'Error', message: `Failed to load ${f.name}` });
            }
        }
        if (loaded.length) {
            const newFiles = [...pdfFiles, ...loaded];
            setPdfFiles(newFiles);
            await generateMergedPreview(newFiles);
        }
    };

    const removeFile = (id: string) => {
        const idx = pdfFiles.findIndex((x) => x.id === id);
        if (idx === -1) return;
        const newFiles = pdfFiles.slice(0, idx).concat(pdfFiles.slice(idx + 1));
        setPdfFiles(newFiles);
        generateMergedPreview(newFiles);
    };

    const handleMergeAll = async () => {
        if (!mergedBytes) return showModal({ open: true, type: 'info', title: 'No PDFs', message: 'No PDFs to merge' });
        await downloadArrayBuffer(mergedBytes, 'merged.pdf');
        showModal({ open: true, type: 'info', title: 'Merged', message: 'Merged PDF downloaded' });
    };

    const handleSplitMerged = async () => {
        if (!mergedBytes) return showModal({ open: true, type: 'info', title: 'No PDF', message: 'No merged PDF available' });
        const input = window.prompt('Enter page number to extract');
        if (!input) return;
        const pageNum = parseInt(input, 10);
        if (isNaN(pageNum) || pageNum < 1) return showModal({ open: true, type: 'info', title: 'Invalid', message: 'Invalid page number' });
        try {
            const donor = await PDFDocument.load(mergedBytes);
            const newDoc = await PDFDocument.create();
            const [copied] = await newDoc.copyPages(donor, [pageNum - 1]);
            newDoc.addPage(copied);
            const bytes = await newDoc.save();
            await downloadArrayBuffer(bytes, `merged-page-${pageNum}.pdf`);
        } catch (err) {
            console.error(err);
            showModal({ open: true, type: 'info', title: 'Error', message: 'Split failed' });
        }
    };

    const handleWatermarkMerged = async () => {
        if (!mergedBytes) return showModal({ open: true, type: 'info', title: 'No PDF', message: 'No merged PDF available' });
        const text = window.prompt('Enter watermark text');
        if (!text) return;
        try {
            const pdfDoc = await PDFDocument.load(mergedBytes);
            const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();
            for (const page of pages) {
                const { width, height } = page.getSize();
                page.drawText(text, {
                    x: width * 0.08,
                    y: height * 0.5,
                    size: Math.min(72, Math.max(24, width / 8)),
                    font: helv,
                    color: rgb(1, 1, 1),
                    rotate: degrees(-30),
                    opacity: 0.12,
                });
            }
            const bytes = await pdfDoc.save();
            setMergedBytes(new Uint8Array(bytes));
            if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedPreviewUrl(url);
            showModal({ open: true, type: 'info', title: 'Done', message: 'Watermark added to merged PDF' });
        } catch (err) {
            console.error(err);
            showModal({ open: true, type: 'info', title: 'Error', message: 'Watermark failed' });
        }
    };

    const handleAddImageMerged = async (imgFile: File) => {
        if (!mergedBytes) return showModal({ open: true, type: 'info', title: 'No PDF', message: 'No merged PDF available' });
        try {
            const imgBytes = await imgFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(mergedBytes!);
            let embedded: any;
            if (imgFile.type.includes('png')) embedded = await pdfDoc.embedPng(imgBytes);
            else embedded = await pdfDoc.embedJpg(imgBytes);
            const pages = pdfDoc.getPages();
            for (const page of pages) {
                const { width, height } = page.getSize();
                const scale = Math.min((width * 0.4) / embedded.width, (height * 0.4) / embedded.height, 1);
                const dims = embedded.scale ? embedded.scale(scale) : { width: embedded.width * scale, height: embedded.height * scale };
                page.drawImage(embedded, {
                    x: width / 2 - dims.width / 2,
                    y: height / 2 - dims.height / 2,
                    width: dims.width,
                    height: dims.height,
                    opacity: 0.95,
                });
            }
            const bytes = await pdfDoc.save();
            setMergedBytes(new Uint8Array(bytes));
            if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { };
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedPreviewUrl(url);
            showModal({ open: true, type: 'info', title: 'Done', message: 'Image added to merged PDF' });
        } catch (err) {
            console.error(err);
            showModal({ open: true, type: 'info', title: 'Error', message: 'Add image failed' });
        }
    };

    const handleInsertBlankPageMerged = async () => {
        if (!mergedBytes) return showModal({ open: true, type: 'info', title: 'No PDF', message: 'No merged PDF available' });
        const pdfDoc = await PDFDocument.load(mergedBytes);
        const max = pdfDoc.getPageCount() + 1;
        showModal({
            open: true,
            type: 'input',
            title: 'Insert Blank Page',
            message: `Enter position to insert blank page (1-${max})`,
            placeholder: 'Position',
            defaultValue: '1',
            onConfirm: async (value?: string) => {
                if (!value) return;
                const pos = Number(value);
                if (isNaN(pos) || pos < 1 || pos > max) return showModal({ open: true, type: 'info', title: 'Invalid', message: `Invalid position (1-${max})` });
                try {
                    const doc = await PDFDocument.load(mergedBytes!);
                    let width = 595.28;
                    let height = 841.89;
                    const pages = doc.getPages();
                    if (pages.length) { const s = pages[0].getSize(); width = s.width; height = s.height; }
                    const insertIndex = Math.max(0, Math.min(pos - 1, doc.getPageCount()));
                    doc.insertPage(insertIndex, [width, height]);
                    const bytes = await doc.save();
                    setMergedBytes(new Uint8Array(bytes));
                    if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { };
                    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setMergedPreviewUrl(url);
                    showModal({ open: true, type: 'info', title: 'Done', message: 'Inserted blank page' });
                } catch (err) {
                    console.error(err);
                    showModal({ open: true, type: 'info', title: 'Error', message: 'Insert failed' });
                }
            },
        });
    };

    // Insert generated text as page(s) into the merged PDF.
    const insertGeneratedTextAsPage = async (text: string) => {
        try {
            let doc: any;
            if (mergedBytes) doc = await PDFDocument.load(mergedBytes);
            else doc = await PDFDocument.create();

            const pages = doc.getPages();
            let pageWidth = 595.28;
            let pageHeight = 841.89;
            if (pages.length) {
                const s = pages[0].getSize();
                pageWidth = s.width;
                pageHeight = s.height;
            }

            const helv = await doc.embedFont(StandardFonts.Helvetica);
            const fontSize = 12;
            const margin = 40;
            const maxWidth = pageWidth - margin * 2;
            const words = String(text).replace(/\r\n/g, '\n').split(/\s+/);

            const lines: string[] = [];
            let cur = '';
            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                const trial = cur ? cur + ' ' + w : w;
                const trialWidth = helv.widthOfTextAtSize(trial, fontSize);
                if (trialWidth > maxWidth && cur) {
                    lines.push(cur);
                    cur = w;
                } else {
                    cur = trial;
                }
            }
            if (cur) lines.push(cur);

            const lineHeight = fontSize * 1.3;
            let y = pageHeight - margin - fontSize;
            let currentPage: any = doc.addPage([pageWidth, pageHeight]);
            for (const line of lines) {
                if (y < margin + fontSize) {
                    // create new page
                    currentPage = doc.addPage([pageWidth, pageHeight]);
                    y = pageHeight - margin - fontSize;
                }
                currentPage.drawText(line, { x: margin, y, size: fontSize, font: helv, color: rgb(0, 0, 0) });
                y -= lineHeight;
            }

            const bytes = await doc.save();
            setMergedBytes(new Uint8Array(bytes));
            if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedPreviewUrl(url);
        } catch (err) {
            console.error('Insert generated text failed', err);
            throw err;
        }
    };

    // Render layout JSON (from model) into the merged PDF using pdf-lib
    const renderLayoutJsonToPdf = async (layout: any) => {
        try {
            if (!layout || !Array.isArray(layout.pages)) throw new Error('Invalid layout JSON');
            let doc: any;
            if (mergedBytes) doc = await PDFDocument.load(mergedBytes);
            else doc = await PDFDocument.create();

            // embed standard fonts
            const fonts: any = {};
            fonts.Helvetica = await doc.embedFont(StandardFonts.Helvetica);
            fonts['Helvetica-Bold'] = await doc.embedFont(StandardFonts.HelveticaBold || StandardFonts.Helvetica);
            fonts['Helvetica-Oblique'] = await doc.embedFont(StandardFonts.HelveticaOblique || StandardFonts.Helvetica);
            fonts['Times-Roman'] = await doc.embedFont(StandardFonts.TimesRoman);
            fonts['Courier'] = await doc.embedFont(StandardFonts.Courier);

            const hexToRgb = (hex: string) => {
                if (!hex || hex[0] !== '#') return { r: 0, g: 0, b: 0 };
                const bigint = parseInt(hex.slice(1), 16);
                const r = ((bigint >> 16) & 255) / 255;
                const g = ((bigint >> 8) & 255) / 255;
                const b = (bigint & 255) / 255;
                return { r, g, b };
            };

            for (const p of layout.pages) {
                const size = p.size || { width: 595.28, height: 841.89 };
                const margin = p.margin || { top: 40, right: 40, bottom: 40, left: 40 };
                const page = doc.addPage([size.width, size.height]);
                let cursorY = (p.flow && p.flow.startY) ? p.flow.startY : size.height - margin.top;

                const maxWidth = size.width - (margin.left + margin.right);
                for (const block of (p.blocks || [])) {
                    if (block.type === 'heading' || block.type === 'text') {
                        const lineHeight = block.lineHeight ?? 1.3 * ((block.spans && block.spans[0] && block.spans[0].size) || 12);
                        // assemble spans and wrap by words while preserving styles
                        let curLine = [] as any[]; // array of {span, text}
                        let curX = margin.left;
                        const pushLine = async () => {
                            // draw current line segments left->right
                            let x = margin.left;
                            for (const seg of curLine) {
                                const span = seg.span;
                                const text = seg.text;
                                const fontName = span.font || (span.bold ? 'Helvetica-Bold' : span.italic ? 'Helvetica-Oblique' : 'Helvetica');
                                const fontObj = fonts[fontName] || fonts['Helvetica'];
                                const size = span.size || 12;
                                const { r, g, b } = hexToRgb(span.color || '#000000');
                                page.drawText(text, { x, y: cursorY, size, font: fontObj, color: rgb(r, g, b), opacity: (span.opacity ?? 1) });
                                const w = fontObj.widthOfTextAtSize(text, size);
                                x += w;
                            }
                            cursorY -= lineHeight;
                            curLine = [];
                        };

                        for (const span of (block.spans || [])) {
                            const words = String(span.text || '').split(/(\s+)/);
                            for (const w of words) {
                                let token = w;
                                if (!token) continue;
                                // Handle pure whitespace tokens: newlines -> force line break, other whitespace -> single space
                                if (/^\s+$/.test(token)) {
                                    if (token.indexOf('\n') !== -1) {
                                        // explicit newline(s) -> push current line
                                        if (curLine.length) await pushLine();
                                        // allow multiple newlines to create extra spacing
                                        const nlCount = (token.match(/\n/g) || []).length;
                                        for (let ni = 0; ni < nlCount - 1; ni++) cursorY -= (span.size || 12) * 1.3;
                                        continue;
                                    }
                                    // normalize other whitespace (spaces/tabs) to a single space
                                    token = ' ';
                                }
                                const fontName = span.font || (span.bold ? 'Helvetica-Bold' : span.italic ? 'Helvetica-Oblique' : 'Helvetica');
                                const fontObj = fonts[fontName] || fonts['Helvetica'];
                                const size = span.size || 12;
                                const trial = (curLine.length ? curLine.map(c=>c.text).join('') : '') + token;
                                const trialWidth = (() => {
                                    // measure width of current line + token
                                    let width = 0;
                                    for (const seg of curLine) {
                                        const f = fonts[seg.span.font || 'Helvetica'] || fonts['Helvetica'];
                                        width += f.widthOfTextAtSize(seg.text, seg.span.size || 12);
                                    }
                                    width += fontObj.widthOfTextAtSize(token, size);
                                    return width;
                                })();
                                if (trialWidth > maxWidth && curLine.length) {
                                    await pushLine();
                                }
                                curLine.push({ span, text: token });
                            }
                        }
                        if (curLine.length) await pushLine();
                        cursorY -= 6; // small spacer
                    } else if (block.type === 'image') {
                        try {
                            let imgBytes: ArrayBuffer | null = null;
                            if (typeof block.src === 'string' && block.src.startsWith('data:')) {
                                // data URL
                                const base64 = block.src.split(',')[1];
                                const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                                imgBytes = bytes.buffer;
                            } else if (typeof block.src === 'string') {
                                const fetched = await fetch(block.src);
                                imgBytes = await fetched.arrayBuffer();
                            }
                            if (imgBytes) {
                                let embedded: any;
                                const isPng = (block.src && block.src.indexOf('png') !== -1) || false;
                                if (isPng) embedded = await doc.embedPng(imgBytes as ArrayBuffer);
                                else embedded = await doc.embedJpg(imgBytes as ArrayBuffer);
                                const w = block.width || embedded.width;
                                const h = block.height || embedded.height;
                                const x = typeof block.x === 'number' ? block.x : margin.left;
                                const y = typeof block.y === 'number' ? block.y : cursorY - h;
                                page.drawImage(embedded, { x, y, width: w, height: h });
                                cursorY = y - 8;
                            }
                        } catch (e) {
                            console.error('image render failed', e);
                        }
                    } else if (block.type === 'list') {
                        for (const item of (block.items || [])) {
                            const text = (item.spans || []).map((s: any) => s.text || '').join('');
                            const fontObj = fonts['Helvetica'];
                            const size = (item.spans && item.spans[0] && item.spans[0].size) || 12;
                            page.drawText((block.ordered ? '1. ' : '• ') + text, { x: margin.left + (block.indent || 10), y: cursorY, size, font: fontObj, color: rgb(0, 0, 0) });
                            cursorY -= size * 1.4;
                        }
                    } else if (block.type === 'rule') {
                        const { r, g, b } = hexToRgb(block.color || '#000000');
                        page.drawLine({ start: { x: margin.left, y: cursorY }, end: { x: size.width - margin.right, y: cursorY }, thickness: block.thickness || 1, color: rgb(r, g, b) });
                        cursorY -= (block.thickness || 1) + 6;
                    } else if (block.type === 'newline') {
                        cursorY -= 12;
                    }
                    // If cursor near bottom, create a new page continuing flow
                    if (cursorY < margin.bottom + 40) {
                        // add a continuation page
                        const next = doc.addPage([size.width, size.height]);
                        cursorY = size.height - margin.top;
                    }
                }
            }

            const bytes = await doc.save();
            setMergedBytes(new Uint8Array(bytes));
            if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedPreviewUrl(url);
        } catch (err) {
            console.error('Render layout JSON failed', err);
            throw err;
        }
    };

    // Try to parse a pdf-lib style JS snippet into our layout JSON schema
    const parsePdfLibScriptToLayout = (script: string) => {
        try {
            const pages: any[] = [];
            // map of variable name -> font name
            const fontVars: Record<string, string> = {};
            const stdMap: Record<string, string> = {
                Helvetica: 'Helvetica',
                HelveticaBold: 'Helvetica-Bold',
                HelveticaOblique: 'Helvetica-Oblique',
                TimesRoman: 'Times-Roman',
                Courier: 'Courier',
            };

            // find font embed lines: const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontRegex = /const\s+(\w+)\s*=\s*await\s+pdfDoc\.embedFont\(\s*StandardFonts\.(\w+)\s*\)/g;
            let fr: RegExpExecArray | null;
            while ((fr = fontRegex.exec(script)) !== null) {
                const varName = fr[1];
                const stdName = fr[2];
                const mapped = stdMap[stdName] || stdName;
                fontVars[varName] = mapped;
            }

            // find page.addPage size
            const sizeRegex = /page\.addPage\(\s*\[\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\]\s*\)/;
            const sizeMatch = script.match(sizeRegex);
            const pageSize = sizeMatch ? { width: Number(sizeMatch[1]), height: Number(sizeMatch[2]) } : { width: 595.28, height: 841.89 };

            const blocks: any[] = [];

            // find all page.drawText occurrences
            const drawRegex = /page\.drawText\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{([\s\S]*?)\}\s*\)/g;
            let dr: RegExpExecArray | null;
            while ((dr = drawRegex.exec(script)) !== null) {
                const rawText = dr[2];
                const opts = dr[3];
                // parse simple options x,y,size,font,color,opacity
                const optMap: any = {};
                const optPairs = opts.split(',').map(s => s.trim()).filter(Boolean);
                for (const p of optPairs) {
                    const kv = p.split(':').map(s => s.trim());
                    if (kv.length >= 2) {
                        const k = kv[0];
                        let v = kv.slice(1).join(':').trim();
                        // remove trailing commas or braces
                        v = v.replace(/[},]$/, '').trim();
                        optMap[k] = v;
                    }
                }

                let fontName = 'Helvetica';
                if (optMap.font) {
                    const f = optMap.font;
                    // if font is a variable name
                    const varRef = f.replace(/\)|;/g, '');
                    if (fontVars[varRef]) fontName = fontVars[varRef];
                    else {
                        // handle StandardFonts.X
                        const std = (f.match(/StandardFonts\.(\w+)/) || [])[1];
                        if (std) fontName = stdMap[std] || std;
                    }
                }

                const size = optMap.size ? Number(optMap.size) : 12;
                const color = '#000000';
                const span: any = { text: rawText, font: fontName, size, color };

                // heuristics: big sizes -> heading
                if (size >= 24) {
                    blocks.push({ type: 'heading', level: 1, align: 'left', spans: [span] });
                } else if (size >= 16) {
                    blocks.push({ type: 'heading', level: 2, align: 'left', spans: [span] });
                } else {
                    blocks.push({ type: 'text', align: 'left', lineHeight: Math.round(size * 1.3), spans: [span] });
                }
            }

            pages.push({ size: pageSize, margin: { top: 40, right: 40, bottom: 40, left: 40 }, blocks, flow: { startY: pageSize.height - 40 } });
            return { pages };
        } catch (e) {
            return null;
        }
    };

    const processAndInsertText = async (value: string) => {
        if (!value) return;
        // 1) try parse as pdf-lib script
        const layout = parsePdfLibScriptToLayout(value);
        if (layout && layout.pages && layout.pages.length) {
            await renderLayoutJsonToPdf(layout);
            showModal({ open: true, type: 'info', title: 'Inserted', message: 'Rendered script into PDF' });
            return;
        }
        // 2) try parse as JSON layout
        try {
            const parsed = JSON.parse(value);
            if (parsed && parsed.pages) {
                await renderLayoutJsonToPdf(parsed);
                showModal({ open: true, type: 'info', title: 'Inserted', message: 'Rendered JSON layout into PDF' });
                return;
            }
        } catch (e) {
            // ignore
        }
        // 3) fallback to simple text insertion
        await insertGeneratedTextAsPage(value);
        showModal({ open: true, type: 'info', title: 'Inserted', message: 'Inserted plain text into PDF' });
    };

    // Build file list string without using .map
    const fileListStr = (() => {
        if (!pdfFiles || pdfFiles.length === 0) return 'No PDFs uploaded.';
        let s = '';
        for (let i = 0; i < pdfFiles.length; i++) {
            const p = pdfFiles[i];
            s += `${i + 1}. ${p.name} (${p.pageCount} page${p.pageCount > 1 ? 's' : ''})\n`;
        }
        return s;
    })();


    const generateResponse = async () => {
        const text = chatInput.trim();
        if (!text) return;
        setIsSending(true);
        setMessages((s) => [...s, { role: 'user', text }, { role: 'assistant', text: '' }]);
        setChatInput('');
        let assembledText = '';
        try {
            const res = await fetch('/api/gemini/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, model: selectedModel, system: SYSTEM_PROMPT }),
            });
            const data = await res.json();
            const candidate = data?.reply || data?.raw || data;
            const replyText = String(extractTextFromGenAIObj(candidate)).trim();
            assembledText = replyText;

            setMessages((s) => {
                const copy = s.slice();
                copy[copy.length - 1] = { role: 'assistant', text: assembledText };
                return copy;
            });
        } catch (err) {
            console.error(err);
            setMessages((s) => {
                const copy = s.slice();
                copy[copy.length - 1] = { role: 'assistant', text: 'Error: failed to contact Gemini API' };
                return copy;
            });
        }
        // If requested, insert the whole generated text as page(s) into the merged PDF
        if (insertGeneratedIntoPdf && assembledText) {
            // try parse as JSON layout first
            try {
                const parsed = JSON.parse(assembledText);
                if (parsed && parsed.pages) {
                    await renderLayoutJsonToPdf(parsed);
                    showModal({ open: true, type: 'info', title: 'Inserted', message: 'Generated layout rendered into PDF' });
                } else {
                    // fallback to plain text insertion
                    await insertGeneratedTextAsPage(assembledText);
                    showModal({ open: true, type: 'info', title: 'Inserted', message: 'Generated text inserted into PDF' });
                }
            } catch (e) {
                // not valid JSON, fall back to raw insertion
                try {
                    await insertGeneratedTextAsPage(assembledText);
                    showModal({ open: true, type: 'info', title: 'Inserted', message: 'Generated text inserted into PDF' });
                } catch (err) {
                    console.error('Insert after generate failed', err);
                    showModal({ open: true, type: 'info', title: 'Error', message: 'Failed to insert generated text into PDF' });
                }
            }
        }
        setIsSending(false);
    }

    // Generate PDF from a specific assistant message by calling the LLM to return layout JSON
    const generatePdfFromAssistant = async (idx: number) => {
        const msg = messages[idx];
        if (!msg || msg.role !== 'assistant') return;
        setProcessingIndex(idx);
        try {
            // Ask the model to produce HTML+CSS suitable for html2pdf.js
            const payload = { prompt: msg.text || '', model: selectedModel, system: SYSTEM_PROMPT_HTML };
            const res = await fetch('/api/gemini/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            console.log({data});
            const candidate = data?.reply || data?.raw || data;
            console.log({candidate});
            const html = String(extractTextFromGenAIObj(candidate)).trim();
            console.log({html});
            

            console.debug('[pdf] generatePdfFromAssistant: raw HTML length', html?.length);
            if (!html) throw new Error('Empty HTML from model');

            // Sanitize CSS/color functions unsupported by html2canvas/html2pdf (e.g. oklab/oklch)
            const sanitizeHtmlCss = (s: string) => {
                let out = s;
                // replace oklab(...) and oklch(...) with a conservative fallback
                const before = out;
                out = out.replace(/oklab\([^)]*\)/gi, 'rgb(0,0,0)');
                out = out.replace(/oklch\([^)]*\)/gi, 'rgb(0,0,0)');
                // replace color() functions with rgb fallback unless they clearly contain rgb()/rgba()
                out = out.replace(/color\([^)]*\)/gi, (m) => {
                    if (/rgb\(/i.test(m) || /rgba\(/i.test(m)) return m;
                    return 'rgb(0,0,0)';
                });
                if (out !== before) console.warn('[pdf] Sanitized CSS color functions in generated HTML');
                return out;
            };

            const safeHtml = sanitizeHtmlCss(html);
            console.debug('[pdf] generatePdfFromAssistant: sanitized HTML length', safeHtml?.length);

            // Render sanitized HTML inside a same-origin iframe to avoid inheriting host styles
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '794px';
            iframe.style.height = '1123px';
            iframe.setAttribute('aria-hidden', 'true');
            // Build a minimal document that resets colors and fonts to avoid css functions like oklab from parent
            const docHtml = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;} img{max-width:100%;height:auto;} *{box-sizing:border-box;} @media print{html,body{width:210mm;height:297mm}} </style></head><body>${safeHtml}</body></html>`;
            iframe.srcdoc = docHtml;
            document.body.appendChild(iframe);
            // wait briefly for iframe to render
            await new Promise((resolve) => { iframe.onload = () => resolve(null); setTimeout(resolve, 300); });
            const container = iframe.contentDocument?.body || iframe.contentWindow?.document?.body as HTMLElement;
            if (!container) throw new Error('Failed to create iframe container for html2pdf');

            // Try dynamic import of html2pdf.js (fallback to global if available)
            let html2pdfModule: any = null;
            try {
                const imported = await import('html2pdf.js');
                html2pdfModule = (imported && (imported as any).default) ? (imported as any).default : imported;
            } catch (e) {
                html2pdfModule = (window as any).html2pdf;
            }
            if (!html2pdfModule) throw new Error('html2pdf.js not found');

            // Configure html2pdf options. Use html2canvas scale for higher quality if needed.
            const opt = { margin: 10, filename: 'generated.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' } };

            // Create worker and attempt to produce a Blob of the PDF.
            const worker = html2pdfModule().set(opt).from(container).toPdf();
            let blob: Blob | null = null;
            const dataURLToBlob = (dataurl: string) => {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || '';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) u8arr[n] = bstr.charCodeAt(n);
                return new Blob([u8arr], { type: mime });
            };

            try {
                // Try common worker output methods
                console.debug('[pdf] attempting html2pdf worker.outputPdf or output');
                if (typeof (worker as any).outputPdf === 'function') {
                    const out = await (worker as any).outputPdf('blob');
                    console.debug('[pdf] worker.outputPdf returned type', typeof out);
                    if (out instanceof Blob) blob = out;
                    else if (typeof out === 'string' && out.startsWith('data:')) blob = dataURLToBlob(out);
                }
                if (!blob && typeof (worker as any).output === 'function') {
                    const out = await (worker as any).output('blob');
                    console.debug('[pdf] worker.output returned type', typeof out);
                    if (out instanceof Blob) blob = out;
                    else if (typeof out === 'string' && out.startsWith('data:')) blob = dataURLToBlob(out);
                }
                console.debug('[pdf] after worker attempts, blob present?', !!blob, 'size', blob?.size);
            } catch (e) {
                console.error('[pdf] html2pdf worker output error', e);
            }

            // Fallback: if worker didn't give a blob, try html2canvas + jsPDF directly
            if (!blob) {
                try {
                    const html2canvasModule = await import('html2canvas');
                    const html2canvas = (html2canvasModule && (html2canvasModule as any).default) ? (html2canvasModule as any).default : (html2canvasModule as any);
                    const jspdfModule = await import('jspdf');
                    const { jsPDF } = jspdfModule as any;
                    if (!html2canvas || !jsPDF) throw new Error('html2canvas or jsPDF not available');

                    console.debug('[pdf] Falling back to html2canvas + jsPDF');
                    const canvas = await html2canvas(container as HTMLElement, { scale: 2 });
                    const imgData = canvas.toDataURL('image/jpeg', 0.98);
                    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const imgWidth = pageWidth;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    let position = 0;
                    // Add image and paginate by shifting position
                    while (position < imgHeight) {
                        pdf.addImage(imgData, 'JPEG', 0, -position, imgWidth, imgHeight);
                        position += pageHeight;
                        if (position < imgHeight) pdf.addPage();
                    }
                    // get blob
                    blob = pdf.output('blob');
                    console.debug('[pdf] html2canvas/jsPDF produced blob size', blob?.size);
                } catch (e) {
                    console.error('[pdf] html2canvas/jsPDF fallback failed', e);
                }
            }

            // remove container/iframe
            try { if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch (e) { console.warn('[pdf] failed removing iframe', e); }

            if (!blob) {
                console.error('[pdf] No blob generated. HTML sample (first 1000 chars):', (html || '').slice(0, 1000));
                throw new Error('Failed to generate PDF blob from html2pdf');
            }

            const arr = await blob.arrayBuffer();

            // Load the generated PDF and merge its pages into the merged document
            const genDoc = await PDFDocument.load(arr);
            let targetDoc: any;
            if (mergedBytes) targetDoc = await PDFDocument.load(mergedBytes);
            else targetDoc = await PDFDocument.create();

            const indices = Array.from({ length: genDoc.getPageCount() }, (_, i) => i);
            const copied = await targetDoc.copyPages(genDoc, indices);
            for (const p of copied) targetDoc.addPage(p);

            const bytes = await targetDoc.save();
            setMergedBytes(new Uint8Array(bytes));
            if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }
            const outBlob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(outBlob);
            setMergedPreviewUrl(url);

            showModal({ open: true, type: 'info', title: 'Inserted', message: 'Generated HTML converted to PDF and inserted into merged PDF' });
        } catch (err: any) {
            console.error('Generate PDF from assistant failed', err);
            showModal({ open: true, type: 'info', title: 'Error', message: `Failed: ${err?.message || String(err)}` });
        } finally {
            setProcessingIndex(null);
            setOpenMoreIndex(null);
        }
    }

    return (
        <div className="flex w-full h-full">
            <div className="px-5 py-6 overflow-auto border-r border-white/6" style={{ width: '40%' }}>
                <h3 className="text-lg font-semibold mb-4">AI Chat (Gemini)</h3>

                <div className="flex flex-col h-[90vh] bg-white/3 rounded-md overflow-hidden">
                    <div className="flex-1 p-3 overflow-auto">
                        {messages.length === 0 ? (
                            <div className="text-sm text-white/60">Start a conversation with the assistant.</div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} className={`mb-3 relative ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    <div className={`inline-block px-3 py-2 rounded-md ${m.role === 'user' ? 'bg-white/6' : 'bg-slate-700/10'}`}>
                                        {m.role === 'assistant' ? (
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1"><Markdown text={m.text} /></div>
                                                <button aria-label="more" className="ml-2 p-1 rounded hover:bg-white/5" onClick={() => setOpenMoreIndex(openMoreIndex === i ? null : i)}>
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        ) : <div>{m.text}</div>}
                                    </div>

                                    {/* small attach popup for assistant messages */}
                                    {m.role === 'assistant' && openMoreIndex === i && (
                                        <div className="absolute right-0 mt-1 bg-[#05232b] border border-white/8 rounded shadow-lg p-2 w-44 z-20">
                                            <button className="w-full text-sm text-left px-2 py-2 hover:bg-white/3 rounded" onClick={() => generatePdfFromAssistant(i)} disabled={processingIndex === i}>{processingIndex === i ? 'Generating...' : 'Generate PDF'}</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-white/6">
                        <div className="mb-2">
                            <label className="text-xs text-white/60">Model</label>
                            <ModelSelect models={Models} value={selectedModel} onChange={(v) => setSelectedModel(v)} />
                        </div>

                        <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything about your PDFs or general questions..." className="w-full h-28 p-2 rounded-md bg-transparent border border-white/6 resize-none" />
                        <div className="flex gap-2 mt-2 items-center">
                            <button className="px-3 py-2 rounded-md bg-emerald-600/10" onClick={() => generateResponse()} disabled={isSending}>{isSending ? 'Sending...' : 'Send'}</button>
                            <button className="px-3 py-2 rounded-md bg-slate-700/10" onClick={() => { setMessages([]); setChatInput(''); }}>Clear</button>
                            <label className="ml-2 inline-flex items-center gap-2 text-sm text-white/80">
                                <input type="checkbox" checked={insertGeneratedIntoPdf} onChange={(e) => setInsertGeneratedIntoPdf(e.target.checked)} className="w-4 h-4" />
                                <span>Insert generated text into PDF</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 overflow-auto border-r border-white/6" style={{ width: '10%' }}>
                <h3 className="text-lg font-semibold mb-4">PDF Tools</h3>

                <div className="mb-4">
                    <input id="pdf-upload-input" type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                    <label htmlFor="pdf-upload-input" className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm">
                        <FilePlus size={16} />
                        <span>Add PDF</span>
                    </label>
                </div>

                <pre className="whitespace-pre-wrap text-sm text-white/70 p-3 bg-white/3 rounded-md mb-4">{fileListStr}</pre>

                <div className="space-y-2">
                    <button className="w-full px-3 py-2 rounded-md bg-violet-600/10 hover:bg-violet-600/15" onClick={async () => await handleMergeAll()}>
                        Download Merged PDF
                    </button>

                    <button className="w-full px-3 py-2 rounded-md bg-cyan-600/10 hover:bg-cyan-600/15" onClick={async () => await handleSplitMerged()}>
                        Extract Page from Merged
                    </button>

                    <button className="w-full px-3 py-2 rounded-md bg-amber-600/10 hover:bg-amber-600/15" onClick={async () => await handleWatermarkMerged()}>
                        Add Watermark to Merged
                    </button>

                    <label className="w-full block">
                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleAddImageMerged(f); (e.target as HTMLInputElement).value = ''; }} />
                        <div className="w-full text-center px-3 py-2 rounded-md bg-emerald-600/10 hover:bg-emerald-600/15 cursor-pointer">Add Image to Merged</div>
                    </label>

                    <button className="w-full px-3 py-2 rounded-md bg-indigo-600/10 hover:bg-indigo-600/15" onClick={async () => await handleInsertBlankPageMerged()}>
                        Insert Blank Page into Merged
                    </button>

                    <button className="w-full px-3 py-2 rounded-md bg-rose-600/10 hover:bg-rose-600/15" onClick={() => {
                        showModal({
                            open: true,
                            type: 'input',
                            title: 'Insert Text into Merged PDF',
                            message: 'Enter the text to insert into the merged PDF. You can paste a pdf-lib function, layout JSON, or plain text.',
                            placeholder: 'Paste pdf-lib code, layout JSON, or plain text...',
                            defaultValue: '',
                            onConfirm: async (value?: string) => {
                                if (!value) return showModal({ open: true, type: 'info', title: 'Empty', message: 'No text entered' });
                                try {
                                    await processAndInsertText(String(value));
                                } catch (err) {
                                    console.error('Insert manual text failed', err);
                                    showModal({ open: true, type: 'info', title: 'Error', message: 'Failed to insert text into PDF' });
                                }
                            }
                        });
                    }}>
                        Insert Text into Merged
                    </button>

                    <button className="w-full px-3 py-2 rounded-md bg-red-600/10 hover:bg-red-600/15" onClick={() => { if (mergedPreviewUrl) try { URL.revokeObjectURL(mergedPreviewUrl); } catch { }; setPdfFiles([]); setMergedBytes(null); setMergedPreviewUrl(null); }}>
                        Clear All
                    </button>
                </div>

            </div>

            <div className=" px-1 py-6 flex items-start justify-center flex-1">
                {mergedPreviewUrl ? (
                    <div style={{ height: '95vh', overflow: 'auto' }}>
                        <iframe src={mergedPreviewUrl} style={{ width: '210mm', height: '95vh', maxWidth: '100%' }} className="rounded-md border" title={`merged-preview`} />
                    </div>
                ) : (
                    <div className="text-sm text-white/60">Upload PDFs to see merged preview here</div>
                )}
            </div>

            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-[#071821] border border-white/10 rounded-lg p-6 w-full max-w-lg">
                        {modal.title && <h4 className="text-lg font-semibold mb-2">{modal.title}</h4>}
                        {modal.message && <div className="text-sm text-white/70 mb-4">
                            <Markdown text={modal.message} />
                        </div>}

                        {modal.type === 'input' && (
                            <textarea value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder={(modal as any).placeholder || ''} className="w-full mb-4 px-3 py-2 rounded-md bg-white/3 border border-white/6 resize-y" rows={6} />
                        )}

                        <div className="flex justify-end gap-2">
                            <button className="px-3 py-2 rounded-md bg-white/6" onClick={() => { closeModal(); }}>
                                Cancel
                            </button>
                            {modal.type === 'confirm' && (
                                <button className="px-3 py-2 rounded-md bg-emerald-600/10" onClick={() => { (modal as any).onConfirm(); closeModal(); }}>
                                    Confirm
                                </button>
                            )}
                            {modal.type === 'input' && (
                                <button className="px-3 py-2 rounded-md bg-emerald-600/10" onClick={() => { (modal as any).onConfirm(modalInput); closeModal(); }}>
                                    OK
                                </button>
                            )}
                            {modal.type === 'info' && (
                                <button className="px-3 py-2 rounded-md bg-emerald-600/10" onClick={() => closeModal()}>
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
