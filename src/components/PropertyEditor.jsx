import React, { useMemo, useState } from 'react';
import { Settings, Layout, Plus, X, ChevronDown, Lock, Unlock } from 'lucide-react';
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
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
    'Visible': { type: 'boolean', default: true },
  },
  '$C.@TextButton': {
    '@Text': { type: 'string', default: 'Button' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
    '@Sounds': { type: 'string', default: '' },
  },
  '$C.@SecondaryTextButton': {
    '@Text': { type: 'string', default: 'Button' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
    '@Sounds': { type: 'string', default: '' },
  },
  '$C.@CancelTextButton': {
    '@Text': { type: 'string', default: 'Cancel' },
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: { Width: 172, Height: 44 } },
    '@Sounds': { type: 'string', default: '' },
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
  '$C.@PageOverlay': {
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
  },
  '$C.@ContentSeparator': {
    'Anchor': { type: 'object', subkeys: ['Width', 'Height', 'Top', 'Bottom', 'Left', 'Right'], default: {} },
  },
  '$C.@VerticalSeparator': {},
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
const StyleReferenceField = ({ label, value, onChange, onRemove, schema, variables }) => {
  const refName = value; // e.g. "@HeaderStyle"
  const resolvedProps = KNOWN_STYLE_PRESETS[refName] || (variables && variables[refName.substring(1)]) || null;

  return (
    <div className="space-y-2 border-l-2 border-hytale-accent/20 pl-3 mt-4 first:mt-0">
      <div className="flex items-center justify-between group">
        <label className="text-[10px] uppercase tracking-widest text-hytale-accent/60 font-black">{label}</label>
        <div className="flex items-center gap-1">
          {onRemove && <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded text-red-500 transition-all"><X className="w-3 h-3"/></button>}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded px-3 py-1.5">
        <Lock className="w-3 h-3 text-hytale-accent/40 flex-shrink-0" />
        <span className="text-xs font-mono text-hytale-accent flex-1">{refName}</span>
      </div>
      {resolvedProps && (
        <div className="space-y-1 pl-2 opacity-60">
          {Object.entries(resolvedProps).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-[9px] text-hytale-muted uppercase tracking-wider">{k}</span>
              <span className="text-[10px] text-hytale-text font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          // Detach from reference: replace string with the resolved object
          const detached = resolvedProps ? { ...resolvedProps } : (schema?.default || {});
          onChange(detached);
        }}
        className="text-[9px] uppercase font-bold text-yellow-500/70 hover:text-yellow-400 transition-colors flex items-center gap-1 mt-1"
      >
        <Unlock className="w-3 h-3" /> Detach & Edit Inline
      </button>
    </div>
  );
};

// --- Object Property Field ---
const ObjectPropertyField = ({ label, value, onChange, onRemove, schema }) => {
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
};

const PropertyField = ({ label, value, onChange, onRemove, schema, variables }) => {
  // Style reference handling: value is a string but schema says 'style' or 'object'
  if (typeof value === 'string' && (schema?.type === 'style' || schema?.type === 'object')) {
    return <StyleReferenceField label={label} value={value} onChange={onChange} onRemove={onRemove} schema={schema} variables={variables} />;
  }

  const isObject = (typeof value === 'object' && value !== null && !Array.isArray(value)) || (schema && (schema.type === 'object' || schema.type === 'style'));

  if (isObject) {
    return <ObjectPropertyField label={label} value={value} onChange={onChange} onRemove={onRemove} schema={schema} />;
  }

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wider text-hytale-muted font-bold">{label}</label>
        {onRemove && <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded text-red-500 transition-all"><X className="w-3 h-3"/></button>}
      </div>

      {schema?.type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-hytale-text focus:border-hytale-accent/50 outline-none transition-all appearance-none"
        >
          <option value="" disabled>Select {label}</option>
          {schema.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (typeof value === 'boolean' || (schema && schema.type === 'boolean')) ? (
        <button
          onClick={() => onChange(!value)}
          className={clsx(
            "w-full px-3 py-1.5 rounded border text-xs font-bold transition-all",
            value ? "bg-hytale-accent border-hytale-accent text-black" : "bg-white/5 border-white/10 text-hytale-muted"
          )}
        >
          {value ? 'TRUE' : 'FALSE'}
        </button>
      ) : (
        <input
          type={typeof value === 'number' || schema?.type === 'number' ? 'number' : 'text'}
          value={(value === null || value === undefined) ? '' : value}
          placeholder={schema?.default !== undefined ? String(schema.default) : ''}
          onChange={(e) => {
            let val = e.target.value;
            if (typeof value === 'number' || schema?.type === 'number') val = parseFloat(val) || 0;
            if (val === 'true') val = true;
            if (val === 'false') val = false;
            if (val === 'null') val = null;
            onChange(val);
          }}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-hytale-text focus:border-hytale-accent/50 outline-none transition-all placeholder:text-white/10"
        />
      )}
    </div>
  );
};

export const PropertyEditor = ({ elements, onUpdate, variables }) => {
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
          {Object.entries(mergedProperties).map(([key, value]) => (
            value !== undefined ? (
              <PropertyField
                key={key}
                label={key}
                value={value}
                schema={getSchema(key)}
                variables={variables}
                onChange={(val) => handlePropertyChange(key, val)}
                onRemove={() => removeProperty(key)}
              />
            ) : null
          ))}

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
