/**
 * Hytale UI Parser and Serializer
 * Handles the full Hytale .ui syntax including:
 * - Element IDs: Group #MyElement { ... }
 * - Arithmetic expressions (36 + 74 + 24 + 6 - 2)
 * - Spread syntax (...@VarName)
 * - Direct hex colors (#141821), hex with alpha (#000000(0.55))
 * - LabelStyle(), TextButtonStyle() etc. function-style values
 * - Variable references (@Var), import references ($C.@Button)
 * - Localization refs (%server.customUI.xxx)
 */

export class HytaleUISerializer {
  static serialize(doc, options = {}) {
    const ctx = {
      output: '',
      offsets: {},
      withOffsets: options.withOffsets || false
    };

    // Imports
    const importKeys = Object.keys(doc.imports || {});
    for (const [name, path] of Object.entries(doc.imports || {})) {
      ctx.output += `$${name} = "${path}";\n`;
    }
    if (importKeys.length > 0) ctx.output += '\n';

    // Variables
    const varKeys = Object.keys(doc.variables || {});
    for (const [name, value] of Object.entries(doc.variables || {})) {
      ctx.output += `@${name} = ${this.serializeValue(value)};\n`;
    }
    if (varKeys.length > 0) ctx.output += '\n';

    // Root Element
    if (doc.root) {
      this.serializeElement(doc.root, 0, ctx);
    }

    const final = ctx.output.trim();
    if (ctx.withOffsets) {
      return { code: final, offsets: ctx.offsets };
    }
    return final;
  }

  static serializeElement(el, indentLevel, ctx) {
    const start = ctx.output.length;
    const indent = '    '.repeat(indentLevel);
    let type = el.type;
    ctx.output += `${indent}${type}${el.id ? ' #' + el.id : ''} {\n`;

    const nextIndent = '    '.repeat(indentLevel + 1);

    // Properties
    for (const [key, value] of Object.entries(el.properties || {})) {
      const sep = key.startsWith('@') ? ' =' : ':';
      ctx.output += `${nextIndent}${key}${sep} ${this.serializeValue(value)};\n`;
    }

    // Children
    if (el.children && el.children.length > 0) {
      if (Object.keys(el.properties || {}).length > 0) ctx.output += '\n';
      for (const child of el.children) {
        this.serializeElement(child, indentLevel + 1, ctx);
        ctx.output += '\n';
      }
    }

    ctx.output += `${indent}}`;
    
    if (ctx.withOffsets) {
      const key = el.id || el.__uid;
      if (key) ctx.offsets[key] = { start, end: ctx.output.length };
    }
  }

  static serializeValue(value) {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);

    // Arithmetic expression object: preserve original expression
    if (typeof value === 'object' && value !== null && value.__expr !== undefined) {
      return value.__expr;
    }
    
    if (typeof value === 'string') {
      // References, colors, spreads — keep as-is
      if (/^[@$%#]/.test(value)) return value;
      if (/^\.\.\./.test(value)) return value;
      // Bare identifiers (keywords like True, False, Center, etc.)
      const keywords = ['True', 'False', 'Null', 'Center', 'Middle', 'Top', 'Bottom', 'Left', 'Right', 'Start', 'End', 'Auto', 'Wrap', 'Vertical', 'Horizontal'];
      if (keywords.includes(value)) return value;
      // If it contains spaces or isn't a simple keyword/ref, quote it
      return `"${value}"`;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.map(v => this.serializeValue(v)).join(', ')}]`;
      }
      
      const entries = Object.entries(value);
      const pairs = entries.map(([k, v]) => {
        if (k === '__type' || k === '__expr' || k === '__value') return null;
        if (k.startsWith('__spread')) return this.serializeValue(v);
        return `${k}: ${this.serializeValue(v)}`;
      }).filter(Boolean);

      if (value.__type) {
        return `${value.__type}(${pairs.join(', ')})`;
      }
      
      return `(${pairs.join(', ')})`;
    }
    
    return String(value);
  }
}

// ---------- TOKENIZER ----------

class Tokenizer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  updatePos(n) {
    for (let i = 0; i < n; i++) {
        const char = this.input[this.pos + i];
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
    }
    this.pos += n;
  }

  nextToken() {
    this.skipWhitespaceAndComments();
    if (this.pos >= this.input.length) return null;

    const char = this.input[this.pos];

    const startLine = this.line;
    const startColumn = this.column;

    // Spread syntax: ...
    if (char === '.' && this.input[this.pos + 1] === '.' && this.input[this.pos + 2] === '.') {
      this.updatePos(3);
      return { type: 'SPREAD', value: '...', line: startLine, column: startColumn };
    }

    // # — could be an element ID (#SoulHUD) or a hex color (#ff00aa)
    if (char === '#') {
      this.updatePos(1); // skip #
      
      // Read the entire rest of the identifier
      let fullIdentifier = '';
      while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
        fullIdentifier += this.input[this.pos];
        this.updatePos(1);
      }
      
      // Disambiguate: is it a valid hex color? 
      // Purely hex-compatible digits AND length is 3, 4, 6, or 8.
      const isPureHex = /^[a-fA-F0-9]+$/i.test(fullIdentifier);
      const isColorLength = [3, 4, 6, 8].includes(fullIdentifier.length);
      const nextChar = this.input[this.pos];

      // Even if it's hex, if it's followed by ( it might be #hex(alpha)
      if (isPureHex && isColorLength) {
        let value = '#' + fullIdentifier;
        if (nextChar === '(') {
          this.updatePos(1); // (
          value += '(';
          while (this.pos < this.input.length && this.input[this.pos] !== ')') {
            value += this.input[this.pos];
            this.updatePos(1);
          }
          if (this.pos < this.input.length) {
            value += this.input[this.pos];
            this.updatePos(1); // )
          }
        }
        return { type: 'VALUE', value, line: startLine, column: startColumn };
      }

      // Default to HASH_ID
      return { type: 'HASH_ID', value: fullIdentifier, line: startLine, column: startColumn };
    }

    // Reference prefixes: $, @, %
    if (char === '$' || char === '@' || char === '%') {
      this.updatePos(1);
      let value = '';
      while (this.pos < this.input.length && /[a-zA-Z0-9_.@$%]/.test(this.input[this.pos])) {
        value += this.input[this.pos];
        this.updatePos(1);
      }
      return { type: 'REFERENCE', prefix: char, value, line: startLine, column: startColumn };
    }

    // String literals
    if (char === '"') {
      let value = '';
      this.updatePos(1);
      while (this.pos < this.input.length && this.input[this.pos] !== '"') {
        if (this.input[this.pos] === '\\') {
            this.updatePos(1);
        }
        value += this.input[this.pos];
        this.updatePos(1);
      }
      if (this.pos < this.input.length) {
        this.updatePos(1); // closing "
      }
      return { type: 'STRING', value, line: startLine, column: startColumn };
    }

    // Arithmetic operators
    if (char === '+') {
      this.updatePos(1);
      return { type: 'OPERATOR', value: '+', line: startLine, column: startColumn };
    }
    if (char === '-') {
      // Disambiguate: negative number vs subtraction
      const prevNonWs = this._prevNonWhitespace();
      if (/[0-9]/.test(this.input[this.pos + 1] || '') && (prevNonWs === null || /[(:,=+\-]/.test(prevNonWs))) {
        // Negative number
        let value = '-';
        this.updatePos(1);
        while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
          value += this.input[this.pos];
          this.updatePos(1);
        }
        return { type: 'NUMBER', value: Number(value), line: startLine, column: startColumn };
      }
      this.updatePos(1);
      return { type: 'OPERATOR', value: '-', line: startLine, column: startColumn };
    }

    // Punctuation
    if (['{', '}', ':', ';', '=', '(', ')', '[', ']', ','].includes(char)) {
      this.updatePos(1);
      return { type: 'PUNCTUATION', value: char, line: startLine, column: startColumn };
    }

    // Identifiers, numbers, booleans
    let value = '';
    while (this.pos < this.input.length && /[a-zA-Z0-9_.@$%]/.test(this.input[this.pos])) {
      value += this.input[this.pos];
      this.updatePos(1);
    }

    if (value === '') {
      // Skip unexpected character to prevent infinite loop
      this.updatePos(1);
      return this.nextToken();
    }

    if (value === 'true' || value === 'false') return { type: 'BOOLEAN', value: value === 'true', line: startLine, column: startColumn };
    if (value === 'null') return { type: 'NULL', value: null, line: startLine, column: startColumn };
    
    const num = Number(value);
    if (!isNaN(num) && value !== '' && /^[0-9]/.test(value)) return { type: 'NUMBER', value: num, line: startLine, column: startColumn };

    return { type: 'IDENTIFIER', value, line: startLine, column: startColumn };
  }

  _prevNonWhitespace() {
    let i = this.pos - 1;
    while (i >= 0 && /\s/.test(this.input[i])) i--;
    return i >= 0 ? this.input[i] : null;
  }

  skipWhitespaceAndComments() {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (/\s/.test(char)) {
        this.updatePos(1);
        continue;
      }
      if (this.input.startsWith('//', this.pos)) {
        while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
            this.updatePos(1);
        }
        continue;
      }
      if (this.input.startsWith('/*', this.pos)) {
        this.updatePos(2);
        while (this.pos < this.input.length && !this.input.startsWith('*/', this.pos)) {
            this.updatePos(1);
        }
        this.updatePos(2);
        continue;
      }
      break;
    }
  }

  peek() {
    return this.peekAt(0);
  }

  peekAt(n) {
    const oldPos = this.pos;
    const oldLine = this.line;
    const oldColumn = this.column;
    let token = null;
    for (let i = 0; i <= n; i++) {
        token = this.nextToken();
        if (token === null) break;
    }
    this.pos = oldPos;
    this.line = oldLine;
    this.column = oldColumn;
    return token;
  }
}

// ---------- PARSER ----------

export class HytaleUIParser {
  static parse(input) {
    const tokenizer = new Tokenizer(input);
    const doc = { imports: {}, variables: {}, root: null };
    const errors = [];

    let token;
    let safetyCounter = 0;
    const maxIterations = 100000;

    while (true) {
      token = tokenizer.peek();
      if (!token) break;

      if (++safetyCounter > maxIterations) {
        errors.push({ line: tokenizer.line, column: tokenizer.column, message: 'Parser: max iterations exceeded at top level' });
        break;
      }

      if (token.type === 'REFERENCE') {
        const next = tokenizer.peekAt(1);
        
        if (next?.type === 'PUNCTUATION' && next.value === '=') {
          // Assignment
          tokenizer.nextToken(); // @Var or $Import
          tokenizer.nextToken(); // =
          if (token.prefix === '$') {
            const pathToken = tokenizer.nextToken();
            if (pathToken?.type === 'STRING') {
                doc.imports[token.value] = pathToken.value;
            } else {
                errors.push({ line: token.line, column: token.column, message: 'Expected string path for import' });
            }
            if (tokenizer.peek()?.value === ';') tokenizer.nextToken();
          } else {
            doc.variables[token.value] = this.parseValue(tokenizer, errors);
            if (tokenizer.peek()?.value === ';') tokenizer.nextToken();
          }
        } else {
          doc.root = this.parseElement(tokenizer, errors);
          break; 
        }
      } else if (token.type === 'IDENTIFIER' || token.type === 'HASH_ID') {
        doc.root = this.parseElement(tokenizer, errors);
        break;
      } else {
        errors.push({ line: token.line, column: token.column, message: `Unexpected top-level token: ${token.value || token.type}` });
        tokenizer.nextToken();
      }
    }

    // Assign __uid to every element without an id
    let uidCounter = 0;
    const assignUids = (node) => {
      if (!node) return;
      if (!node.id) {
        node.__uid = `__uid_${uidCounter++}`;
      }
      for (const child of node.children || []) {
        assignUids(child);
      }
    };
    assignUids(doc.root);

    return { doc, errors };
  }

  static parseElement(tokenizer, errors) {
    let typeToken = tokenizer.nextToken();
    if (!typeToken) return null;

    let type = typeToken.value;
    
    // Handle component references like $C.@TextButton or @CheckBox
    if (typeToken.type === 'REFERENCE') {
      type = typeToken.prefix + typeToken.value;
    }

    // Check for #ID (now a dedicated HASH_ID token)
    let id = null;
    if (tokenizer.peek()?.type === 'HASH_ID') {
      id = tokenizer.nextToken().value;
    }

    // Expect opening {
    const openBrace = tokenizer.nextToken();
    if (!openBrace || openBrace.value !== '{') {
      errors.push({ line: typeToken.line, column: typeToken.column, message: `Expected '{' after element type ${type}` });
      return { type, id, properties: {}, children: [] };
    }

    const properties = {};
    const children = [];
    let safetyCounter = 0;
    const maxIterations = 50000;

    while (true) {
      if (++safetyCounter > maxIterations) {
        errors.push({ line: tokenizer.line, column: tokenizer.column, message: 'Parser: max iterations in element body' });
        break;
      }

      const next = tokenizer.peek();
      if (!next) {
        errors.push({ line: tokenizer.line, column: tokenizer.column, message: 'Unexpected end of input: missing closing brace }' });
        break;
      }
      if (next.type === 'PUNCTUATION' && next.value === '}') {
        tokenizer.nextToken(); // consume }
        break;
      }

      if (next.type === 'REFERENCE' || next.type === 'IDENTIFIER') {
        const keyToken = tokenizer.nextToken();
        const key = (keyToken.prefix || '') + keyToken.value;
        
        const afterKey = tokenizer.peek();

        if (afterKey && afterKey.type === 'PUNCTUATION' && afterKey.value === ':') {
          // Property: Key: Value;
          tokenizer.nextToken(); // :
          properties[key] = this.parseValue(tokenizer, errors);
          if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ';') {
            tokenizer.nextToken();
          } else {
            errors.push({ line: keyToken.line, column: keyToken.column, message: `Missing semicolon after property ${key}` });
          }
        } else if (afterKey && afterKey.type === 'PUNCTUATION' && afterKey.value === '=') {
          // Parameter assignment: @Text = "...";
          tokenizer.nextToken(); // =
          properties[key] = this.parseValue(tokenizer, errors);
          if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ';') {
            tokenizer.nextToken();
          } else {
            errors.push({ line: keyToken.line, column: keyToken.column, message: `Missing semicolon after assignment ${key}` });
          }
        } else {
          // Child element or unknown?
          // If the next thing is { or #ID, it's definitely a child
          const isChild = afterKey && (
            (afterKey.type === 'PUNCTUATION' && afterKey.value === '{') ||
            afterKey.type === 'HASH_ID'
          );

          if (isChild) {
             // Rewind and parse as element
             tokenizer.pos -= (keyToken.prefix ? keyToken.value.length + 1 : keyToken.value.length);
             // Also need to rewind line/column... tokenizer needs a more robust rewind or just use PeekAt for children
             // For now, let's use a simpler heuristic or just allow it to continue
             // Since Tokenizer doesn't easily support line/col rewind, I'll pass tokenizer state
             const oldPos = tokenizer.pos;
             const oldLine = tokenizer.line;
             const oldColumn = tokenizer.column;
             
             // Redo the logic without actual rewind if possible, or support state reset
             tokenizer.pos = oldPos; tokenizer.line = oldLine; tokenizer.column = oldColumn;
             
             const child = this.parseElement(tokenizer, errors);
             if (child) children.push(child);
          } else {
             // Try to parse as child anyway, it's the only other valid thing
             tokenizer.pos -= (keyToken.prefix ? keyToken.value.length + 1 : keyToken.value.length);
             // We'd need to restore line/column here too...
             // This parser structure is a bit tricky for line/column rewind.
             // I'll add a 'state' object to Tokenizer to save/restore easily.
             
             const child = this.parseElement(tokenizer, errors);
             if (child) children.push(child);
          }
        }
      } else {
        errors.push({ line: next.line, column: next.column, message: `Unexpected token in element body: ${next.value}` });
        tokenizer.nextToken();
      }
    }

    return { type, id, properties, children };
  }

  static parseValue(tokenizer, errors) {
    const token = tokenizer.nextToken();
    if (!token) return null;

    // Spread: ...@VarRef or ...$Import.@Var
    if (token.type === 'SPREAD') {
      const ref = tokenizer.nextToken();
      if (ref) {
        let refStr = (ref.prefix || '') + ref.value;
        return '...' + refStr;
      }
      errors.push({ line: token.line, column: token.column, message: 'Expected reference after spread ...' });
      return '...';
    }

    // Parenthesized value: ( Key: Value, ... )
    if (token.type === 'PUNCTUATION' && token.value === '(') {
      const obj = {};
      let spreadIndex = 0;
      let safetyCounter = 0;

      while (true) {
        if (++safetyCounter > 10000) break;
        const peek = tokenizer.peek();
        if (!peek) {
            errors.push({ line: token.line, column: token.column, message: 'Unclosed parenthesis (' });
            break;
        }
        if (peek.type === 'PUNCTUATION' && peek.value === ')') {
          tokenizer.nextToken(); // consume )
          break;
        }

        // Handle spread inside objects: ...@Ref
        if (peek.type === 'SPREAD') {
          tokenizer.nextToken(); // consume ...
          const ref = tokenizer.nextToken();
          if (ref) {
            obj[`__spread${spreadIndex++}`] = '...' + (ref.prefix || '') + ref.value;
          } else {
            errors.push({ line: peek.line, column: peek.column, message: 'Expected reference after spread ...' });
          }
          if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ',') tokenizer.nextToken();
          continue;
        }

        const keyToken = tokenizer.nextToken();
        if (!keyToken) break;
        const key = (keyToken.prefix || '') + keyToken.value;
        
        // Expect : after key
        const colon = tokenizer.peek();
        if (colon && colon.type === 'PUNCTUATION' && colon.value === ':') {
          tokenizer.nextToken(); // :
          obj[key] = this.parseValue(tokenizer, errors);
        } else {
            errors.push({ line: keyToken.line, column: keyToken.column, message: `Expected ':' after key ${key} in map` });
        }
        
        if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ',') tokenizer.nextToken();
      }
      return obj;
    }

    // Array: [ ... ]
    if (token.type === 'PUNCTUATION' && token.value === '[') {
      const arr = [];
      let safetyCounter = 0;
      while (true) {
        if (++safetyCounter > 10000) break;
        const peek = tokenizer.peek();
        if (!peek) {
            errors.push({ line: token.line, column: token.column, message: 'Unclosed bracket [' });
            break;
        }
        if (peek.type === 'PUNCTUATION' && peek.value === ']') {
          tokenizer.nextToken(); // ]
          break;
        }
        arr.push(this.parseValue(tokenizer, errors));
        if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ',') tokenizer.nextToken();
      }
      return arr;
    }
    
    // Reference (@Var, $Import, %Locale)
    if (token.type === 'REFERENCE') {
      return token.prefix + token.value;
    }

    // Identifier — might be a function call like LabelStyle(...) or a bare value
    if (token.type === 'IDENTIFIER') {
      if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === '(') {
        const funcName = token.value;
        const args = this.parseValue(tokenizer, errors); // parses the ( ... )
        if (typeof args === 'object' && args !== null && !Array.isArray(args)) {
          return { __type: funcName, ...args };
        }
        return { __type: funcName, value: args };
      }
      return token.value;
    }

    // Number — check for arithmetic (e.g. 36 + 74 + 24)
    if (token.type === 'NUMBER') {
      if (tokenizer.peek()?.type !== 'OPERATOR') {
        return token.value; // Plain number, return as-is
      }
      // Arithmetic expression: preserve the original expression string
      let result = token.value;
      let exprParts = [String(token.value)];
      while (tokenizer.peek()?.type === 'OPERATOR') {
        const op = tokenizer.nextToken();
        const next = tokenizer.nextToken();
        if (!next) {
            errors.push({ line: op.line, column: op.column, message: `Expected number after operator ${op.value}` });
            break;
        }
        const nextVal = (next.type === 'NUMBER') ? next.value : 0;
        if (next.type !== 'NUMBER') {
            errors.push({ line: next.line, column: next.column, message: `Expected number in arithmetic expression, got ${next.value || next.type}` });
        }
        exprParts.push(op.value, String(nextVal));
        if (op.value === '+') result += nextVal;
        else if (op.value === '-') result -= nextVal;
      }
      return { __expr: exprParts.join(' '), __value: result };
    }
    
    return token.value;
  }
}
