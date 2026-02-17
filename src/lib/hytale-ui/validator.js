/**
 * Hytale UI Validation Engine
 * Enforces strict rules from the documentation and practical references.
 */

const VALID_ELEMENTS = [
  'Group', 'Label', 'ProgressBar', 'Image', 'Button', 'TextButton', 'Sprite',
  'TextField', 'NumberField', 'DropdownBox', 'CheckBox', 'CheckBoxWithLabel',
  'Container', 'DecoratedContainer', 'Panel', 'PageOverlay', 'Title', 'Subtitle',
  'EntityStat', 'CombatText', 'CloseButton'
];

const COMMON_COMPONENTS = [
  '@TextButton', '@SecondaryTextButton', '@TertiaryTextButton', '@CancelTextButton',
  '@SmallSecondaryTextButton', '@SmallTertiaryTextButton', '@Button', '@SecondaryButton',
  '@TertiaryButton', '@CancelButton', '@CloseButton', '@BackButton',
  '@TextField', '@NumberField', '@DropdownBox', '@CheckBox', '@CheckBoxWithLabel',
  '@Container', '@DecoratedContainer', '@Panel', '@PageOverlay',
  '@ContentSeparator', '@VerticalSeparator', '@HeaderSeparator', '@PanelSeparatorFancy',
  '@ActionButtonContainer', '@ActionButtonSeparator',
  '@Title', '@Subtitle', '@TitleLabel', '@PanelTitle',
  '@DefaultSpinner', '@HeaderSearch'
];

const GLOBAL_PROPERTIES = [
  'Anchor', 'Visible', 'Padding', 'Margin', 'FlexWeight', 'Background', 'LayoutMode', 'ContentPadding', 'EventData', 'ScrollbarStyle'
];

const ELEMENT_SPECIFIC_PROPERTIES = {
  'Label': ['Text', 'Style', 'TextID'],
  'ProgressBar': ['Value', 'BarTexturePath', 'EffectTexturePath', 'BackgroundTexturePath'],
  'Image': ['TexturePath', 'Style'],
  'Button': ['Style', 'Sounds', '@Text'],
  'TextButton': ['Style', 'Text', 'Sounds', 'Enabled', 'Visible'],
  'Sprite': ['TexturePath', 'Style', 'Anchor']
};

const ALIGNMENT_VALUES = ['Start', 'Center', 'End'];
const LAYOUT_MODES = ['Top', 'Bottom', 'Left', 'Center', 'Right', 'TopScrolling', 'LeftCenterWrap', 'Middle'];

export class HytaleUIValidator {
  static validate(doc) {
    const errors = [];
    if (!doc) return errors;

    // Validate global variables and track which ones have errors
    const varNames = Object.keys(doc.variables || {});
    const varsWithErrors = new Set();

    for (const name of varNames) {
        const value = doc.variables[name];
        const initialErrorCount = errors.length;

        if (typeof value === 'object' && value !== null && value.__type) {
            this.validateStyle(value, errors, `@${name}`);
        }
        
        // Base enum validation for direct variable values
        if (typeof value === 'string' && !value.startsWith('@') && !value.startsWith('$')) {
            const isAlignmentVar = name.includes('Alignment');
            const cleanVal = value.trim();
            if (isAlignmentVar && !ALIGNMENT_VALUES.map(v => v.toLowerCase()).includes(cleanVal.toLowerCase())) {
                errors.push({
                    elementId: `@${name}`,
                    message: `Variable @${name} has invalid alignment "${cleanVal}". Use: ${ALIGNMENT_VALUES.join(', ')}`
                });
            }
        }

        if (errors.length > initialErrorCount) {
            varsWithErrors.add(`@${name}`);
        }
    }

    if (doc.root) {
        this.validateElement(doc.root, errors, varsWithErrors);
    }

    return errors;
  }

  static validateElement(el, errors, varsWithErrors = new Set()) {
    if (!el) return;

    const type = el.type;
    const cleanType = type.replace(/^\$C\./, '');

    // Check for inherited variable errors in type
    if (varsWithErrors.has(type)) {
        errors.push({
            elementId: el.id || el.__uid,
            message: `Element uses variable ${type} which has validation errors.`
        });
    }

    // Validate Element Type
    const isStandard = VALID_ELEMENTS.includes(cleanType);
    const isCommon = COMMON_COMPONENTS.includes(cleanType);
    const isReference = type.startsWith('@') || type.includes('.');

    if (!isStandard && !isCommon && !isReference) {
      errors.push({
        elementId: el.id || el.__uid,
        message: `Unknown element type: ${type}`
      });
    }

    // Validate Properties
    const allowedProps = [
      ...GLOBAL_PROPERTIES,
      ...(ELEMENT_SPECIFIC_PROPERTIES[cleanType] || [])
    ];

    for (const key of Object.keys(el.properties || {})) {
      // Variables and spreads are always allowed as keys in some contexts, 
      // but in Hytale UI properties usually start with Uppercase or @ for parameters
      const isParam = key.startsWith('@');
      const isGlobal = GLOBAL_PROPERTIES.includes(key);
      const isSpecific = (ELEMENT_SPECIFIC_PROPERTIES[cleanType] || []).includes(key);

      if (!isParam && !isGlobal && !isSpecific) {
        // Only warn for unknown properties on standard elements
        if (isStandard) {
          errors.push({
            elementId: el.id || el.__uid,
            message: `Unknown property "${key}" for element type ${cleanType}`
          });
        }
      }

      // Value-specific validation
      const value = el.properties[key];
      
      // Check for inherited variable errors in property values
      if (typeof value === 'string' && varsWithErrors.has(value)) {
        errors.push({
          elementId: el.id || el.__uid,
          message: `Property "${key}" uses variable ${value} which has validation errors.`
        });
      }

      // Alignment enums
      if (key === 'HorizontalAlignment' || key === 'VerticalAlignment') {
          if (typeof value === 'string' && !value.startsWith('@')) {
              const cleanVal = value.trim();
              if (!ALIGNMENT_VALUES.map(v => v.toLowerCase()).includes(cleanVal.toLowerCase())) {
                  errors.push({
                      elementId: el.id || el.__uid,
                      message: `${key} must be one of: ${ALIGNMENT_VALUES.join(', ')} (got "${cleanVal}")`
                  });
              }
          }
      }

      // LayoutMode enums
      if (key === 'LayoutMode') {
          if (typeof value === 'string' && !value.startsWith('@')) {
              const cleanVal = value.trim();
              if (!LAYOUT_MODES.map(v => v.toLowerCase()).includes(cleanVal.toLowerCase())) {
                  errors.push({
                      elementId: el.id || el.__uid,
                      message: `Invalid LayoutMode "${cleanVal}". Use: ${LAYOUT_MODES.join(', ')}`
                  });
              }
          }
      }

      // Style object validation (recursive)
      if (key === 'Style' && typeof value === 'object' && value !== null) {
          this.validateStyle(value, errors, el.id || el.__uid, varsWithErrors);
      }

      if (key === 'Anchor' && typeof value !== 'object') {
        errors.push({
          elementId: el.id || el.__uid,
          message: `Anchor property must be a map (e.g., Anchor: (Width: 100);)`
        });
      }

      if (key === 'EventData' && typeof value === 'object') {
        this.validateEventData(value, errors, el.id || el.__uid);
      }
    }

    // Children validation
    for (const child of el.children || []) {
      this.validateElement(child, errors, varsWithErrors);
    }
  }

  static validateStyle(style, errors, elementId, varsWithErrors = new Set()) {
      for (const [key, value] of Object.entries(style)) {
          // Check for inherited variable errors in style values
          if (typeof value === 'string' && varsWithErrors.has(value)) {
            errors.push({
                elementId,
                message: `Style property "${key}" uses variable ${value} which has validation errors.`
            });
          }

          if (key === 'HorizontalAlignment' || key === 'VerticalAlignment') {
              if (typeof value === 'string' && !value.startsWith('@')) {
                  const cleanVal = value.trim();
                  if (!ALIGNMENT_VALUES.map(v => v.toLowerCase()).includes(cleanVal.toLowerCase())) {
                      errors.push({
                          elementId,
                          message: `Style property ${key} must be one of: ${ALIGNMENT_VALUES.join(', ')} (got "${cleanVal}")`
                      });
                  }
              }
          }
      }
  }

  static validateEventData(data, errors, elementId) {
    for (const key of Object.keys(data)) {
        if (key.startsWith('__')) continue; // Internal parser keys
      if (/^[a-z]/.test(key) && !key.startsWith('@')) {
        errors.push({
          elementId,
          message: `Key "${key}" in EventData must start with an uppercase letter or @.`
        });
      }
    }
  }
}
