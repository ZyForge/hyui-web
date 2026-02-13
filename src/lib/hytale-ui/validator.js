/**
 * Hytale UI Validation Engine
 * Enforces strict rules from the documentation.
 */

export class HytaleUIValidator {
  static validate(doc) {
    const errors = [];

    // Rule: KeyedCodec keys starting with letters must be uppercase
    // Rule: @-prefixed reference keys are allowed
    // This applies to EventData and other codec-based objects
    
    this.validateElement(doc.root, errors);

    return errors;
  }

  static validateElement(el, errors) {
    if (!el) return;

    // Type validation (example: only allowed types from reference)
    // For now, we'll focus on property key cases if applicable
    
    // Check property keys
    for (const key of Object.keys(el.properties)) {
      if (key === 'EventData' && typeof el.properties[key] === 'object') {
        this.validateEventData(el.properties[key], errors, el.id);
      }
    }

    for (const child of el.children) {
      this.validateElement(child, errors);
    }
  }

  static validateEventData(data, errors, elementId) {
    for (const key of Object.keys(data)) {
      if (/^[a-z]/.test(key)) {
        errors.push({
          elementId,
          message: `Key "${key}" in EventData must start with an uppercase letter or @.`
        });
      }
    }
  }
}
