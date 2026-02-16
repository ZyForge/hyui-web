import React from 'react';
import { ChevronRight, ChevronDown, MousePointer2, Box, Type, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

const ElementIcon = ({ type }) => {
  if (type.includes('Label')) return <Type className="w-3.5 h-3.5" />;
  if (type.includes('Image')) return <ImageIcon className="w-3.5 h-3.5" />;
  if (type.includes('Container')) return <Box className="w-3.5 h-3.5" />;
  if (type.includes('Button')) return <MousePointer2 className="w-3.5 h-3.5" />;
  return <Box className="w-3.5 h-3.5" />;
};

const TreeItem = ({ el, depth, selectedIds, expandedIds, onToggleSelect, onToggleExpand, onDelete, onMove, errors = [] }) => {
  const elKey = el.id || el.__uid;
  const isSelected = selectedIds.includes(elKey);
  const isExpanded = expandedIds.has(elKey);
  const hasChildren = el.children && el.children.length > 0;
  
  const elementErrors = errors.filter(e => e.elementId === elKey);
  const hasErrors = elementErrors.length > 0;
  
  const handleItemClick = (e) => {
    e.stopPropagation();
    onToggleSelect(elKey, e.shiftKey || e.ctrlKey || e.metaKey);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    onToggleExpand(elKey);
  };

  // --- Drag & Drop Handlers ---
  const [dropPosition, setDropPosition] = React.useState(null); // 'above' | 'below' | 'nest' | null

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('hytale/element-key', elKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (elKey === "Root") {
        setDropPosition('nest');
        return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    if (y < height * 0.25) setDropPosition('above');
    else if (y > height * 0.75) setDropPosition('below');
    else setDropPosition('nest');
  };

  const handleDragLeave = () => {
    setDropPosition(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceKey = e.dataTransfer.getData('hytale/element-key');
    const pos = dropPosition;
    setDropPosition(null);

    if (!sourceKey || sourceKey === elKey || !pos) return;
    
    // Find parent and index for sibling reordering
    // For simplicity, we'll pass the intent to moveElement
    // We need to know who the parent is to support 'above'/'below'
    // This requires a minor tweak to how we call onMove
    onMove(sourceKey, elKey, pos);
  };
  
  return (
    <div 
      draggable={elKey !== "Root"}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Drop Indicators */}
      {dropPosition === 'above' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-hytale-accent z-10" />}
      {dropPosition === 'below' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-hytale-accent z-10" />}
      
      <div 
        className={clsx(
          "flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md transition-colors text-xs font-medium group relative",
          isSelected ? "bg-hytale-accent text-black" : "hover:bg-white/5 text-hytale-text",
          dropPosition === 'nest' && "bg-hytale-accent/20",
          hasErrors && !isSelected && "text-red-400"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleItemClick}
      >
        <div 
            className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded"
            onClick={handleExpandClick}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronRight className="w-3 h-3 opacity-50" />
          ) : null}
        </div>
        <ElementIcon type={el.type} />
        <span className="truncate flex-1">{el.id || el.type}</span>
        {hasErrors && (
            <div className="flex items-center gap-1 group/err p-1" title={elementErrors.map(e => e.message).join('\n')}>
                <AlertCircle size={10} className="text-red-500 animate-pulse" />
            </div>
        )}
        <span className="ml-auto text-[10px] opacity-30 group-hover:opacity-100">{el.type}</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {el.children.map((child, index) => (
            <TreeItem 
              key={child.id || child.__uid || `unnamed-${index}`} 
              el={child} 
              depth={depth + 1} 
              selectedIds={selectedIds} 
              expandedIds={expandedIds}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              onMove={onMove}
              errors={errors}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = ({ root, selectedIds, expandedIds, onToggleSelect, onToggleExpand, onDelete, onMove, errors = [] }) => {
  if (!root) return <div className="p-4 text-xs text-hytale-muted italic">No root element</div>;

  return (
    <div className="p-2 space-y-1 select-none">
      <TreeItem 
        el={root} 
        depth={0} 
        selectedIds={selectedIds} 
        expandedIds={expandedIds}
        onToggleSelect={onToggleSelect} 
        onToggleExpand={onToggleExpand}
        onDelete={onDelete} 
        onMove={onMove}
        errors={errors}
      />
    </div>
  );
};
