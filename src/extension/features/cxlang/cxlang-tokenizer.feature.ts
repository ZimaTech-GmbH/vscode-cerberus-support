import * as vscode from 'vscode';

export class CxLangTokenizer {
  private static documents = new WeakMap<vscode.TextDocument, CxLangTokenizedDocument>();

  public static tokenize(document: vscode.TextDocument): CxLangTokenizedDocument {
    console.log('tokenizing');
    let start = Date.now();
    let tokenized = this.documents.get(document);
    if (!tokenized) {
      tokenized = new CxLangTokenizedDocument(document);
      this.documents.set(document, tokenized);
    }
    // find lines that need tokenizing
    const lineCount = document.lineCount
    const tlines = Array<CxLangTokenizedLine>(lineCount);
    // first from top to bottom, then from bottom to top
    let startIndex: number = 0;
    let endIndex: number = lineCount - 1;
    let endStack: string = '';
    for (const dir of [+1, -1]) {
      let dlineIdx = 0;
      let tlineIdx = 0;
      if (dir == -1) {
        dlineIdx = lineCount - 1;
        tlineIdx = tokenized.lines.length - 1;
      }
      for (let i = 0; i < lineCount; i++) {
        const line: vscode.TextLine = document.lineAt(dlineIdx);
        const tline: CxLangTokenizedLine = tokenized.lines[tlineIdx];
        // in backwards scan, abort when reached startIndex
        if (dir == -1 && dlineIdx == startIndex) {
          endIndex = startIndex;
          break;
        }
        // abort once a differing line or
        // in backwards scan the start is reached
        if (
          !tline || tline.text != line.text ||
          (dir == -1 && dlineIdx == startIndex)
        ) {
          // track lines at which to start/end tokenizing,
          if (dir == 1) {
            startIndex = dlineIdx;
          }
          if (dir == -1) {
            endIndex = dlineIdx;
            //... also keep track of precompiler stack at boundary
            if (tline) {
              endStack = tline.pcsStackAtLineEnd;
            }
          }
          break;
        } else {
          tlines[dlineIdx] = tline;
          tline.updateLine(line);
        }
        dlineIdx += dir;
        tlineIdx += dir;
      }
    }
    // tokenize edited range
    let stack = '';
    if (startIndex > 0) stack = tlines[startIndex-1].pcsStackAtLineEnd;
    for (let lineIdx = startIndex; lineIdx <= endIndex; lineIdx++) {
      const line: vscode.TextLine = document.lineAt(lineIdx);
      const tline = new CxLangTokenizedLine(line, stack);
      tlines[lineIdx] = tline;
      stack = tline.pcsStackAtLineEnd;
      // when endstack mismatches, tokenize whole document
      if (lineIdx == endIndex && stack != endStack) {
        endIndex = lineCount - 1;
      }
    }
    tokenized.lines = tlines;
    tokenized.lineCount = document.lineCount;
    let end = Date.now();
    console.log(`tokenized ${endIndex - startIndex} lines in ${end-start}ms`);
    return tokenized;
  }
}

export class CxLangTokenizedDocument {
  public lineCount: number;
  public lines: CxLangTokenizedLine[] = [];

  constructor(document: vscode.TextDocument) {
    this.lineCount = document.lineCount;
  }
}

export class CxLangTokenizedLine {
  public text: string;
  public tokens: CxLangToken[] = [];
  public _line: vscode.TextLine;
  public range: vscode.Range;
  // precompiler scope stack
  public pcsStackAtLineEnd: string = '';

  private _text: string;

  constructor(line: vscode.TextLine, stack: string) {
    this._line = line;
    this.range = line.range;
    this.text = line.text;
    this._text = this.text;
    // console.log('tokenizing ' + this._text);
    while (true) {
      // in comment blocks, only look for end of comment
      if (stack.includes('r')) {
        // end of comment
        if (this.tokenizes(/^\s*#end\b.*/i, CxLangTokenType.CommentBlock)) {
          stack = stack.substring(0, -1);
          continue;
        }
        // still comment
        if (this.tokenizes(/^.*$/, CxLangTokenType.CommentBlock)) break;
      }
      // in multi-line strings, look for end of string
      else if (stack.includes('q')) {
        // end of string
        if (this.tokenizes(/^.*?"/, CxLangTokenType.LiteralString)) {
          stack = stack.substring(0, -1);
          continue;
        }
        // still string
        if (this.tokenizes(/^.*$/, CxLangTokenType.LiteralString)) break;
      }
      // look for everything else
      else {
        // whitespace
        if (this.tokenizes(/^\s+/, CxLangTokenType.Whitespace)) continue;
        // terminators
        if (this.tokenizes(/^;/, CxLangTokenType.Terminator)) continue;
        if (this.tokenizes(/^$/, CxLangTokenType.Terminator)) break;
        // comments
        if (this.tokenizes(/^'.*/, CxLangTokenType.CommentLine)) continue;
        // comment blocks
        if (this.tokenizes(/^#rem\b.*/i, CxLangTokenType.CommentBlock)) {
          stack = stack + 'r';
          continue;
        }
        // preprocessor blocks
        if (this.tokenizes(/^#(if|elseif|else)\b.*/i, CxLangTokenType.PreprocessorConditional)) {
          stack = stack + 'c';
          continue;
        }
        // end of preprocessor blocks
        if (this.tokenizes(/^#end\b.*/i, CxLangTokenType.PreprocessorConditional)) {
          stack = stack.substring(0, -1);
          continue;
        }
        // preprocessor directives
        if (this.tokenizes(/^#\w*\b.*/i, CxLangTokenType.PreprocessorDirective)) continue;
        // float
        if (this.tokenizes(/^[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/, CxLangTokenType.LiteralFloat)) continue;
        // integer
        if (this.tokenizes(/^[0-9]+?/, CxLangTokenType.LiteralInteger)) continue;
        // binary
        if (this.tokenizes(/^%[01]+/, CxLangTokenType.LiteralBinary)) continue;
        // hex
        if (this.tokenizes(/^\$[a-fA-F0-9]+/, CxLangTokenType.LiteralHexadecimal)) continue;
        // character
        if (this.tokenizes(/^`.`/, CxLangTokenType.LiteralCharcode)) continue;
        if (this.tokenizes(/^`~([qgnrtz~]|u[a-fA-F0-9]{4})`/, CxLangTokenType.LiteralCharcodeEscaped)) continue;
        // terminated strings
        if (this.tokenizes(/^".*?"/, CxLangTokenType.LiteralString)) continue;
        // multiline strings
        if (this.tokenizes(/^".*$/, CxLangTokenType.LiteralString)) {
          stack = stack + 'q';
          continue;
        }
        // keyword
        if (this.tokenizes(/^(Abstract|And|Array|Bool|Case|Catch|Class|Const|Continue|Default|Eachin|Else|ElseIf|End|EndIf|Enumerate|Exit|Extends|Extern|False|Field|Final|Float|For|Forever|Function|Global|If|Implements|Import|Include|Inline|Int|Interface|Local|Method|Mod|Module|New|Next|Not|Object|Or|Private|Property|Public|Repeat|Return|Select|Self|Shl|Shr|Step|Strict|String|Super|Then|Throw|To|True|Try|Until|Void|Wend|While)\b/i, CxLangTokenType.Keyword)) continue;
        // identifier
        if (this.tokenizes(/^[a-zA-Z_][a-zA-Z0-9_]*\b/, CxLangTokenType.Identifier)) continue;
        // operator
        if (this.tokenizes(/^(\+|-|~|\*|\/|&|\||=|<|>|<=|>=|<>)/, CxLangTokenType.Operator)) continue;
        // punctuation
        if (this.tokenizes(/^(:=|[,.:?%#$])/, CxLangTokenType.Punctuation)) continue;
        // parentheses
        if (this.tokenizes(/^\(/, CxLangTokenType.PunctuationParensBegin)) continue;
        if (this.tokenizes(/^\)/, CxLangTokenType.PunctuationParensEnd)) continue;
        if (this.tokenizes(/^\[/, CxLangTokenType.PunctuationBracketsBegin)) continue;
        if (this.tokenizes(/^\]/, CxLangTokenType.PunctuationBrackedsEnd)) continue;
        // invalid
        if (this.tokenizes(/^./, CxLangTokenType.Invalid)) continue;
      }
    }
    this.pcsStackAtLineEnd = stack;
    // debug
    // let oline = '';
    // for (const token of this.tokens) {
    //   oline = oline + `${token.type}:${token.text}|`;
    // }
    // oline = oline + stack;
    // console.log(oline);
  }

  private tokenizes(pattern: RegExp, ttype: CxLangTokenType): boolean {
    let tokened: boolean = false;
    this._text = this._text.replace(pattern, (m) => {
      const index = this.tokens.length;
      this.tokens.push(new CxLangToken(ttype, m, index));
      tokened = true;
      return '';
    });
    return tokened;
  }

  public updateLine(line: vscode.TextLine) {
    this._line = line;
    this.range = line.range;
  }

  public isEmptyOrWhitespace(): boolean {
    if (this.tokens.length == 0) return true;
    for (const token of this.tokens) {
      if (token.type != CxLangTokenType.Whitespace) return false;
    }
    return true;
  }

  // public nextNonWhitespaceToken(from: number = 0): CxLangToken|null {
  //   for (let index = from; index < this.tokens.length; index++) {
  //     const token = this.tokens[index];
  //     if (token.type != CxLangTokenType.Whitespace) return token;
  //   }
  //   return null;
  // }

  // private nextIndexWhenType(from: CxLangToken|null = null, type: CxLangTokenType): number {
  //   const i0 = from ? from.index+1 : 0;
  //   for (let index = i0; index < this.tokens.length; index++) {
  //     const token = this.tokens[index];
  //     if (token.type == type) return index;
  //     if (token.type != CxLangTokenType.Whitespace) return -1;
  //   }
  //   return -1;
  // }

  // private nextIndexWhenTypeIn(from: CxLangToken|null = null, types: CxLangTokenType[]): number {
  //   const i0 = from ? from.index+1 : 0;
  //   for (let index = i0; index < this.tokens.length; index++) {
  //     const token = this.tokens[index];
  //     if (types.includes(token.type)) return index;
  //     if (token.type != CxLangTokenType.Whitespace) return -1;
  //   }
  //   return -1;
  // }

  /**
   * Index of next non-whitespace token
   * @param from optional start index
   * @returns index or -1 if line end reached
   */
  // public nextTokenIndex(from: number = 0): number {
  //   for (let i = from; i < this.tokens.length; i++) {
  //     if (this.tokens[i].type != CxLangTokenType.Whitespace) return i;
  //   }
  //   return -1;
  // }
}

export enum CxLangTokenType {
  Whitespace,
  Terminator,
  Invalid,
  PreprocessorConditional,
  PreprocessorDirective,
  CommentLine,
  CommentBlock,
  Keyword,
  Identifier,
  Operator,
  LiteralFloat,
  LiteralInteger,
  LiteralBinary,
  LiteralHexadecimal,
  LiteralCharcode,
  LiteralCharcodeEscaped,
  LiteralString,
  Punctuation,
  PunctuationParensBegin,
  PunctuationParensEnd,
  PunctuationBracketsBegin,
  PunctuationBrackedsEnd
}

// export enum CxLangTokenSemantType {
//   Unchanged,
//   ClassIdentifier,
//   InterfaceIdentifier,
//   FunctionIdentifier,
//   MethodIdentifier,
//   GlobalIdentifier,
//   FieldIdentifier,
//   LocalIdentifier,
//   ConstIdentifier
// }

export class CxLangToken {
  public type: CxLangTokenType;
  // public semantic: CxLangTokenSemantType = CxLangTokenSemantType.Unchanged;
  public text: string;
  public index: number;
  public parent: CxLangToken|null = null;
  public range: vscode.Range;

  constructor (type: CxLangTokenType, text: string, index: number) {
    this.type = type;
    this.text = text;
    this.index = index;
    this.range = new vscode.Range(0,0,0,0);
  }

  public is(text: string): boolean {
    return this.text.toLowerCase() == text;
  }

  public isIn(texts: string[]): boolean {
    for (const text of texts) {
      if (this.text.toLowerCase() == text) return true;
    }
    return false;
  }
}