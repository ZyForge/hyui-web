import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PanelRight, Play, Save, FileCode, AlertCircle, Plus, Eye, Code, Trash2, ChevronDown, X, Undo2, Redo2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useEditorStore } from './lib/hytale-ui/store';
import { TreeView } from './components/TreeView';
import { PropertyEditor } from './components/PropertyEditor';
import { HytaleRenderer } from './components/Renderer';
import { SourceEditor } from './components/SourceEditor';

import { HytaleUIParser } from './lib/hytale-ui/parser';

// ---- Component Palette Items (used by the + dropdown) ----
const PALETTE_ITEMS = [
    { label: 'Group', type: 'Group', category: 'Layout' },
    { label: 'Label', type: 'Label', category: 'Layout' },
    { label: 'Container', type: '$C.@Container', category: 'Container' },
    { label: 'Decorated Container', type: '$C.@DecoratedContainer', category: 'Container' },
    { label: 'Panel', type: '$C.@Panel', category: 'Container' },
    { label: 'Overlay', type: '$C.@PageOverlay', category: 'Container' },
    { label: 'Button', type: '$C.@TextButton', category: 'Button' },
    { label: 'Secondary Button', type: '$C.@SecondaryTextButton', category: 'Button' },
    { label: 'Cancel Button', type: '$C.@CancelTextButton', category: 'Button' },
    { label: 'Text Field', type: '$C.@TextField', category: 'Input' },
    { label: 'Number Field', type: '$C.@NumberField', category: 'Input' },
    { label: 'Dropdown', type: '$C.@DropdownBox', category: 'Input' },
    { label: 'Checkbox', type: '$C.@CheckBoxWithLabel', category: 'Input' },
    { label: 'Separator', type: '$C.@ContentSeparator', category: 'Layout' },
    { label: 'V-Separator', type: '$C.@VerticalSeparator', category: 'Layout' },
    { label: 'Title', type: '$C.@Title', category: 'Text' },
    { label: 'Subtitle', type: '$C.@Subtitle', category: 'Text' },
];

const CATEGORIES = ['Layout', 'Container', 'Button', 'Input', 'Text'];

function App() {
    const { 
        doc, selectedIds, expandedIds, gridSettings,
        setFullDoc, toggleSelectedId, toggleExpandedId, setGridSettings,
        updateElement, addElement, deleteElement, moveElement, serialize, serializeWithOffsets, loadHytaleData, undo, redo, _undoStack, _redoStack
    } = useEditorStore();

    const selectedId = selectedIds[0] || null; // For single-element editors
  const [bgMode, setBgMode] = useState('ui');
  const [viewport, setViewport] = useState({ x: 0, y: 0 }); // Just pan
  const [isPanning, setIsPanning] = useState(false);

  const [leftPanelMode, setLeftPanelMode] = useState('hierarchy'); // 'hierarchy' | 'source'
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [sourceOffsets, setSourceOffsets] = useState({});
  const [sourceError, setSourceError] = useState(null);
  const sourceRef = useRef(null);
  const addBtnRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const fileInputRef = useRef(null);

  // Pan Handlers
  const handleViewportMouseDown = (e) => {
    // 2 is right click
    if (e.button === 2) {
        setIsPanning(true);
        e.preventDefault();
    }
  };

  const handleViewportMouseMove = (e) => {
    if (isPanning) {
        setViewport(v => ({
            ...v,
            x: v.x + e.movementX,
            y: v.y + e.movementY
        }));
    }
  };

  const handleViewportMouseUp = () => {
    setIsPanning(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault(); // Disable right-click menu for panning
  };

  useEffect(() => {
    loadHytaleData();
  }, [loadHytaleData]);

  // Keyboard shortcuts: Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z), Escape to deselect
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture shortcuts when typing in inputs/textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        toggleSelectedId(null); // Deselect all
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, toggleSelectedId]);

  // Sync source text when switching to Source tab or when doc changes
  useEffect(() => {
    if (leftPanelMode === 'source') {
      const result = serializeWithOffsets();
      setSourceText(result.code);
      setSourceOffsets(result.offsets);
      setSourceError(null);
    }
  }, [leftPanelMode, doc, serializeWithOffsets]);

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      try {
        const parsedDoc = HytaleUIParser.parse(content);
        setFullDoc(parsedDoc);
        // Clear input so same file can be imported again
        e.target.value = '';
      } catch (err) {
        console.error(err);
        alert("Failed to parse .ui file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const selectedElement = (function find(node) {
    if (!node) return null;
    if (selectedIds.includes(node.id) || selectedIds.includes(node.__uid)) return node;
    for (const child of node.children || []) {
      const found = find(child);
      if (found) return found;
    }
    return null;
  })(doc.root);

  const handleExport = () => {
    const output = serialize();
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Use the root element ID or title for the filename
    const filename = (doc.root?.id || 'export').toLowerCase().replace(/[^a-z0-9]/g, '_') + '.ui';
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addItem = (type, defaultProps = {}) => {
      const parentId = selectedId || "Root";
      let elementData = { type, properties: { ...defaultProps }, children: [] };
      
      switch (type) {
          case 'Label':
              elementData.properties = { ...elementData.properties, Text: "New Label", Style: { FontSize: 16, TextColor: '#96a9be' } };
              break;
          case 'Group':
              elementData.properties = { ...elementData.properties, LayoutMode: 'Top', Anchor: { Width: 100, Height: 100 } };
              break;
          case '$C.@TextButton':
              elementData.properties = { ...elementData.properties, '@Text': "Button", Anchor: { Width: 172, Height: 44 } };
              break;
          case '$C.@SecondaryTextButton':
              elementData.properties = { ...elementData.properties, '@Text': "Button", Anchor: { Width: 172, Height: 44 } };
              break;
          case '$C.@CancelTextButton':
              elementData.properties = { ...elementData.properties, '@Text': "Cancel", Anchor: { Width: 172, Height: 44 } };
              break;
          case '$C.@TextField':
              elementData.properties = { ...elementData.properties, PlaceholderText: "Enter text...", Anchor: { Height: 38, Left: 0, Right: 0 } };
              break;
          case '$C.@NumberField':
              elementData.properties = { ...elementData.properties, Value: 0, Anchor: { Width: 80, Height: 38 } };
              break;
          case '$C.@DropdownBox':
              elementData.properties = { ...elementData.properties, Anchor: { Width: 200, Height: 32 } };
              break;
          case '$C.@CheckBoxWithLabel':
              elementData.properties = { ...elementData.properties, '@Text': "Option", '@Checked': false, Anchor: { Height: 28 } };
              break;
          case '$C.@Container':
          case '$C.@DecoratedContainer':
              elementData.properties = { ...elementData.properties, '@CloseButton': true, '@ContentPadding': { Full: 10 }, Anchor: { Width: 400, Height: 300 } };
              elementData.children.push({
                  id: "Title",
                  type: "Label",
                  properties: { Text: "Window Title", Style: { FontSize: 15, Bold: true, TextColor: '#b4c8c9', RenderUppercase: true } },
                  children: []
              });
              break;
          case '$C.@Panel':
              elementData.properties = { ...elementData.properties, Anchor: { Width: 200, Height: 150 } };
              break;
          case '$C.@PageOverlay':
              elementData.properties = { ...elementData.properties, Anchor: { Top: 0, Bottom: 0, Left: 0, Right: 0 } };
              break;
          case '$C.@ContentSeparator':
              elementData.properties = { ...elementData.properties, Anchor: { Left: 0, Right: 0 } };
              break;
          case '$C.@Title':
              elementData.properties = { ...elementData.properties, '@Text': "Title", '@Alignment': 'Start' };
              break;
          case '$C.@Subtitle':
              elementData.properties = { ...elementData.properties, '@Text': "Subtitle" };
              break;
      }
      
      addElement(parentId, elementData);
      setAddDropdownOpen(false);
  };
  
  const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('hytale/type');
      if (!type) return;
      
      const propsJson = e.dataTransfer.getData('hytale/props');
      const defaultProps = propsJson ? JSON.parse(propsJson) : {};
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      defaultProps.Anchor = { ...(defaultProps.Anchor || {}), Left: Math.round(x), Top: Math.round(y) };
      if (!defaultProps.Anchor.Width) defaultProps.Anchor.Width = 100;
      if (!defaultProps.Anchor.Height) defaultProps.Anchor.Height = 100;

      addItem(type, defaultProps);
  };

  const handleSourceApply = () => {
    try {
      const parsedDoc = HytaleUIParser.parse(sourceText);
      setFullDoc(parsedDoc);
      setSourceError(null);
    } catch (e) {
      setSourceError(e.message || "Parse error");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!addDropdownOpen) return;
    const handleClick = (e) => {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target)) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [addDropdownOpen]);

  return (
    <div className="flex h-screen w-full bg-hytale-bg text-hytale-text overflow-hidden font-sans">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".ui,.hson,.txt" 
        onChange={handleFileChange}
      />
      {/* Sidebar - Hierarchy & Source */}
      <aside className="w-72 border-r border-white/10 bg-hytale-sidebar flex flex-col">
        <header className="p-4 border-b border-white/10 bg-white/5">
             {/* Tabs: Hierarchy | Source */}
             <div className="flex items-center gap-2 mb-4 bg-black/20 p-1 rounded-lg">
                 <button 
                    onClick={() => setLeftPanelMode('hierarchy')}
                    className={clsx("flex-1 py-1 px-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all", leftPanelMode === 'hierarchy' ? "bg-hytale-accent text-black" : "text-hytale-muted hover:text-white")}
                 >Hierarchy</button>
                 <button 
                    onClick={() => setLeftPanelMode('source')}
                    className={clsx("flex-1 py-1 px-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1", leftPanelMode === 'source' ? "bg-hytale-accent text-black" : "text-hytale-muted hover:text-white")}
                 ><Code className="w-3 h-3"/>Source</button>
             </div>
             <div className="flex items-center justify-between">
                <h2 className="font-bold text-hytale-accent tracking-[0.2em] uppercase text-[10px]">{leftPanelMode === 'hierarchy' ? 'Structure' : 'Source Code'}</h2>
                {leftPanelMode === 'hierarchy' && (
                  <div className="flex gap-1">
                      {/* + Dropdown */}
                      <div className="relative" ref={addBtnRef}>
                          <button 
                              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                              className={clsx("p-1 rounded transition-colors flex items-center gap-0.5", addDropdownOpen ? "bg-hytale-accent/20 text-hytale-accent" : "hover:bg-white/10 text-hytale-accent")}
                              title="Add Element"
                          >
                              <Plus className="w-4 h-4" />
                              <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {addDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[#141828] border border-white/10 rounded-lg shadow-2xl z-50 py-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                              {CATEGORIES.map(cat => (
                                <div key={cat}>
                                  <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-hytale-muted/50">{cat}</div>
                                  {PALETTE_ITEMS.filter(i => i.category === cat).map(item => (
                                    <button
                                      key={item.type + item.label}
                                      onClick={() => addItem(item.type)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-hytale-text hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <button 
                          onClick={() => deleteElement(selectedIds)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400" title="Delete Selected">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                )}
             </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
           {leftPanelMode === 'hierarchy' ? (
               <TreeView 
                root={doc.root} 
                selectedIds={selectedIds} 
                expandedIds={expandedIds}
                onToggleSelect={toggleSelectedId} 
                onToggleExpand={toggleExpandedId}
                onDelete={deleteElement} 
                onMove={moveElement}
              />
           ) : (
              <div className="flex flex-col h-full">
                <SourceEditor 
                   code={sourceText}
                   offsets={sourceOffsets}
                   selectedIds={selectedIds}
                   onChange={setSourceText}
                   onApply={handleSourceApply}
                />
              </div>
           )}
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col relative bg-[#090a0c]">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
        
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-hytale-bg/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <h1 className="font-black text-xl tracking-tighter italic text-white leading-none">HYTALE<span className="text-hytale-accent">UI</span></h1>
                <span className="text-[10px] text-hytale-muted uppercase tracking-[0.3em] font-bold">Project Editor</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            
            {/* Background Toggle */}
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                {['ui', 'clean', 'flat'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setBgMode(mode)}
                        className={clsx(
                            "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                            bgMode === mode ? "bg-hytale-accent text-black shadow-sm" : "text-hytale-muted hover:text-white"
                        )}
                    >
                        {mode === 'ui' ? 'Game UI' : mode === 'clean' ? 'Clean' : 'Flat'}
                    </button>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Undo / Redo */}
            <div className="flex bg-white/5 rounded-lg border border-white/5">
              <button
                onClick={undo}
                disabled={_undoStack.length === 0}
                className="p-2 text-hytale-muted hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <div className="w-px bg-white/10 my-1" />
              <button
                onClick={redo}
                disabled={_redoStack.length === 0}
                className="p-2 text-hytale-muted hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={() => setGridSettings({ visible: !gridSettings.visible })}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded transition-all text-[10px] font-bold uppercase tracking-wider border active:scale-95",
                gridSettings.visible ? "bg-hytale-accent text-black border-hytale-accent" : "bg-white/5 text-hytale-muted border-white/10 hover:bg-white/10"
              )}>
              Grid {gridSettings.visible ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setGridSettings({ snap: !gridSettings.snap })}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded transition-all text-[10px] font-bold uppercase tracking-wider border active:scale-95",
                gridSettings.snap ? "bg-hytale-accent text-black border-hytale-accent" : "bg-white/5 text-hytale-muted border-white/10 hover:bg-white/10"
              )}>
              Snap {gridSettings.snap ? 'ON' : 'OFF'}
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-black uppercase tracking-widest rounded transition-all border border-white/10 active:scale-95">
              Import .ui
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-hytale-accent hover:bg-hytale-accent/90 text-black text-[11px] font-black uppercase tracking-widest rounded transition-all shadow-lg shadow-hytale-accent/20 active:scale-95">
              Export .ui
            </button>
          </div>
        </header>
        
        {/* Canvas viewport — overflow hidden, no scrollbars */}
        <div 
            ref={viewportRef}
            className="flex-1 overflow-hidden relative cursor-all-scroll bg-[#050608]"
            onMouseDown={handleViewportMouseDown}
            onMouseMove={handleViewportMouseMove}
            onMouseUp={handleViewportMouseUp}
            onMouseLeave={handleViewportMouseUp}
            onContextMenu={handleContextMenu}
        >
            <div 
              style={{ 
                  position: 'absolute',
                  inset: 0,
                  transform: `translate(${viewport.x}px, ${viewport.y}px)`,
                  transition: isPanning ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
            >
                <HytaleRenderer 
                    element={doc.root} 
                    variables={doc.variables}
                    selectedIds={selectedIds}
                    gridSettings={gridSettings}
                    onSelect={toggleSelectedId}
                    onUpdate={updateElement}
                    bgMode={bgMode}
                />
            </div>
        </div>

        {/* Status Bar */}
        <footer className="h-8 border-t border-white/10 bg-hytale-sidebar flex items-center px-4 justify-between">
          <div className="flex items-center gap-3 text-[9px] text-hytale-muted font-bold uppercase tracking-widest">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                <span>Compiler: Ready</span>
             </div>
             <div className="w-px h-2 bg-white/10" />
             <span>Hytale Schema: 1.2.4</span>
          </div>
          <div className="text-[9px] text-hytale-accent/40 font-mono tracking-widest">
            {selectedId ? `SELECTED: ${selectedId}` : 'IDLE'}
          </div>
        </footer>
      </main>

      {/* Right Sidebar - Properties */}
      <aside className="w-80 border-l border-white/10 bg-hytale-sidebar flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
        <header className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
          <PanelRight className="w-4 h-4 text-hytale-accent" />
          <h2 className="font-bold text-hytale-accent tracking-[0.2em] uppercase text-[10px]">Inspector</h2>
        </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <PropertyEditor 
                        elements={selectedIds.map(id => {
                            const find = (node) => {
                                if (!node) return null;
                                if (node.id === id || node.__uid === id) return node;
                                for (const child of node.children || []) {
                                    const found = find(child);
                                    if (found) return found;
                                }
                                return null;
                            };
                            return find(doc.root);
                        }).filter(Boolean)}
                        onUpdate={updateElement}
                        variables={doc.variables}
                    />
                </div>
      </aside>

    </div>
  );
}

export default App;
