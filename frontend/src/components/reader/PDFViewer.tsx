import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { Highlight } from '../../lib/types';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    fileUrl: string;
    initialPage?: number;
    onPageChange?: (page: number) => void;
    onLoadSuccess?: (totalPages: number) => void;
    highlights?: Highlight[];
    onCreateHighlight?: (highlight: Omit<Highlight, 'id' | 'book' | 'created_at' | 'updated_at'>) => void;
    onDeleteHighlight?: (highlightId: string) => void;
    userEmail?: string;
}

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: 'yellow', bg: 'rgba(255, 255, 0, 0.3)' },
    { name: 'Green', value: 'green', bg: 'rgba(0, 255, 0, 0.3)' },
    { name: 'Blue', value: 'blue', bg: 'rgba(0, 150, 255, 0.3)' },
    { name: 'Pink', value: 'pink', bg: 'rgba(255, 105, 180, 0.3)' },
    { name: 'Purple', value: 'purple', bg: 'rgba(147, 51, 234, 0.3)' },
    { name: 'Orange', value: 'orange', bg: 'rgba(255,  165, 0, 0.3)' },
];

const ANNOTATION_TYPES = [
    { name: 'Highlight', value: 'highlight' as const, icon: '🖍️' },
    { name: 'Underline', value: 'underline' as const, icon: '📏' },
];

const PDFViewer = ({
    fileUrl,
    initialPage = 1,
    onPageChange,
    onLoadSuccess,
    highlights = [],
    onCreateHighlight,
    onDeleteHighlight,
    userEmail = 'user@bugema.com'
}: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [scale, setScale] = useState<number>(1.5); // Increased from 1.2
    const [showPreview, setShowPreview] = useState(true);
    const [selectedColor, setSelectedColor] = useState('yellow');
    const [selectedText, setSelectedText] = useState<string>('');
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [annotationType, setAnnotationType] = useState<'highlight' | 'underline'>('highlight');

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    useEffect(() => {
        setCurrentPage(initialPage);
    }, [initialPage]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        if (onLoadSuccess) onLoadSuccess(numPages);
    }

    // Track scroll position to update current page
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;

        // Find which page is most visible
        let maxVisiblePage = 1;
        let maxVisibility = 0;

        pageRefs.current.forEach((element, pageNum) => {
            const rect = element.getBoundingClientRect();
            const containerRect = scrollContainerRef.current!.getBoundingClientRect();

            const visibleTop = Math.max(rect.top, containerRect.top);
            const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);

            if (visibleHeight > maxVisibility) {
                maxVisibility = visibleHeight;
                maxVisiblePage = pageNum;
            }
        });

        if (maxVisiblePage !== currentPage) {
            setCurrentPage(maxVisiblePage);
            if (onPageChange) onPageChange(maxVisiblePage);
        }
    }, [currentPage, onPageChange]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Handle text selection for highlighting
    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setShowHighlightMenu(false);
            return;
        }

        const text = selection.toString().trim();
        if (text.length === 0) {
            setShowHighlightMenu(false);
            return;
        }

        setSelectedText(text);

        // Get selection position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setMenuPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 50
        });
        setShowHighlightMenu(true);
    };

    const createHighlight = (type: 'highlight' | 'underline') => {
        if (!selectedText || !onCreateHighlight) return;

        const selection = window.getSelection();
        if (!selection) return;

        const range = selection.getRangeAt(0);
        const rects = Array.from(range.getClientRects()).map(rect => ({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            pageIndex: currentPage
        }));

        onCreateHighlight({
            page_number: currentPage,
            text_content: selectedText,
            color: type === 'underline' ? `${selectedColor}-underline` : selectedColor,
            position_data: { rects },
        });

        setShowHighlightMenu(false);
        selection.removeAllRanges();
        setSelectedText('');
    };

    const scrollToPage = (pageNum: number) => {
        const pageElement = pageRefs.current.get(pageNum);
        if (pageElement && scrollContainerRef.current) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex gap-4 h-full" ref={containerRef}>
            {/* Main Reader Area */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-white p-3 shadow-lg dark:bg-slate-800 flex-wrap">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                            className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="Zoom Out"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>

                        <span className="min-w-[60px] text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                            {Math.round(scale * 100)}%
                        </span>

                        <button
                            type="button"
                            onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
                            className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="Zoom In"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                            Page {currentPage} of {numPages}
                        </span>
                    </div>

                    {/* Annotation Type Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Type:</span>
                        {ANNOTATION_TYPES.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setAnnotationType(type.value)}
                                className={`px-2 py-1 rounded text-xs font-medium transition ${annotationType === type.value
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300'
                                    }`}
                                title={type.name}
                            >
                                {type.icon}
                            </button>
                        ))}
                    </div>

                    {/* Highlight Color Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Color:</span>
                        {HIGHLIGHT_COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setSelectedColor(color.value)}
                                className={`w-6 h-6 rounded border-2 transition ${selectedColor === color.value
                                    ? 'border-slate-900 dark:border-white scale-110'
                                    : 'border-slate-300 dark:border-slate-600'
                                    }`}
                                style={{ backgroundColor: color.bg }}
                                title={color.name}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title={showPreview ? 'Hide Preview' : 'Show Preview'}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable PDF Container - Increased height */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-slate-100 p-6 dark:border-slate-700 dark:bg-slate-900"
                    style={{ maxHeight: 'calc(100vh - 120px)', minHeight: '750px' }}
                    onMouseUp={handleTextSelection}
                >
                    <div className="flex flex-col items-center gap-8">
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex h-96 w-full items-center justify-center">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                                </div>
                            }
                            error={
                                <div className="flex h-96 w-full flex-col items-center justify-center text-rose-500">
                                    <svg className="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p>Failed to load PDF</p>
                                </div>
                            }
                        >
                            {Array.from(new Array(numPages), (el, index) => {
                                const pageNum = index + 1;
                                return (
                                    <div
                                        key={`page_${pageNum}`}
                                        ref={(el) => {
                                            if (el) pageRefs.current.set(pageNum, el);
                                        }}
                                        className="relative mb-6 shadow-2xl"
                                    >
                                        {/* Watermark removed for better reading experience */}
                                        <Page
                                            pageNumber={pageNum}
                                            scale={scale}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                            className="bg-white"
                                        />

                                        {/* Render highlights and underlines for this page */}
                                        {highlights
                                            .filter(h => h.page_number === pageNum)
                                            .map(highlight => {
                                                const isUnderline = highlight.color.includes('-underline');
                                                const baseColor = highlight.color.replace('-underline', '');
                                                const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === baseColor);

                                                return (
                                                    <div
                                                        key={highlight.id}
                                                        className="absolute inset-0 pointer-events-none"
                                                        style={isUnderline ? {
                                                            borderBottom: `3px solid ${colorConfig?.bg.replace('0.3', '0.8') || 'rgba(255, 255, 0, 0.8)'}`,
                                                            height: 'fit-content'
                                                        } : {
                                                            backgroundColor: colorConfig?.bg || 'rgba(255, 255, 0, 0.3)'
                                                        }}
                                                        title={highlight.text_content}
                                                    />
                                                );
                                            })
                                        }
                                    </div>
                                );
                            })}
                        </Document>
                    </div>
                </div>
            </div>

            {/* Page Preview Sidebar */}
            {showPreview && (
                <div className="w-[280px] flex flex-col gap-3 rounded-lg bg-white p-4 shadow-lg dark:bg-slate-800 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Page Navigation</h3>

                    <div className="space-y-3">
                        {Array.from(new Array(Math.min(numPages, 50)), (el, index) => {
                            const pageNum = index + 1;
                            const isCurrent = pageNum === currentPage;

                            return (
                                <button
                                    key={`preview_${pageNum}`}
                                    onClick={() => scrollToPage(pageNum)}
                                    className={`group relative w-full rounded-lg border-2 p-2 transition ${isCurrent
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                        : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                                        }`}
                                >
                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Page {pageNum}
                                    </div>
                                    <div className="aspect-[8.5/11] bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                        <Document file={fileUrl} loading={<div className="w-full h-full bg-slate-200 dark:bg-slate-600" />}>
                                            <Page
                                                pageNumber={pageNum}
                                                scale={0.15}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </Document>
                                    </div>
                                    {isCurrent && (
                                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {numPages > 50 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                            Showing first 50 pages
                        </p>
                    )}
                </div>
            )}

            {/* Highlight/Underline Menu */}
            {showHighlightMenu && (
                <div
                    className="fixed z-50 rounded-lg bg-white p-2 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    style={{
                        left: `${menuPosition.x}px`,
                        top: `${menuPosition.y}px`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="space-y-1">
                        <button
                            onClick={() => createHighlight('highlight')}
                            className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700 transition w-full"
                        >
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: HIGHLIGHT_COLORS.find(c => c.value === selectedColor)?.bg }}
                            />
                            🖍️ Highlight
                        </button>
                        <button
                            onClick={() => createHighlight('underline')}
                            className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700 transition w-full"
                        >
                            <div
                                className="w-4 h-1 rounded"
                                style={{ backgroundColor: HIGHLIGHT_COLORS.find(c => c.value === selectedColor)?.bg.replace('0.3', '0.8') }}
                            />
                            📏 Underline
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
