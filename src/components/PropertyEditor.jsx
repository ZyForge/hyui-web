import React, { useMemo, useState } from 'react';
import { Settings, Settings2, Layout, Plus, X, ChevronDown, Lock, Unlock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

// Known Hytale predefined styles (from Common.ui docs & Syntax Rules)
const KNOWN_STYLE_PRESETS = {
  '@HeaderStyle': { FontSize: 20, TextColor: '#FFFFFF', HorizontalAlignment: 'Center' },
  '@DefaultLabelStyle': { FontSize: 16, TextColor: '#96a9be', HorizontalAlignment: 'Start', VerticalAlignment: 'Start', Bold: false, RenderUppercase: false },
  '@DefaultButtonLabelStyle': { FontSize: 14, TextColor: '#FFFFFF', Bold: true, RenderUppercase: true, HorizontalAlignment: 'Center' },
  '@TitleStyle': { FontSize: 15, TextColor: '#b4c8c9', Bold: true, RenderUppercase: true, HorizontalAlignment: 'Start' },
  '@SubtitleStyle': { FontSize: 15, TextColor: '#6e7da1', Bold: false, RenderUppercase: true, HorizontalAlignment: 'Start' },
};

// Full Hytale-documented property schemas
const SCHEMA_DEFINITIONS = {
  'Group': {
    'LayoutMode': { type: 'select', options: ['Top', 'Left', 'Center', 'Right', 'TopScrolling'] },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
    'Background': { type: 'object', subkeys: ['Color', 'Alpha', 'TexturePath'], default: { Color: '#000000', Alpha: 1.0 } },
    'FlexWeight': { type: 'number', default: 1 },
    'ContentPadding': { type: 'object', subkeys: ['Full', 'Top', 'Bottom', 'Left', 'Right'], default: { Full: 0 } },
    'Visible': { type: 'boolean', default: true },
  },
  'Label': {
    'Text': { type: 'string', default: '' },
    'Style': { type: 'style', subkeys: ['FontSize', 'TextColor', 'RenderUppercase', 'HorizontalAlignment', 'VerticalAlignment', 'Bold'], default: { FontSize: 16, TextColor: '#96a9be' } },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right', 'Scale'], default: {} },
    'Visible': { type: 'boolean', default: true },
  },
  'Image': {
    'TexturePath': { type: 'string', default: '' },
    'Style': { type: 'object', subkeys: ['HorizontalAlignment', 'VerticalAlignment'], default: {} },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
  },
  'ProgressBar': {
    'Value': { type: 'number', default: 0.5 },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 200, Height: 20 } },
  },
  'Button': {
    'Style': { type: 'object', subkeys: ['HorizontalAlignment', 'VerticalAlignment'], default: {} },
    '@Text': { type: 'string', default: 'Button' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
  },
  'Sprite': {
    'TexturePath': { type: 'string', default: '' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
  },
  '$C.@TextButton': {
    '@Text': { type: 'string', default: 'Button' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
    '@Sounds': { type: 'string', default: '' },
  },
  '$C.@SecondaryTextButton': {
    '@Text': { type: 'string', default: 'Button' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
  },
  '$C.@CancelTextButton': {
    '@Text': { type: 'string', default: 'Cancel' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
  },
  '$C.@TextField': {
    'PlaceholderText': { type: 'string', default: '' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Height: 38 } },
    'FlexWeight': { type: 'number', default: 1 },
  },
  '$C.@NumberField': {
    'Value': { type: 'number', default: 0 },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 80, Height: 38 } },
  },
  '$C.@DropdownBox': {
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 200, Height: 32 } },
  },
  '$C.@Container': {
    '@CloseButton': { type: 'boolean', default: true },
    '@ContentPadding': { type: 'object', subkeys: ['Full', 'Top', 'Bottom', 'Left', 'Right'], default: { Full: 0 } },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 400, Height: 300 } },
  },
  '$C.@DecoratedContainer': {
    '@CloseButton': { type: 'boolean', default: true },
    '@ContentPadding': { type: 'object', subkeys: ['Full', 'Top', 'Bottom', 'Left', 'Right'], default: { Full: 0 } },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 400, Height: 300 } },
  },
  '$C.@CheckBoxWithLabel': {
    '@Text': { type: 'string', default: '' },
    '@Checked': { type: 'boolean', default: false },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Height: 28 } },
  },
  '$C.@Panel': {
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
  },
  '$C.@Title': {
    '@Text': { type: 'string', default: '' },
    '@Alignment': { type: 'select', options: ['Start', 'Center', 'End'] },
  },
  '$C.@Subtitle': {
    '@Text': { type: 'string', default: '' },
  },
  '$C.@CloseButton': {},
};

// --- Style Reference Field ---
// When a style value is a string reference like "@HeaderStyle", render read-only with an Edit button
// --- Style Reference Field ---
function StyleReferenceField({ label, value, onChange, onRemove, schema, variables, onVariableUpdate, errors = [] }) {
  const [isEditingSource, setIsEditingSource] = useState(false);
  const refName = value; // e.g. "@HeaderStyle"
  const varKey = refName.substring(1);
  const resolvedProps = KNOWN_STYLE_PRESETS[refName] || (variables && variables[varKey]) || null;
  const isLocalVar = variables && variables[varKey] !== undefined;

  return (
    <div className="space-y-2 border-l-2 border-hytale-accent/20 pl-3 mt-4 first:mt-0">
      <div className="flex items-center justify-between group">
        <label className="text-[10px] uppercase tracking-widest text-hytale-accent/60 font-black">{label}</label>
        <div className="flex items-center gap-1">
          {onRemove && <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded text-red-500 transition-all"><X className="w-3 h-3"/></button>}
        </div>
      </div>
      
      <div className={clsx(
          "flex items-center gap-2 bg-black/20 border rounded px-3 py-1.5 transition-all",
          isEditingSource ? "border-hytale-accent/50 bg-hytale-accent/5 shadow-[0_0_15px_rgba(var(--hytale-accent-rgb),0.1)]" : "border-white/5"
      )}>
        <Lock className={clsx("w-3 h-3 flex-shrink-0 transition-colors", isEditingSource ? "text-hytale-accent" : "text-hytale-accent/40")} />
        <span className="text-xs font-mono text-hytale-accent flex-1">{refName}</span>
        {isEditingSource && (
            <button onClick={() => setIsEditingSource(false)} className="p-1 hover:bg-white/10 rounded transition-colors text-hytale-muted hover:text-white">
                <Settings2 className="w-3 h-3" />
            </button>
        )}
      </div>

      {!isEditingSource && resolvedProps && (
        <div className="space-y-1 pl-2 opacity-60">
          {Object.entries(resolvedProps).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-[9px] text-hytale-muted uppercase tracking-wider">{k}</span>
              <span className="text-[10px] text-hytale-text font-mono text-right truncate ml-2">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {isEditingSource && isLocalVar && (
          <div className="space-y-4 pl-2 pt-2 border-t border-white/5 bg-white/5 rounded-b-lg p-3">
              <div className="text-[8px] font-black text-hytale-accent uppercase tracking-[0.2em] mb-3">Editing Source @{varKey}</div>
              <ObjectPropertyField 
                label={varKey}
                value={variables[varKey]}
                onChange={(newVal) => onVariableUpdate(varKey, newVal)}
                schema={schema} // Inherit schema for the style object
                errors={errors} // Propagation: errors for this variable
              />
          </div>
      )}

      <div className="flex flex-col gap-2 pt-1 border-t border-white/5 mt-2">
        {!isEditingSource && (
            <button
                onClick={() => {
                const detached = resolvedProps ? { ...resolvedProps } : (schema?.default || {});
                onChange(detached);
                }}
                className="text-[9px] uppercase font-bold text-yellow-500/70 hover:text-yellow-400 transition-colors flex items-center gap-1.5"
            >
                <Unlock className="w-3 h-3" /> Detach & Edit Inline
            </button>
        )}

        {isLocalVar && onVariableUpdate && !isEditingSource && (
            <button
                onClick={() => setIsEditingSource(true)}
                className="text-[9px] uppercase font-bold text-hytale-accent/70 hover:text-hytale-accent transition-colors flex items-center gap-1.5"
            >
                <Settings className="w-3 h-3" /> Edit Source Variable (@{varKey})
            </button>
        )}
      </div>
    </div>
  );
}

// --- Object Property Field ---
// --- Object Property Field ---
function ObjectPropertyField({ label, value, onChange, onRemove, schema, errors = [], allErrors = [], onVariableUpdate, variables }) {
  const [addSubkeyOpen, setAddSubkeyOpen] = useState(false);
  const objectValue = (typeof value === 'object' && value !== null && !Array.isArray(value)) ? value : (schema ? schema.default : {}) || {};
  const availableSubkeys = (schema?.subkeys || []).filter(k => objectValue[k] === undefined);

  return (
    <div className="space-y-2 border-l-2 border-white/5 pl-3 mt-4 first:mt-0">
      <div className="flex items-center justify-between group">
        <label className="text-[10px] uppercase tracking-widest text-hytale-accent/60 font-black">{label}</label>
        {onRemove && <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded text-red-500 transition-all"><X className="w-3 h-3"/></button>}
      </div>
      <div className="space-y-3">
        {Object.entries(objectValue).map(([k, v]) => (
          <PropertyField
            key={k}
            label={k}
            value={v}
            onChange={(newVal) => onChange({ ...objectValue, [k]: newVal })}
            onRemove={() => {
              const newObj = { ...objectValue };
              delete newObj[k];
              onChange(newObj);
            }}
            errors={errors} // Pass errors down to sub-properties
            allErrors={allErrors}
            onVariableUpdate={onVariableUpdate}
            variables={variables}
          />
        ))}
        {/* Add sub-property dropdown */}
        {availableSubkeys.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setAddSubkeyOpen(!addSubkeyOpen)}
              className="text-[9px] uppercase font-bold text-hytale-muted hover:text-hytale-accent transition-colors flex items-center gap-1 mt-1"
            >
              <Plus className="w-3 h-3" /> Add to {label} <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {addSubkeyOpen && (
              <div className="absolute left-0 bottom-full mb-1 w-40 bg-[#141828] border border-white/10 rounded shadow-xl z-50 py-1 max-h-40 overflow-y-auto custom-scrollbar">
                {availableSubkeys.map(sk => (
                  <button
                    key={sk}
                    onClick={() => {
                      onChange({ ...objectValue, [sk]: 0 });
                      setAddSubkeyOpen(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[10px] text-hytale-text hover:bg-white/10 transition-colors"
                  >
                    {sk}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PropertyField({ label, value, schema, onChange, onRemove, errors = [], variables, allErrors = [], onVariableUpdate }) {
  const fieldErrors = errors.filter(e => {
    // Match exact word to avoid overlap (e.g. Alignment vs HorizontalAlignment)
    const regex = new RegExp(`\\b${label}\\b`, 'i');
    return regex.test(e.message);
  });
  const hasError = fieldErrors.length > 0;

  // Style reference handling: value is a string but schema says 'style' or 'object'
  if (typeof value === 'string' && (schema?.type === 'style' || schema?.type === 'object')) {
    const varErrors = allErrors.filter(e => e.elementId === value);
    return <StyleReferenceField label={label} value={value} onChange={onChange} onRemove={onRemove} schema={schema} variables={variables} onVariableUpdate={onVariableUpdate} errors={varErrors} />;
  }

  const isObject = (typeof value === 'object' && value !== null && !Array.isArray(value)) || (schema && (schema.type === 'object' || schema.type === 'style'));

  if (isObject) {
    return <ObjectPropertyField label={label} value={value} onChange={onChange} onRemove={onRemove} schema={schema} errors={errors} allErrors={allErrors} onVariableUpdate={onVariableUpdate} variables={variables} />;
  }

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wider text-hytale-muted font-bold">{label}</label>
        {onRemove && <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded text-red-500 transition-all"><X className="w-3 h-3"/></button>}
      </div>

      {(schema?.type === 'select' || label === 'HorizontalAlignment' || label === 'VerticalAlignment' || label === 'LayoutMode' || label === '@Alignment') ? (
        <div className="relative">
            {(() => {
                const options = (schema?.options || (label === 'LayoutMode' ? ['Top', 'Bottom', 'Left', 'Center', 'Right', 'TopScrolling', 'LeftCenterWrap', 'Middle'] : ['Start', 'Center', 'End']));
                // If value is invalid (not in options and not a variable), force empty to show "Select..." placeholder
                const displayValue = (value && !options.includes(value) && !String(value).startsWith('@')) ? '' : (value || '');
                
                return (
                    <select
                        value={displayValue}
                        onChange={(e) => onChange(e.target.value)}
                        className={clsx(
                            "w-full bg-black/40 border rounded px-3 py-1.5 text-xs text-hytale-text focus:border-hytale-accent/50 outline-none transition-all appearance-none pr-8",
                            hasError ? "border-red-500/50 bg-red-500/5" : "border-white/10"
                        )}
                    >
                        <option value="" disabled>Select {label}...</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            })()}
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-hytale-muted pointer-events-none" />
        </div>
      ) : (typeof value === 'boolean' || (schema && schema.type === 'boolean')) ? (
        <button
          onClick={() => onChange(!value)}
          className={clsx(
            "w-full px-3 py-1.5 rounded border text-xs font-bold transition-all",
            value ? "bg-hytale-accent border-hytale-accent text-black" : "bg-white/5 border-white/10 text-hytale-muted",
            hasError && "border-red-500/50 bg-red-500/5"
          )}
        >
          {value ? 'TRUE' : 'FALSE'}
        </button>
      ) : (
        <input
          type={typeof value === 'number' || (schema && schema.type === 'number') ? 'number' : 'text'}
          value={value === undefined || value === null ? '' : value}
          placeholder={schema?.default !== undefined ? String(schema.default) : ''}
          onChange={(e) => {
            const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
            onChange(val);
          }}
          className={clsx(
              "w-full bg-black/40 border rounded px-3 py-1.5 text-xs text-hytale-text focus:border-hytale-accent/50 outline-none transition-all placeholder:text-white/10",
              hasError ? "border-red-500/50 bg-red-500/5" : "border-white/10"
          )}
        />
      )}

      {hasError && (
          <div className="mt-1 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={10} className="text-red-500 mt-0.5 flex-shrink-0" strokeWidth={3} />
              <div className="text-[9px] text-red-400 font-bold italic leading-relaxed break-words">
                  {fieldErrors.map((err, i) => <div key={i}>{err.message}</div>)}
              </div>
          </div>
      )}
    </div>
);
}

export const PropertyEditor = ({ elements, onUpdate, variables, errors = [], onVariableUpdate }) => {
  const [addPropOpen, setAddPropOpen] = useState(false);

  const isMulti = Array.isArray(elements) && elements.length > 1;
  const element = isMulti ? null : (Array.isArray(elements) ? elements[0] : elements);

  const schema = element ? (SCHEMA_DEFINITIONS[element.type] || {}) : {};

  // Merge existing properties with schema defaults (show schema props even if undefined)
  // IMPORTANT: This hook must be called before any early returns to satisfy React's rules of hooks
  const mergedProperties = useMemo(() => {
    if (!element) return {};
    const visibleProps = { ...element.properties };
    Object.keys(schema).forEach(key => {
      if (visibleProps[key] === undefined) {
        visibleProps[key] = undefined;
      }
    });
    return visibleProps;
  }, [element?.properties, element?.type]);

  if (isMulti) return (
    <div className="flex flex-col items-center justify-center h-64 text-hytale-muted/30 p-6 text-center">
      <Settings className="w-12 h-12 mb-4 opacity-10" />
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 text-hytale-accent">Multiple Elements Selected</p>
      <p className="text-[11px] font-medium leading-relaxed">
        Bulk property editing is not yet supported. <br/>
        Use the canvas to move or delete all {elements.length} selected items.
      </p>
    </div>
  );

  if (!element) return (
    <div className="flex flex-col items-center justify-center h-64 text-hytale-muted/30">
      <Settings className="w-12 h-12 mb-4 opacity-10" />
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Select an element</p>
    </div>
  );

  const elementKey = element.id || element.__uid;

  const handlePropertyChange = (key, value) => {
    onUpdate(elementKey, {
      properties: { ...element.properties, [key]: value }
    });
  };

  const removeProperty = (key) => {
    const newProps = { ...element.properties };
    delete newProps[key];
    onUpdate(elementKey, { properties: newProps });
  };

  const existingKeys = new Set(Object.keys(element.properties));
  const availableProps = Object.keys(schema).filter(k => !existingKeys.has(k));

  const getSchema = (key) => schema[key];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-hytale-accent/10 rounded-lg border border-hytale-accent/20">
            <Layout className="w-4 h-4 text-hytale-accent" />
          </div>
          <div>
            <div className="text-[9px] font-black text-hytale-accent uppercase tracking-tighter leading-none mb-1">Element</div>
            <div className="text-sm font-bold text-white leading-none">{element.type}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-hytale-muted font-bold">Identifier (#)</label>
          <input
            type="text"
            value={element.id || ''}
            onChange={(e) => onUpdate(elementKey, { id: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded px-3 py-2 text-xs font-mono text-hytale-accent focus:bg-white/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Properties</h3>
          {/* Add Property Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddPropOpen(!addPropOpen)}
              disabled={availableProps.length === 0}
              className={clsx("p-1 rounded transition-colors flex items-center gap-0.5", availableProps.length === 0 ? "text-white/10 cursor-not-allowed" : "text-hytale-accent hover:bg-white/10")}
            >
              <Plus className="w-3 h-3" />
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {addPropOpen && availableProps.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#141828] border border-white/10 rounded shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar">
                {availableProps.map(propKey => {
                  const propSchema = schema[propKey];
                  // Smart defaults
                  const smartDefaults = {
                    'Anchor': { Width: 100, Height: 100 },
                    'Style': { FontSize: 16, TextColor: '#96a9be' },
                    'Background': { Color: '#000000', Alpha: 1.0 },
                    'ContentPadding': { Full: 10 },
                    '@ContentPadding': { Full: 10 },
                  };
                  const defaultVal = smartDefaults[propKey] || propSchema?.default;
                  return (
                    <button
                      key={propKey}
                      onClick={() => {
                        handlePropertyChange(propKey, defaultVal !== undefined ? (typeof defaultVal === 'object' ? {...defaultVal} : defaultVal) : '');
                        setAddPropOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[10px] text-hytale-text hover:bg-white/10 transition-colors flex items-center justify-between"
                    >
                      <span>{propKey}</span>
                      <span className="text-[8px] text-hytale-muted/40 uppercase">{propSchema?.type || 'any'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(mergedProperties).map(([key, value]) => {
            const elementErrors = errors.filter(e => e.elementId === element.id || e.elementId === element.__uid);
            return value !== undefined ? (
              <PropertyField
                key={key}
                label={key}
                value={value}
                schema={getSchema(key)}
                variables={variables}
                allErrors={errors}
                onVariableUpdate={onVariableUpdate}
                errors={elementErrors}
                onChange={(val) => handlePropertyChange(key, val)}
                onRemove={() => removeProperty(key)}
              />
            ) : null
          })}

          {Object.values(mergedProperties).every(v => v === undefined) && (
            <div className="text-[10px] text-hytale-muted/40 italic py-4 text-center border border-dashed border-white/5 rounded">
              No properties defined — use + to add
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-bold text-hytale-muted uppercase">AST-Node</div>
          <div className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-bold text-hytale-muted uppercase">Serialized</div>
        </div>
      </div>
    </div>
  );
};
