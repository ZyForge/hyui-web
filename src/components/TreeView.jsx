import React from 'react';
import { ChevronRight, ChevronDown, MousePointer2, Box, Type, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

const ElementIcon = ({ type }) => {
  if (type.includes('Label')) return <Type className="w-3.5 h-3.5" />;
  if (type.includes('Image')) return <ImageIcon className="w-3.5 h-3.5" />;
  if (type.includes('Container')) return <Box className="w-3.5 h-3.5" />;
  if (type.includes('Button')) return <MousePointer2 className="w-3.5 h-3.5" />;
  return <Box className="w-3.5 h-3.5" />;
};

const TreeItem = ({ el, depth, selectedIds, expandedIds, onToggleSelect, onToggleExpand, onDelete }) => {
  const elKey = el.id || el.__uid;
  const isSelected = selectedIds.includes(elKey);
  const isExpanded = expandedIds.has(elKey);
  const hasChildren = el.children && el.children.length > 0;
  
  const handleItemClick = (e) => {
    e.stopPropagation();
    onToggleSelect(elKey, e.shiftKey || e.ctrlKey || e.metaKey);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    onToggleExpand(elKey);
  };
  
  return (
    <div>
      <div 
        className={clsx(
          "flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md transition-colors text-xs font-medium group",
          isSelected ? "bg-hytale-accent text-black" : "hover:bg-white/5 text-hytale-text"
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = ({ root, selectedIds, expandedIds, onToggleSelect, onToggleExpand, onDelete }) => {
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
      />
    </div>
  );
};
