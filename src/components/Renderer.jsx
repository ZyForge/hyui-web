import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Move, Maximize2, ChevronDown, Check, AlertCircle } from 'lucide-react';

// --- Hytale-accurate color constants ---
const HYTALE_COLORS = {
  panelBg: '#1a1e2e',
  panelBorder: '#2a3040',
  titleBarBg: '#141828',
  inputBg: '#0f1320',
  inputBorder: '#252a3a',
  inputPlaceholder: '#6e7da1',
  primaryBtn: '#3a7ecf',
  primaryBtnHover: '#4a8edf',
  secondaryBtn: '#3a3f4a',
  cancelBtn: '#cf3a3a',
  textDefault: '#96a9be',
  textTitle: '#b4c8c9',
  textMuted: '#6e7da1',
  separator: '#2a3040',
  checkboxBg: '#0f1320',
  checkboxChecked: '#3a7ecf',
};

// Utility to resolve variable references and expression objects
const resolveValue = (value, variables) => {
  // Arithmetic expression object: { __expr: "36 + 74", __value: 110 }
  if (typeof value === 'object' && value !== null && value.__expr !== undefined) {
    return value.__value;
  }
  if (typeof value === 'string' && value.startsWith('@')) {
    const varName = value.substring(1);
    return variables[varName] !== undefined ? variables[varName] : value;
  }
  return value;
};

// Layout Mode to flex mapping
// Layout Mode to flex mapping
const getLayoutStyles = (mode) => {
  if (mode && !['Top', 'Bottom', 'Left', 'Center', 'Right', 'TopScrolling', 'LeftCenterWrap', 'Middle'].includes(mode)) {
      return { outline: '2px dashed red', outlineOffset: '-2px' }; // Visual error
  }
  switch (mode) {
    case 'Top': return { display: 'flex', flexDirection: 'column', alignItems: 'stretch', overflow: 'visible' };
    case 'Bottom': return { display: 'flex', flexDirection: 'column-reverse', alignItems: 'stretch', overflow: 'visible' };
    case 'Left': return { display: 'flex', flexDirection: 'row', alignItems: 'stretch', overflow: 'visible' };
    case 'Center': return { display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' };
    case 'Middle': return { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'visible' };
    case 'Right': return { display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end', overflow: 'visible' };
    case 'TopScrolling': return { display: 'flex', flexDirection: 'column', alignItems: 'stretch', overflowY: 'auto', overflowX: 'hidden' };
    case 'LeftCenterWrap': return { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', overflow: 'visible' };
    default: return { position: 'relative', overflow: 'visible' };
  }
};

// Parse a hex color with optional alpha: #RRGGBB or #RRGGBB(0.55) or #RRGGBBAA
const parseHexColor = (value) => {
  if (typeof value !== 'string' || !value.startsWith('#')) return null;
  // #RRGGBB(alpha)
  const alphaMatch = value.match(/^(#[0-9a-fA-F]{6,8})\(([0-9.]+)\)$/);
  if (alphaMatch) {
    const hex = alphaMatch[1].replace('#', '');
    const alpha = parseFloat(alphaMatch[2]);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // #RRGGBBAA (8-digit hex)
  if (value.length === 9) {
    const hex = value.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }
  return value; // plain #RRGGBB
};

// Resolve Background property to CSS styles
const resolveBackground = (background, variables) => {
  const bg = resolveValue(background, variables);
  if (!bg) return {};
  
  const fixPath = (path) => {
    if (typeof path !== 'string') return path;
    if (path.startsWith('UI/')) return '/' + path;
    return path;
  };

  // Direct hex color string: #141821 or #000000(0.55)
  if (typeof bg === 'string') {
    if (bg.startsWith('#')) {
      return { backgroundColor: parseHexColor(bg) };
    }
    // Direct image path string: "image.png"
    const path = fixPath(bg);
    return { 
      backgroundImage: `url("${path}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }
  
  // Object form: { Color: "#hex" } or { TexturePath: "..." }
  if (typeof bg === 'object') {
    const styles = {};
    if (bg.Color) {
      styles.backgroundColor = parseHexColor(bg.Color) || bg.Color;
    }
    if (bg.TexturePath) {
      const path = fixPath(resolveValue(bg.TexturePath, variables));
      styles.backgroundImage = `url("${path}")`;
      styles.backgroundSize = 'contain';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    return styles;
  }
  return {};
};

// Resolve Padding property to CSS padding string
const resolvePadding = (padding, variables) => {
  const p = resolveValue(padding, variables);
  if (!p || typeof p !== 'object') return undefined;
  if (p.Full !== undefined) {
    const full = resolveValue(p.Full, variables);
    // Check for Top override: Padding(Full: 17, Top: 8)
    const top = p.Top !== undefined ? resolveValue(p.Top, variables) : full;
    const right = p.Right !== undefined ? resolveValue(p.Right, variables) : full;
    const bottom = p.Bottom !== undefined ? resolveValue(p.Bottom, variables) : full;
    const left = p.Left !== undefined ? resolveValue(p.Left, variables) : full;
    return `${top}px ${right}px ${bottom}px ${left}px`;
  }
  const top = p.Top || p.Vertical || 0;
  const right = p.Right || p.Horizontal || 0;
  const bottom = p.Bottom || p.Vertical || 0;
  const left = p.Left || p.Horizontal || 0;
  return `${top}px ${right}px ${bottom}px ${left}px`;
};

const resolveAnchor = (anchor, variables) => {
  if (!anchor) return {};
  const resolved = {};
  for (const [k, v] of Object.entries(anchor)) {
    resolved[k] = resolveValue(v, variables);
  }
  return resolved;
};

const getAnchorStyles = (anchor, parentLayoutMode) => {
  const styles = {};
  if (anchor.Width !== undefined) styles.width = typeof anchor.Width === 'number' ? `${anchor.Width}px` : anchor.Width;
  if (anchor.Height !== undefined) styles.height = typeof anchor.Height === 'number' ? `${anchor.Height}px` : anchor.Height;
  
  const hasPos = anchor.Top !== undefined || anchor.Bottom !== undefined || anchor.Left !== undefined || anchor.Right !== undefined;
  const isInFlow = parentLayoutMode && parentLayoutMode !== 'None';
  
  const isStretchV = anchor.Top !== undefined && anchor.Bottom !== undefined;
  const isStretchH = anchor.Left !== undefined && anchor.Right !== undefined;

  if (hasPos) {
    if (anchor.Top !== undefined) styles.top = `${anchor.Top}px`;
    if (anchor.Bottom !== undefined) styles.bottom = `${anchor.Bottom}px`;
    if (anchor.Left !== undefined) styles.left = `${anchor.Left}px`;
    if (anchor.Right !== undefined) styles.right = `${anchor.Right}px`;

    const isFullStretch = isStretchV && isStretchH;
    
    if (!isInFlow || isFullStretch) {
      styles.position = 'absolute';
      if (isStretchV) { styles.top = `${anchor.Top}px`; styles.bottom = `${anchor.Bottom}px`; styles.height = 'auto'; }
      if (isStretchH) { styles.left = `${anchor.Left}px`; styles.right = `${anchor.Right}px`; styles.width = 'auto'; }
    } else {
      styles.position = 'relative';
      if (isStretchV) styles.height = '100%';
      if (isStretchH) styles.width = '100%';

      // Apply single-sided anchors as margins if in flow
      if (!isStretchV) {
        if (anchor.Top !== undefined) styles.marginTop = `${anchor.Top}px`;
        if (anchor.Bottom !== undefined) styles.marginBottom = `${anchor.Bottom}px`;
      }
      if (!isStretchH) {
        if (anchor.Left !== undefined) styles.marginLeft = `${anchor.Left}px`;
        if (anchor.Right !== undefined) styles.marginRight = `${anchor.Right}px`;
      }
    }
  }

  return styles;
};

const SelectionOverlay = ({ elDiv, anchor, onUpdate, gridSettings = {} }) => {
  const [activeHandle, setActiveHandle] = useState(null);

  const isStretchH = anchor.Left !== undefined && anchor.Right !== undefined;
  const isStretchV = anchor.Top !== undefined && anchor.Bottom !== undefined;
  const isFullStretch = isStretchH && isStretchV; // Element fills parent entirely — no move
  const hasNoAnchor = Object.keys(anchor).length === 0; // Flow-positioned elements — no move

  const startInteraction = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!elDiv) return;

    const elRect = elDiv.getBoundingClientRect();
    const stage = elDiv.closest('[data-logical-stage]');
    const stageRect = stage ? stage.getBoundingClientRect() : null;
    const scale = stageRect ? stageRect.width / 1920 : 1;

    const initialAnchor = { ...anchor };
    // Always use logical pixels
    const initialWidth = initialAnchor.Width || (elRect.width / scale);
    const initialHeight = initialAnchor.Height || (elRect.height / scale);

    // For move: position relative to the PARENT element, not the canvas
    const parentDiv = elDiv.parentElement?.closest('[data-element-wrapper]') || elDiv.parentElement;
    const parentRect = parentDiv ? parentDiv.getBoundingClientRect() : elRect;

    // Mouse offset within the element (physical)
    const offsetX = e.clientX - elRect.left;
    const offsetY = e.clientY - elRect.top;

    const handleMouseMove = (moveEvent) => {
      const currentStageRect = stage.getBoundingClientRect();
      const currentScale = currentStageRect.width / 1920;
      let newAnchor = { ...initialAnchor };

      if (mode === 'move') {
        // Compute physical position relative to parent
        const newLeftPhysical = moveEvent.clientX - parentRect.left - offsetX;
        const newTopPhysical = moveEvent.clientY - parentRect.top - offsetY;
        
        // Convert to logical
        let newLeft = newLeftPhysical / currentScale;
        let newTop = newTopPhysical / currentScale;

        // --- Magnet Snapping (Other Elements) ---
        // Find all other elements in the stage for snapping
        const otherElements = Array.from(stage.querySelectorAll('[data-element-wrapper]'))
          .filter(el => el !== elDiv && !elDiv.contains(el));
        
        const SNAP_THRESHOLD = 8;
        
        for (const other of otherElements) {
          const oRect = other.getBoundingClientRect();
          const pRect = parentRect;
          
          // Convert other's physical relative to current parent
          const oLeft = (oRect.left - pRect.left) / currentScale;
          const oTop = (oRect.top - pRect.top) / currentScale;
          const oRight = (oRect.right - pRect.left) / currentScale;
          const oBottom = (oRect.bottom - pRect.top) / currentScale;

          // Snap Left to other's Left or Right
          if (Math.abs(newLeft - oLeft) < SNAP_THRESHOLD) newLeft = oLeft;
          else if (Math.abs(newLeft - oRight) < SNAP_THRESHOLD) newLeft = oRight;

          // Snap Top to other's Top or Bottom
          if (Math.abs(newTop - oTop) < SNAP_THRESHOLD) newTop = oTop;
          else if (Math.abs(newTop - oBottom) < SNAP_THRESHOLD) newTop = oBottom;
          
          // Snap Right edge (Left + Width) to other's Left
          const newRight = newLeft + initialWidth;
          if (Math.abs(newRight - oLeft) < SNAP_THRESHOLD) newLeft = oLeft - initialWidth;
          else if (Math.abs(newRight - oRight) < SNAP_THRESHOLD) newLeft = oRight - initialWidth;
        }

        // --- Grid Snapping (Overrides magnet if prioritized) ---
        if (gridSettings.snap && gridSettings.size) {
          newLeft = Math.round(newLeft / gridSettings.size) * gridSettings.size;
          newTop = Math.round(newTop / gridSettings.size) * gridSettings.size;
        }

        // Parent Edge Snapping
        if (Math.abs(newLeft) < 8) newLeft = 0;
        if (Math.abs(newTop) < 8) newTop = 0;

        newAnchor.Left = Math.round(newLeft);
        newAnchor.Top = Math.round(newTop);
        delete newAnchor.Right;
        delete newAnchor.Bottom;
        
        if (!newAnchor.Width) newAnchor.Width = Math.round(initialWidth);
        if (!newAnchor.Height) newAnchor.Height = Math.round(initialHeight);
      } else if (mode === 'resize') {
        const dxPhysical = moveEvent.clientX - e.clientX;
        const dyPhysical = moveEvent.clientY - e.clientY;
        
        let newWidth = initialWidth + dxPhysical / currentScale;
        let newHeight = initialHeight + dyPhysical / currentScale;

        if (gridSettings.snap && gridSettings.size) {
          newWidth = Math.round(newWidth / gridSettings.size) * gridSettings.size;
          newHeight = Math.round(newHeight / gridSettings.size) * gridSettings.size;
        }

        newAnchor.Width = Math.max(10, Math.round(newWidth));
        newAnchor.Height = Math.max(10, Math.round(newHeight));
      }
      onUpdate({ properties: { Anchor: newAnchor } });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setActiveHandle(null);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    setActiveHandle(mode);
  };

  const canMove = !isFullStretch && !hasNoAnchor;

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
      border: '2px solid #4cc9f0',
    }}>
      {/* Move Handle — hidden for stretch/fill elements */}
      {canMove && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, transform: 'translate(-50%, -50%)',
            width: 20, height: 20, background: '#4cc9f0', borderRadius: '50%',
            cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => startInteraction(e, 'move')}
          title="Drag to Move"
        >
          <Move style={{ width: 10, height: 10, color: 'black' }} />
        </div>
      )}
      {/* Stretch indicator for fill elements */}
      {isFullStretch && (
        <div style={{
          position: 'absolute', top: 4, left: 4,
          padding: '1px 5px', background: '#4cc9f0', color: 'black',
          fontSize: 8, fontWeight: 900, letterSpacing: '0.05em',
        }}>
          FILL
        </div>
      )}
      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute', bottom: 0, right: 0, transform: 'translate(50%, 50%)',
          width: 16, height: 16, background: 'white', border: '2px solid #4cc9f0',
          cursor: 'se-resize', pointerEvents: 'auto',
        }}
        onMouseDown={(e) => startInteraction(e, 'resize')}
        title="Drag to Resize"
      />
      {/* Label */}
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        marginTop: 4, padding: '2px 6px', background: '#4cc9f0', color: 'black',
        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
      }}>
        {elDiv?.id || 'UNKNOWN'}
      </div>
    </div>
  );
};

// --- Element Renderers (Hytale-accurate, flat, property-driven only) ---

const LabelElement = ({ properties, variables }) => {
  const text = resolveValue(properties.Text, variables) || '';
  const style = resolveValue(properties.Style, variables) || {};
  const fontSize = resolveValue(style.FontSize, variables) || 16;
  const textColor = resolveValue(style.TextColor, variables) || HYTALE_COLORS.textDefault;
  const uppercase = resolveValue(style.RenderUppercase, variables);
  const bold = resolveValue(style.RenderBold, variables);
  const hAlign = resolveValue(style.HorizontalAlignment, variables);
  const vAlign = resolveValue(style.VerticalAlignment, variables);
  const wrap = resolveValue(style.Wrap, variables);
  const letterSpacing = resolveValue(style.LetterSpacing, variables);

  const justifyContent = hAlign === 'Center' ? 'center' : hAlign === 'End' ? 'flex-end' : 'flex-start';
  const alignItems = vAlign === 'Center' ? 'center' : vAlign === 'End' ? 'flex-end' : 'flex-start';

  return (
    <div style={{
      display: 'flex', justifyContent, alignItems,
      fontSize: `${fontSize}px`,
      color: textColor,
      fontWeight: bold ? 'bold' : 'normal',
      textTransform: uppercase ? 'uppercase' : 'none',
      whiteSpace: wrap ? 'normal' : 'nowrap',
      wordWrap: wrap ? 'break-word' : undefined,
      letterSpacing: letterSpacing !== undefined ? `${letterSpacing}px` : undefined,
      width: '100%', height: '100%',
    }}>
      {text}
    </div>
  );
};

// --- Common.ui Component Renderers ---
const CommonComponents = {
  '$C.@Container': ({ properties, children, variables, renderChildren }) => {
    const padding = resolveValue(properties['@ContentPadding'], variables) || {};
    const hasClose = resolveValue(properties['@CloseButton'], variables);
    return (
      <div style={{
        background: HYTALE_COLORS.panelBg,
        border: `1px solid ${HYTALE_COLORS.panelBorder}`,
        display: 'flex', flexDirection: 'column',
        width: '100%', height: '100%', overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          height: 38, background: HYTALE_COLORS.titleBarBg,
          borderBottom: `1px solid ${HYTALE_COLORS.panelBorder}`,
          display: 'flex', alignItems: 'center', padding: '0 12px',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {children.some(c => c.id === 'Title')
              ? renderChildren(children.filter(c => c.id === 'Title'))
              : <span style={{ color: HYTALE_COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>Untitled</span>
            }
          </div>
          {hasClose && (
            <div style={{
              width: 20, height: 20, background: '#cf3a3a', border: '1px solid #9a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 'bold', color: 'white',
            }}>✕</div>
          )}
        </div>
        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: padding.Full
            ? `${padding.Full}px`
            : `${padding.Top || 0}px ${padding.Right || 0}px ${padding.Bottom || 0}px ${padding.Left || 0}px`,
        }}>
          {renderChildren(children.filter(c => c.id !== 'Title'))}
        </div>
      </div>
    );
  },

  '$C.@DecoratedContainer': ({ properties, children, variables, renderChildren }) => {
    const padding = resolveValue(properties['@ContentPadding'], variables) || {};
    const hasClose = resolveValue(properties['@CloseButton'], variables);
    return (
      <div style={{
        background: HYTALE_COLORS.panelBg,
        border: `2px solid ${HYTALE_COLORS.panelBorder}`,
        display: 'flex', flexDirection: 'column',
        width: '100%', height: '100%', overflow: 'hidden',
      }}>
        <div style={{
          height: 38, background: HYTALE_COLORS.titleBarBg,
          borderBottom: `2px solid ${HYTALE_COLORS.panelBorder}`,
          display: 'flex', alignItems: 'center', padding: '0 12px',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {children.some(c => c.id === 'Title')
              ? renderChildren(children.filter(c => c.id === 'Title'))
              : <span style={{ color: HYTALE_COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>Untitled</span>
            }
          </div>
          {hasClose && (
            <div style={{
              width: 20, height: 20, background: '#cf3a3a', border: '1px solid #9a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 'bold', color: 'white',
            }}>✕</div>
          )}
        </div>
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: padding.Full
            ? `${padding.Full}px`
            : `${padding.Top || 0}px ${padding.Right || 0}px ${padding.Bottom || 0}px ${padding.Left || 0}px`,
        }}>
          {renderChildren(children.filter(c => c.id !== 'Title'))}
        </div>
      </div>
    );
  },

  '$C.@TextButton': ({ properties, variables }) => {
    const text = resolveValue(properties['@Text'], variables) || 'BUTTON';
    return (
      <button style={{
        background: HYTALE_COLORS.primaryBtn,
        border: `1px solid #2a5e9f`,
        color: 'white', fontWeight: 'bold', fontSize: 14,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        width: '100%', height: '100%',
        cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {text}
      </button>
    );
  },

  '$C.@SecondaryTextButton': ({ properties, variables }) => {
    const text = resolveValue(properties['@Text'], variables) || 'BUTTON';
    return (
      <button style={{
        background: HYTALE_COLORS.secondaryBtn,
        border: `1px solid #2a2f3a`,
        color: HYTALE_COLORS.textDefault, fontWeight: 'bold', fontSize: 14,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        width: '100%', height: '100%',
        cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {text}
      </button>
    );
  },

  '$C.@CancelTextButton': ({ properties, variables }) => {
    const text = resolveValue(properties['@Text'], variables) || 'CANCEL';
    return (
      <button style={{
        background: HYTALE_COLORS.cancelBtn,
        border: `1px solid #9a2a2a`,
        color: 'white', fontWeight: 'bold', fontSize: 14,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        width: '100%', height: '100%',
        cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {text}
      </button>
    );
  },

  '$C.@TextField': ({ properties, variables }) => {
    const placeholder = resolveValue(properties.PlaceholderText, variables) || '';
    return (
      <div style={{
        background: HYTALE_COLORS.inputBg,
        border: `1px solid ${HYTALE_COLORS.inputBorder}`,
        color: placeholder ? HYTALE_COLORS.inputPlaceholder : HYTALE_COLORS.textDefault,
        fontSize: 14, padding: '0 10px',
        display: 'flex', alignItems: 'center',
        width: '100%', height: '100%',
        fontStyle: placeholder ? 'italic' : 'normal',
      }}>
        {placeholder || ''}
      </div>
    );
  },

  '$C.@NumberField': ({ properties, variables }) => {
    const value = resolveValue(properties.Value, variables);
    return (
      <div style={{
        background: HYTALE_COLORS.inputBg,
        border: `1px solid ${HYTALE_COLORS.inputBorder}`,
        color: HYTALE_COLORS.textDefault,
        fontSize: 14, padding: '0 10px',
        display: 'flex', alignItems: 'center',
        width: '100%', height: '100%',
      }}>
        {value !== undefined ? String(value) : '0'}
      </div>
    );
  },

  '$C.@DropdownBox': ({ properties, variables }) => {
    return (
      <div style={{
        background: HYTALE_COLORS.inputBg,
        border: `1px solid ${HYTALE_COLORS.inputBorder}`,
        color: HYTALE_COLORS.textMuted,
        fontSize: 14, padding: '0 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', height: '100%',
      }}>
        <span style={{ fontStyle: 'italic' }}>Select...</span>
        <ChevronDown style={{ width: 14, height: 14, color: HYTALE_COLORS.textMuted }} />
      </div>
    );
  },

  '$C.@CheckBoxWithLabel': ({ properties, variables }) => {
    const text = resolveValue(properties['@Text'], variables) || '';
    const checked = resolveValue(properties['@Checked'], variables) || false;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', height: '100%',
      }}>
        <div style={{
          width: 22, height: 22, flexShrink: 0,
          background: checked ? HYTALE_COLORS.checkboxChecked : HYTALE_COLORS.checkboxBg,
          border: `1px solid ${checked ? '#2a5e9f' : HYTALE_COLORS.inputBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {checked && <Check style={{ width: 14, height: 14, color: 'white' }} />}
        </div>
        <span style={{ color: HYTALE_COLORS.textDefault, fontSize: 14 }}>{text}</span>
      </div>
    );
  },

  '$C.@Panel': ({ properties, children, variables, renderChildren }) => {
    return (
      <div style={{
        background: HYTALE_COLORS.panelBg,
        border: `1px solid ${HYTALE_COLORS.panelBorder}`,
        width: '100%', height: '100%',
      }}>
        {renderChildren(children)}
      </div>
    );
  },

  '$C.@PageOverlay': ({ properties, children, variables, renderChildren }) => {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {renderChildren(children)}
      </div>
    );
  },

  '$C.@ContentSeparator': ({ properties, variables }) => {
    return (
      <div style={{
        width: '100%', height: 1,
        background: HYTALE_COLORS.separator,
      }} />
    );
  },

  '$C.@VerticalSeparator': () => {
    return (
      <div style={{
        width: 6, height: '100%',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: 1, height: '100%', background: HYTALE_COLORS.separator }} />
      </div>
    );
  },

  '$C.@Title': ({ properties, variables }) => {
    const text = resolveValue(properties['@Text'], variables) || '';
    const alignment = resolveValue(properties['@Alignment'], variables) || 'Start';
    const justifyContent = alignment === 'Center' ? 'center' : alignment === 'End' ? 'flex-end' : 'flex-start';
    return (
      <div style={{
        fontSize: 15, fontWeight: 'bold', textTransform: 'uppercase',
        color: HYTALE_COLORS.textTitle,
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center',
        justifyContent,
      }}>
        {text}
      </div>
    );
  },

  '$C.@Subtitle': ({ properties, variables }) => {
    const text = resolveValue(properties['@Text'], variables) || '';
    return (
      <div style={{
        fontSize: 15, textTransform: 'uppercase',
        color: HYTALE_COLORS.textMuted,
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center',
      }}>
        {text}
      </div>
    );
  },

  '$C.@CloseButton': () => {
    return (
      <div style={{
        width: 32, height: 32,
        background: '#cf3a3a', border: '1px solid #9a2a2a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 'bold', color: 'white',
        cursor: 'default',
      }}>✕</div>
    );
  },
};

const getElementKey = (element) => element.id || element.__uid;

// --- Main Element Renderer (Recursive) ---
export const BaseElement = ({ element, variables, selectedIds, onSelect, onUpdate, children, style = {}, className = "", errors = [], gridSettings = {}, parentLayoutMode = 'None' }) => {
  const isSelected = selectedIds.includes(element.id) || selectedIds.includes(element.__uid);
  const elementErrors = errors.filter(e => e.elementId === element.id || e.elementId === element.__uid);
  const hasErrors = elementErrors.length > 0;

  const handleClick = (e) => {
    if (e.defaultPrevented) return;
    e.stopPropagation();
    if (onSelect) onSelect(element.id || element.__uid, e.shiftKey || e.ctrlKey || e.metaKey);
  };
  const elRef = useRef(null);

  const isVisible = element.properties.Visible !== false;

  if (!isVisible) return null;

  const anchor = resolveAnchor(element.properties.Anchor, variables);
  const anchorStyles = getAnchorStyles(anchor, parentLayoutMode);

  // Function to update this specific element's properties
  const updateThisElement = (newProps) => {
    if (onUpdate) {
      onUpdate(element.id || element.__uid, newProps);
    }
  };

  return (
    <div
      data-element-wrapper
      id={element.id || element.__uid}
      ref={elRef}
      className={clsx(
        "relative transition-all duration-200",
        isSelected && "outline outline-2 outline-hytale-accent outline-offset-1 z-50",
        hasErrors && "outline outline-2 outline-red-500/50 outline-offset-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
        className
      )}
      style={{ position: 'relative', ...anchorStyles, cursor: 'default', ...style }}
      onClick={handleClick}
    >
      {/* Selection Label */}
      {isSelected && (
        <div className="absolute -top-7 left-0 bg-hytale-accent text-black text-[9px] font-black px-2 py-1 rounded shadow-xl flex items-center gap-2 whitespace-nowrap z-[100] animate-in slide-in-from-bottom-1 duration-200">
          <span className="uppercase tracking-widest">{element.type}</span>
          <span className="opacity-40 font-mono">#{element.id || 'anonymous'}</span>
        </div>
      )}

      {/* Error Indicator */}
      {hasErrors && (
        <div className="absolute -top-7 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl flex items-center gap-2 whitespace-nowrap z-[100] group/error">
          <AlertCircle size={10} className="animate-pulse" strokeWidth={3} />
          <span className="uppercase tracking-widest">{elementErrors.length} {elementErrors.length === 1 ? 'ERROR' : 'ERRORS'}</span>
          
          {/* Detailed Error Tooltip */}
          <div className="absolute top-full right-0 mt-2 w-72 bg-[#0a0a0a] border border-red-500/50 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl hidden group-hover/error:block pointer-events-none z-[110] animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-3">
                {elementErrors.map((err, i) => (
                    <div key={i} className="text-[10px] text-red-400 font-bold leading-relaxed border-b border-white/5 last:border-0 pb-2 last:pb-0 break-words whitespace-normal">
                        <span className="text-red-500 mr-1.5">•</span>{err.message}
                    </div>
                ))}
            </div>
            {/* Arrow */}
            <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[#0a0a0a] border-t border-l border-red-500/50 rotate-45" />
          </div>
        </div>
      )}

      {children}

      {isSelected && elRef.current && (
        <SelectionOverlay 
          elDiv={elRef.current} 
          anchor={anchor} 
          onUpdate={updateThisElement} 
          gridSettings={gridSettings}
        />
      )}
    </div>
  );
};

export const HytaleElement = ({ element, variables = {}, selectedIds = [], onSelect, onUpdate, gridSettings = {}, errors = [], parentLayoutMode = 'None' }) => {
  if (!element) return null;

  const renderChildren = (children, newParentLayoutMode) => {
    return (children || []).map((child, index) => (
      <HytaleElement
        key={getElementKey(child) || `unnamed-${index}`}
        element={{ ...child, _hasParent: true }}
        variables={variables}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onUpdate={onUpdate}
        gridSettings={gridSettings}
        errors={errors}
        parentLayoutMode={newParentLayoutMode || layoutMode}
      />
    ));
  };

  // Common component rendering
  if (CommonComponents[element.type]) {
    const Comp = CommonComponents[element.type];
    return (
      <BaseElement
        element={element}
        variables={variables}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onUpdate={onUpdate}
        gridSettings={gridSettings}
        errors={errors}
      >
        <Comp
          properties={{ ...element.properties, Anchor: {} }}
          children={element.children}
          variables={variables}
          renderChildren={(childs) => renderChildren(childs, layoutMode)}
        />
      </BaseElement>
    );
  }

  // Standard element rendering
  let content = null;
  const layoutMode = resolveValue(element.properties.LayoutMode, variables);
  const layoutStyles = getLayoutStyles(layoutMode);

  // Background
  const bgStyles = resolveBackground(element.properties.Background, variables);

  // Padding
  const paddingVal = resolvePadding(element.properties.Padding, variables);
  const paddingStyles = paddingVal ? { padding: paddingVal, boxSizing: 'border-box' } : {};

  const flexWeight = resolveValue(element.properties.FlexWeight, variables);
  const flexStyles = {};
  if (flexWeight !== undefined) {
    flexStyles.flex = flexWeight;
  }

  switch (element.type) {
    case 'Group':
      content = (
        <div style={{ ...layoutStyles, ...bgStyles, ...paddingStyles, ...flexStyles, width: '100%', height: '100%' }}>
          {renderChildren(element.children)}
        </div>
      );
      break;
    case 'Label':
      content = <LabelElement properties={element.properties} variables={variables} />;
      break;
    case 'TextButton': {
      const text = resolveValue(element.properties.Text, variables) || '';
      const style = resolveValue(element.properties.Style, variables) || {};
      // Extract label style from TextButtonStyle if present
      const defaultState = style.Default || {};
      const labelStyle = defaultState.LabelStyle || {};
      const btnBg = resolveBackground(defaultState.Background, variables);
      content = (
        <div style={{
          ...btnBg, ...paddingStyles,
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: labelStyle.TextColor || '#bfcdd5',
          fontSize: labelStyle.FontSize ? `${labelStyle.FontSize}px` : '17px',
          fontWeight: labelStyle.RenderBold ? 'bold' : 'normal',
          textTransform: labelStyle.RenderUppercase ? 'uppercase' : 'none',
          letterSpacing: '0.05em',
          cursor: 'default',
        }}>
          {text}
        </div>
      );
      break;
    }
    case 'Button': {
      const style = resolveValue(element.properties.Style, variables) || {};
      const defaultState = style.Default || {};
      const btnBg = resolveBackground(defaultState.Background, variables);
      content = (
        <div style={{
          ...btnBg, ...paddingStyles,
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'default',
        }}>
          {renderChildren(element.children)}
        </div>
      );
      break;
    }
    case 'ProgressBar': {
      const value = resolveValue(element.properties.Value, variables) || 0;
      const barTexture = resolveValue(element.properties.BarTexturePath, variables);
      
      const fixPath = (path) => {
        if (typeof path !== 'string') return path;
        if (path.startsWith('UI/')) return '/' + path;
        if (path.startsWith('Textures/')) return '/' + path; // SoulHarvest local textures
        return path;
      };

      const barPath = fixPath(barTexture);

      content = (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#0b0f15', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%',
            backgroundColor: barPath ? 'transparent' : '#3a7ecf',
            backgroundImage: barPath ? `url("${barPath}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
            transition: 'width 0.3s ease',
          }} />
        </div>
      );
      break;
    }
    case 'TextField':
    case 'NumberField': {
      const placeholder = resolveValue(element.properties.PlaceholderText, variables) || '';
      content = (
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: HYTALE_COLORS.inputBg,
          border: `1px solid ${HYTALE_COLORS.inputBorder}`,
          display: 'flex', alignItems: 'center',
          ...paddingStyles,
          color: HYTALE_COLORS.inputPlaceholder, fontSize: '14px', fontStyle: 'italic',
        }}>
          {placeholder}
        </div>
      );
      break;
    }
    case 'CheckBox': {
      content = (
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: HYTALE_COLORS.checkboxBg,
          border: `1px solid ${HYTALE_COLORS.inputBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check style={{ width: 14, height: 14, color: HYTALE_COLORS.textMuted }} />
        </div>
      );
      break;
    }
    case 'Image':
    case 'Sprite': {
      const texPath = resolveValue(element.properties.TexturePath, variables);
      const fixPath = (path) => {
        if (typeof path !== 'string') return path;
        if (path.startsWith('UI/')) return '/' + path;
        return path;
      };
      
      const path = fixPath(texPath);
      content = (
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: path ? `url("${path}")` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!path && (
            <div style={{
              fontSize: 9, color: HYTALE_COLORS.textMuted,
              border: '1px dashed rgba(255,255,255,0.2)',
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {element.type.toUpperCase()}
            </div>
          )}
        </div>
      );
      break;
    }
    case 'DropdownBox': {
      content = (
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: HYTALE_COLORS.inputBg,
          border: `1px solid ${HYTALE_COLORS.inputBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          ...paddingStyles,
          color: HYTALE_COLORS.textDefault, fontSize: '13px',
        }}>
          <span style={{ opacity: 0.6 }}>Select...</span>
          <ChevronDown style={{ width: 12, height: 12, color: HYTALE_COLORS.textMuted }} />
        </div>
      );
      break;
    }
    case 'CompactTextField': {
      content = (
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: HYTALE_COLORS.inputBg,
          border: `1px solid ${HYTALE_COLORS.inputBorder}`,
          display: 'flex', alignItems: 'center',
          ...paddingStyles,
          color: HYTALE_COLORS.inputPlaceholder, fontSize: '14px',
        }}>
          {resolveValue(element.properties.PlaceholderText, variables) || ''}
        </div>
      );
      break;
    }
    default:
      // Unknown element type — render as container with dashed border
      content = (
        <div style={{
          ...layoutStyles, ...bgStyles, ...paddingStyles, ...flexStyles,
          width: '100%', height: '100%',
          border: '1px dashed rgba(255,255,255,0.15)',
        }}>
          {renderChildren(element.children)}
        </div>
      );
  }

  // Root element behavior:
  // 1. If no sizing or positioning is defined, it's a viewport-filler (standard HUD container).
  // 2. If it has size but no positioning, it's a window that should be centered (standard Page/Menu).
  const isRoot = !element._hasParent;
  const rootStyles = {};
  const anchor = resolveAnchor(element.properties.Anchor, variables);
  
  if (isRoot) {
    const hasSize = anchor.Width !== undefined || anchor.Height !== undefined;
    const hasPos = anchor.Top !== undefined || anchor.Bottom !== undefined || anchor.Left !== undefined || anchor.Right !== undefined;
    if (!hasSize && !hasPos) {
      rootStyles.width = '100%';
      rootStyles.height = '100%';
    } else if (hasSize && !hasPos) {
      rootStyles.position = 'absolute';
      rootStyles.left = '50%';
      rootStyles.top = '50%';
      rootStyles.transform = 'translate(-50%, -50%)';
    }
  }

  return (
    <BaseElement
      element={element}
      variables={variables}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onUpdate={onUpdate}
      gridSettings={gridSettings}
      errors={errors}
      style={{ ...flexStyles, ...rootStyles }}
      parentLayoutMode={parentLayoutMode}
    >
      {content}
    </BaseElement>
  );
};

// --- Entry Point Wrapper with Logical Viewport Scaling ---
export const HytaleRenderer = ({ element, variables = {}, selectedIds = [], onSelect, onUpdate, gridSettings = {}, bgMode, zoom = 1, errors = [] }) => {
  const containerRef = useRef(null);
  const [autoScale, setAutoScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setAutoScale(Math.min(width / 1920, height / 1080));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!element) return null;

  const bgImage = bgMode === 'ui' ? '/ScreenshotWithUI.png' : bgMode === 'clean' ? '/Screenshot.png' : null;
  const finalScale = autoScale * zoom;

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-visible flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onSelect(null); }}
    >
      {/* Logical Viewport Stage */}
      <div 
        data-logical-stage
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${finalScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          flexShrink: 0,
          position: 'relative',
          backgroundColor: bgMode === 'flat' ? '#1a1d24' : 'black',
          pointerEvents: 'auto',
          // Combined Background & Grid Overlay
          backgroundImage: gridSettings.visible ? `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px),
            ${bgImage ? `url(${bgImage})` : 'none'}
          ` : (bgImage ? `url(${bgImage})` : 'none'),
          backgroundSize: gridSettings.visible ? `${gridSettings.size}px ${gridSettings.size}px, ${gridSettings.size}px ${gridSettings.size}px, cover` : 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 0 100px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.1)'
         }}
      >
        <HytaleElement 
          element={element}
          variables={variables}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onUpdate={onUpdate}
          gridSettings={gridSettings}
          errors={errors}
        />
      </div>
      
      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-mono text-hytale-muted pointer-events-none select-none z-50">
        RESOLUTION: 1920x1080 <span className="text-hytale-accent ml-2">ZOOM: {Math.round(finalScale * 100)}%</span>
      </div>
    </div>
  );
};