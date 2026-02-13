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
  static serialize(doc) {
    let output = '';

    // Imports
    const importKeys = Object.keys(doc.imports || {});
    for (const [name, path] of Object.entries(doc.imports || {})) {
      output += `$${name} = "${path}";\n`;
    }
    if (importKeys.length > 0) output += '\n';

    // Variables
    const varKeys = Object.keys(doc.variables || {});
    for (const [name, value] of Object.entries(doc.variables || {})) {
      output += `@${name} = ${this.serializeValue(value)};\n`;
    }
    if (varKeys.length > 0) output += '\n';

    // Root Element
    if (doc.root) {
      output += this.serializeElement(doc.root, 0);
    }

    return output.trim();
  }

  static serializeElement(el, indentLevel) {
    const indent = '    '.repeat(indentLevel);
    let type = el.type;
    let output = `${indent}${type}${el.id ? ' #' + el.id : ''} {\n`;

    const nextIndent = '    '.repeat(indentLevel + 1);

    // Properties
    for (const [key, value] of Object.entries(el.properties || {})) {
      output += `${nextIndent}${key}: ${this.serializeValue(value)};\n`;
    }

    // Children
    if (el.children && el.children.length > 0) {
      if (Object.keys(el.properties || {}).length > 0) output += '\n';
      for (const child of el.children) {
        output += this.serializeElement(child, indentLevel + 1) + '\n';
      }
    }

    output += `${indent}}`;
    return output;
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
      // Bare identifiers (no spaces, pure alphanumeric+underscore) — don't quote
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) return value;
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
  }

  nextToken() {
    this.skipWhitespaceAndComments();
    if (this.pos >= this.input.length) return null;

    const char = this.input[this.pos];

    // Spread syntax: ...
    if (char === '.' && this.input[this.pos + 1] === '.' && this.input[this.pos + 2] === '.') {
      this.pos += 3;
      return { type: 'SPREAD', value: '...' };
    }

    // # — could be an element ID (#SoulHUD) or a hex color (#ff00aa)
    if (char === '#') {
      this.pos++; // skip #
      
      // Read the entire rest of the identifier
      let fullIdentifier = '';
      while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
        fullIdentifier += this.input[this.pos++];
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
          this.pos++; // (
          value += '(';
          while (this.pos < this.input.length && this.input[this.pos] !== ')') {
            value += this.input[this.pos++];
          }
          if (this.pos < this.input.length) value += this.input[this.pos++]; // )
        }
        return { type: 'VALUE', value };
      }

      // Default to HASH_ID
      return { type: 'HASH_ID', value: fullIdentifier };
    }

    // Reference prefixes: $, @, %
    if (char === '$' || char === '@' || char === '%') {
      this.pos++;
      let value = '';
      while (this.pos < this.input.length && /[a-zA-Z0-9_.@$%]/.test(this.input[this.pos])) {
        value += this.input[this.pos++];
      }
      return { type: 'REFERENCE', prefix: char, value };
    }

    // String literals
    if (char === '"') {
      let value = '';
      this.pos++;
      while (this.pos < this.input.length && this.input[this.pos] !== '"') {
        if (this.input[this.pos] === '\\') this.pos++;
        value += this.input[this.pos++];
      }
      this.pos++; // closing "
      return { type: 'STRING', value };
    }

    // Arithmetic operators
    if (char === '+') {
      this.pos++;
      return { type: 'OPERATOR', value: '+' };
    }
    if (char === '-') {
      // Disambiguate: negative number vs subtraction
      const prevNonWs = this._prevNonWhitespace();
      if (/[0-9]/.test(this.input[this.pos + 1] || '') && (prevNonWs === null || /[(:,=+\-]/.test(prevNonWs))) {
        // Negative number
        let value = '-';
        this.pos++;
        while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
          value += this.input[this.pos++];
        }
        return { type: 'NUMBER', value: Number(value) };
      }
      this.pos++;
      return { type: 'OPERATOR', value: '-' };
    }

    // Punctuation
    if (['{', '}', ':', ';', '=', '(', ')', '[', ']', ','].includes(char)) {
      this.pos++;
      return { type: 'PUNCTUATION', value: char };
    }

    // Identifiers, numbers, booleans
    let value = '';
    while (this.pos < this.input.length && /[a-zA-Z0-9_.@$%]/.test(this.input[this.pos])) {
      value += this.input[this.pos++];
    }

    if (value === '') {
      // Skip unexpected character to prevent infinite loop
      this.pos++;
      return this.nextToken();
    }

    if (value === 'true' || value === 'false') return { type: 'BOOLEAN', value: value === 'true' };
    if (value === 'null') return { type: 'NULL', value: null };
    
    const num = Number(value);
    if (!isNaN(num) && value !== '' && /^[0-9]/.test(value)) return { type: 'NUMBER', value: num };

    return { type: 'IDENTIFIER', value };
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
        this.pos++;
        continue;
      }
      if (this.input.startsWith('//', this.pos)) {
        while (this.pos < this.input.length && this.input[this.pos] !== '\n') this.pos++;
        continue;
      }
      if (this.input.startsWith('/*', this.pos)) {
        this.pos += 2;
        while (this.pos < this.input.length && !this.input.startsWith('*/', this.pos)) this.pos++;
        this.pos += 2;
        continue;
      }
      break;
    }
  }

  peek() {
    const oldPos = this.pos;
    const token = this.nextToken();
    this.pos = oldPos;
    return token;
  }
}

// ---------- PARSER ----------

export class HytaleUIParser {
  static parse(input) {
    const tokenizer = new Tokenizer(input);
    const doc = { imports: {}, variables: {}, root: null };

    let token;
    let safetyCounter = 0;
    const maxIterations = 100000;

    while ((token = tokenizer.nextToken())) {
      if (++safetyCounter > maxIterations) {
        console.error('Parser: max iterations exceeded at top level, pos:', tokenizer.pos);
        break;
      }

      if (token.type === 'REFERENCE') {
        if (token.prefix === '$') {
          // Import: $Name = "path";
          const name = token.value;
          const eq = tokenizer.peek();
          if (eq && eq.value === '=') {
            tokenizer.nextToken(); // =
            const pathToken = tokenizer.nextToken();
            doc.imports[name] = pathToken.value;
            if (tokenizer.peek()?.value === ';') tokenizer.nextToken();
          }
        } else if (token.prefix === '@') {
          // Variable: @Name = value;
          const name = token.value;
          const eq = tokenizer.peek();
          if (eq && eq.value === '=') {
            tokenizer.nextToken(); // =
            doc.variables[name] = this.parseValue(tokenizer);
            if (tokenizer.peek()?.value === ';') tokenizer.nextToken();
          }
        }
      } else if (token.type === 'IDENTIFIER') {
        // Root element — rewind and parse
        tokenizer.pos -= token.value.length;
        doc.root = this.parseElement(tokenizer);
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

    return doc;
  }

  static parseElement(tokenizer) {
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
      return { type, id, properties: {}, children: [] };
    }

    const properties = {};
    const children = [];
    let safetyCounter = 0;
    const maxIterations = 50000;

    while (true) {
      if (++safetyCounter > maxIterations) {
        console.error('Parser: max iterations in element body, pos:', tokenizer.pos);
        break;
      }

      const next = tokenizer.peek();
      if (!next) break;
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
          properties[key] = this.parseValue(tokenizer);
          if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ';') tokenizer.nextToken();
        } else if (afterKey && afterKey.type === 'PUNCTUATION' && afterKey.value === '=') {
          // Parameter assignment: @Text = "...";
          tokenizer.nextToken(); // =
          properties[key] = this.parseValue(tokenizer);
          if (tokenizer.peek()?.type === 'PUNCTUATION' && tokenizer.peek()?.value === ';') tokenizer.nextToken();
        } else if (afterKey && (
          (afterKey.type === 'PUNCTUATION' && afterKey.value === '{') ||
          afterKey.type === 'HASH_ID'
        )) {
          // It's a child element — rewind the type name and parse
          const rewindLen = key.startsWith('@') || key.startsWith('$') || key.startsWith('%') 
            ? key.length  // prefix was already included in key
            : key.length;
          // Rewind properly based on token type
          if (keyToken.prefix) {
            tokenizer.pos -= (keyToken.value.length + 1); // +1 for the prefix char
          } else {
            tokenizer.pos -= keyToken.value.length;
          }
          const child = this.parseElement(tokenizer);
          if (child) children.push(child);
        } else {
          // Could still be a child element if after looking further we find { 
          // (e.g., the key might be a type name and the next thing after more tokens is {)
          // For safety, try to parse as child element
          if (keyToken.prefix) {
            tokenizer.pos -= (keyToken.value.length + 1);
          } else {
            tokenizer.pos -= keyToken.value.length;
          }
          const child = this.parseElement(tokenizer);
          if (child) children.push(child);
        }
      } else {
        // Skip unexpected tokens to prevent infinite loop
        tokenizer.nextToken();
      }
    }

    return { type, id, properties, children };
  }

  static parseValue(tokenizer) {
    const token = tokenizer.nextToken();
    if (!token) return null;

    // Spread: ...@VarRef or ...$Import.@Var
    if (token.type === 'SPREAD') {
      const ref = tokenizer.nextToken();
      if (ref) {
        let refStr = (ref.prefix || '') + ref.value;
        return '...' + refStr;
      }
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
        if (!peek || (peek.type === 'PUNCTUATION' && peek.value === ')')) {
          tokenizer.nextToken(); // consume )
          break;
        }

        // Handle spread inside objects: ...@Ref
        if (peek.type === 'SPREAD') {
          tokenizer.nextToken(); // consume ...
          const ref = tokenizer.nextToken();
          if (ref) {
            obj[`__spread${spreadIndex++}`] = '...' + (ref.prefix || '') + ref.value;
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
          obj[key] = this.parseValue(tokenizer);
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
        if (!peek || (peek.type === 'PUNCTUATION' && peek.value === ']')) {
          tokenizer.nextToken(); // ]
          break;
        }
        arr.push(this.parseValue(tokenizer));
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
        const args = this.parseValue(tokenizer); // parses the ( ... )
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
        if (!next) break;
        const nextVal = (next.type === 'NUMBER') ? next.value : 0;
        exprParts.push(op.value, String(nextVal));
        if (op.value === '+') result += nextVal;
        else if (op.value === '-') result -= nextVal;
      }
      return { __expr: exprParts.join(' '), __value: result };
    }
    
    return token.value;
  }
}
