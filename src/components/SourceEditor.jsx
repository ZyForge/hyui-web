import React, { useRef, useEffect, useState, useMemo } from 'react';
import { clsx } from 'clsx';

/**
 * A custom Source Editor that provides syntax highlighting and 
 * a visual "Block Selection" highlighting based on character offsets.
 */
export const SourceEditor = ({ code, offsets, selectedIds, onChange, onApply }) => {
    const textareaRef = useRef(null);
    const preRef = useRef(null);
    const [selectionRect, setSelectionRect] = useState(null);

    // Single-pass syntax highlighter for Hytale UI (much safer)
    const highlightedCode = useMemo(() => {
        if (!code) return '';
        
        // Escape HTML entities first
        const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Define token types and their regexes
        // Order is important!
        const TOKENS = [
            { type: 'comment', regex: /\/\/[^\n]*/ },
            { type: 'string', regex: /"([^"\\]|\\.)*"/ },
            { type: 'element', regex: /\b(?:Group|Label|Button|TextButton|ProgressBar|TextField|NumberField|Sprite|DropdownBox|CheckBox|CompactTextField|Container|DecoratedContainer|Panel|PageOverlay|Title|Subtitle|CloseButton|EntityStat|CombatText)\b/ },
            { type: 'id', regex: /#[a-zA-Z0-9_]+/ },
            { type: 'variable', regex: /@[a-zA-Z0-9_]+|\$[a-zA-Z0-9_]+|%[a-zA-Z0-9_.]+/ },
            { type: 'property', regex: /\b[a-zA-Z0-9_]+(?=:)/ },
            { type: 'hex', regex: /#[0-9a-fA-F]{3,8}\b(?!\()/ }, // Don't match IDs
            { type: 'value', regex: /\b(?:True|False|Center|Middle|Top|Bottom|Left|Right|Start|End|Auto|Wrap|Vertical|Horizontal)\b/ },
        ];

        // Combine into one big regex
        const combinedRegex = new RegExp(
            TOKENS.map(t => `(${t.regex.source})`).join('|'),
            'g'
        );

        // Replace using the combined regex
        return escaped.replace(combinedRegex, (match, ...args) => {
            // Find which group matched
            const groups = args.slice(0, TOKENS.length);
            const index = groups.findIndex(g => g !== undefined);
            
            if (index === -1) return match;

            const type = TOKENS[index].type;
            let className = '';

            switch (type) {
                case 'comment': className = 'text-gray-500 italic'; break;
                case 'string': className = 'text-green-400'; break;
                case 'element': className = 'text-blue-400 font-bold'; break;
                case 'id': className = 'text-hytale-accent font-black italic'; break;
                case 'variable': className = 'text-yellow-400'; break;
                case 'property': className = 'text-blue-300'; break;
                case 'hex': className = 'text-pink-400 font-mono'; break;
                case 'value': className = 'text-purple-400'; break;
                default: return match;
            }

            return `<span class="${className}">${match}</span>`;
        });
    }, [code]);

    // Sync scrolling
    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const LINE_HEIGHT = 18; // Fixed line height in pixels

    // Calculate selection block position
    useEffect(() => {
        if (selectedIds.length === 0 || !offsets) {
            setSelectionRect(null);
            return;
        }

        const firstId = selectedIds[0];
        const offset = offsets[firstId];
        if (!offset) {
            setSelectionRect(null);
            return;
        }

        const beforeSelection = code.substring(0, offset.start);
        const insideSelection = code.substring(offset.start, offset.end);
        
        const startLine = (beforeSelection.match(/\n/g) || []).length;
        const selectionLines = (insideSelection.match(/\n/g) || []).length + 1;
        
        setSelectionRect({
            top: startLine * LINE_HEIGHT,
            height: selectionLines * LINE_HEIGHT,
        });

        // Auto-scroll textarea to selection if not visible
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const targetScrollTop = startLine * LINE_HEIGHT - 40;
            if (textarea.scrollTop > targetScrollTop || textarea.scrollTop + textarea.clientHeight < targetScrollTop + (selectionLines * LINE_HEIGHT)) {
                textarea.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
            }
        }
    }, [selectedIds, offsets, code]);

    return (
        <div className="relative flex-1 flex flex-col min-h-0 bg-black/40 border border-white/10 rounded overflow-hidden group">
            {/* Editor Layers */}
            <div className="relative flex-1 min-h-0 overflow-hidden font-mono text-[11px] p-3">
                
                {/* 1. Selection Highlight Layer (Behind) */}
                {selectionRect && (
                    <div 
                        className="absolute left-0 right-0 bg-hytale-accent/10 border-y border-hytale-accent/20 pointer-events-none transition-all duration-300 z-0"
                        style={{ 
                            top: `${selectionRect.top + 12}px`, // +12 for p-3
                            height: `${selectionRect.height}px` 
                        }}
                    />
                )}

                {/* 2. Highlighted Code Display */}
                <pre 
                    ref={preRef}
                    aria-hidden="true"
                    className="absolute inset-0 p-3 m-0 pointer-events-none whitespace-pre overflow-hidden z-10"
                    style={{ lineHeight: `${LINE_HEIGHT}px` }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode + '\n\n' }}
                />

                {/* 3. Transparent Input Layer */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-3 m-0 bg-transparent text-transparent caret-hytale-accent resize-none outline-none z-20 whitespace-pre overflow-auto custom-scrollbar"
                    style={{ 
                        WebkitTextFillColor: 'transparent',
                        lineHeight: `${LINE_HEIGHT}px`
                    }}
                />
            </div>

            {/* Controls */}
            <div className="p-2 border-t border-white/10 bg-black/20 flex items-center justify-between">
                <span className="text-[9px] text-hytale-muted uppercase tracking-widest font-bold">Source Editor - {code.length} chars</span>
                <button
                  onClick={onApply}
                  className="px-3 py-1 bg-hytale-accent text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-hytale-accent/90 transition-all active:scale-95 shadow-lg shadow-hytale-accent/20"
                >
                  Apply Changes
                </button>
            </div>
        </div>
    );
};
