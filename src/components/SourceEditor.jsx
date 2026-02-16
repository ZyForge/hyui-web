import React, { useRef, useEffect, useState, useMemo } from 'react';
import { clsx } from 'clsx';

/**
 * A custom Source Editor that provides syntax highlighting and 
 * a visual "Block Selection" highlighting based on character offsets.
 */
export const SourceEditor = ({ code, offsets, selectedIds, onChange, onApply }) => {
    const textareaRef = useRef(null);
    const preRef = useRef(null);
    const [isWrapped, setIsWrapped] = useState(false);

    // Get current selection offset if any
    const selectionOffset = useMemo(() => {
        if (!selectedIds.length || !offsets) return null;
        return offsets[selectedIds[0]];
    }, [selectedIds, offsets]);

    // Single-pass syntax highlighter & selection injector
    const highlightedCode = useMemo(() => {
        if (!code) return '';
        
        // Define token types and their regexes
        const TOKENS = [
            { type: 'comment', regex: /\/\/[^\n]*/ },
            { type: 'string', regex: /"([^"\\]|\\.)*"/ },
            { type: 'element', regex: /\b(?:Group|Label|Button|TextButton|ProgressBar|Image|Sprite|TextField|NumberField|Sprite|DropdownBox|CheckBox|CompactTextField|Container|DecoratedContainer|Panel|PageOverlay|Title|Subtitle|CloseButton|EntityStat|CombatText)\b/ },
            { type: 'id', regex: /#[a-zA-Z0-9_]+/ },
            { type: 'variable', regex: /@[a-zA-Z0-9_]+|\$[a-zA-Z0-9_]+|%[a-zA-Z0-9_.]+/ },
            { type: 'property', regex: /\b[a-zA-Z0-9_]+(?=:)/ },
            { type: 'hex', regex: /#[0-9a-fA-F]{3,8}\b(?!\()/ },
            { type: 'value', regex: /\b(?:True|False|Center|Middle|Top|Bottom|Left|Right|Start|End|Auto|Wrap|Vertical|Horizontal)\b/ },
        ];

        const combinedRegex = new RegExp(
            TOKENS.map(t => `(${t.regex.source})`).join('|'),
            'g'
        );

        let result = '';
        let lastIndex = 0;

        const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const processChunk = (chunk, startIndex) => {
            return chunk.replace(combinedRegex, (match, ...args) => {
                const groups = args.slice(0, TOKENS.length);
                const tokenIndex = groups.findIndex(g => g !== undefined);
                if (tokenIndex === -1) return escape(match);

                const type = TOKENS[tokenIndex].type;
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
                    default: return escape(match);
                }
                return `<span class="${className}">${escape(match)}</span>`;
            });
        };

        // If we have a selection, we need to split the string into: [before, selection, after]
        if (selectionOffset) {
            const { start, end } = selectionOffset;
            const before = code.substring(0, start);
            const selection = code.substring(start, end);
            const after = code.substring(end);

            result = processChunk(before, 0) + 
                     `<span class="bg-hytale-accent/30 text-white rounded-[2px] shadow-[0_0_0_1px_rgba(var(--hytale-accent-rgb),0.5)] ring-1 ring-hytale-accent/50 z-0 relative px-0.5 -mx-0.5">${processChunk(selection, start)}</span>` + 
                     processChunk(after, end);
        } else {
            result = processChunk(code, 0);
        }

        return result;
    }, [code, selectionOffset]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                setIsWrapped(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Sync scrolling
    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const LINE_HEIGHT = 18;

    // Auto-scroll to selection
    useEffect(() => {
        if (!selectionOffset || !textareaRef.current) return;
        const before = code.substring(0, selectionOffset.start);
        const startLine = (before.match(/\n/g) || []).length;
        const targetScrollTop = startLine * LINE_HEIGHT - 40;
        textareaRef.current.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
    }, [selectionOffset, code]);

    return (
        <div className="relative flex-1 flex flex-col min-h-0 bg-black/40 border border-white/10 rounded overflow-hidden group">
            {/* Editor Layers */}
            <div className="relative flex-1 min-h-0 overflow-hidden font-mono text-[11px]">
                
                {/* 1. Highlighted Code Display (also contains selection background now) */}
                <pre 
                    ref={preRef}
                    aria-hidden="true"
                    className={clsx(
                        "absolute inset-0 p-3 m-0 pointer-events-none overflow-hidden z-10",
                        isWrapped ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                    )}
                    style={{ lineHeight: `${LINE_HEIGHT}px` }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode + '\n\n' }}
                />

                {/* 2. Transparent Input Layer */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className={clsx(
                        "absolute inset-0 w-full h-full p-3 m-0 bg-transparent text-transparent caret-hytale-accent resize-none outline-none z-20 overflow-auto custom-scrollbar",
                        isWrapped ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                    )}
                    style={{ 
                        WebkitTextFillColor: 'transparent',
                        lineHeight: `${LINE_HEIGHT}px`
                    }}
                />
            </div>

            {/* Controls */}
            <div className="p-2 border-t border-white/10 bg-black/20 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] text-hytale-muted uppercase tracking-widest font-bold">Source Editor - {code.length} chars</span>
                    <span className="text-[8px] text-hytale-muted/50 uppercase font-bold">Alt+Z: Wrap {isWrapped ? 'ON' : 'OFF'}</span>
                </div>
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
