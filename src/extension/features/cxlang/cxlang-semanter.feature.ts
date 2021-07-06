
import { CxLangToken, CxLangTokenizedDocument, CxLangTokenizedLine, CxLangTokenType } from './cxlang-tokenizer.feature';

export class CxLangSemanter {
  private static tokenized: CxLangTokenizedDocument;
  private static lineIndex: number = 0;
  private static line: CxLangTokenizedLine|null = null;
  private static tokenIndex: number = 0;
  private static token: CxLangToken|null = null;

  public static semant(tokenized: CxLangTokenizedDocument): CxLangSemant[] {
    console.log('semanting');
    let start = Date.now();

    // TODO: only changed tokens ?

    this.tokenized = tokenized;

    // reset cursor
    this.lineIndex = 0;
    this.line = this.tokenized.lines[0];
    this.tokenIndex = -1;
    this.token = null;

    const semants: CxLangSemant[] = [];
    // const doc = new CxLangSemant(CxLangSemantType.Document, undefined);

    let token: CxLangToken|null;
    while (token = this.nextRelevantToken(true)) {
      let semant: CxLangSemant|null;
      // console.log(token?.text);
      if (semant = this.currentStorageDecl()) {
        // doc.appendChild(semant);
        semants.push(semant);
      }
      else if (semant = this.currentFunctionDecl()) {
        // doc.appendChild(semant);
        semants.push(semant);
      }
      else if (semant = this.currentClassDecl()) {
        // doc.appendChild(semant);
        semants.push(semant);
      }
      else if (semant = this.currentIfBlock()) {
        semants.push(semant);
      }
      else if (token.isIn(['select', 'while', 'repeat', 'for'])) {
        // doc.appendChild(
        semants.push(
          new CxLangSemant(CxLangSemantType.Scope, token)
        );
      }
      else if (token.isIn(['else', 'elseif'])) {
        semants.push(
          new CxLangSemant(CxLangSemantType.EndScope, token),
          new CxLangSemant(CxLangSemantType.Scope, token)
        );
      }
      else if (token.isIn(['end', 'endif', 'wend', 'forever', 'until', 'next'])) {
        // doc.appendChild(
        semants.push(
          new CxLangSemant(CxLangSemantType.EndScope, token)
        );
      }
    }

    let end = Date.now();
    console.log(`semanted in ${end-start}ms`);

    // for (let index = 0; index < tokenized.lines.length; index++) {
    //   const line = tokenized.lines[index];
    //   let oline = '';
    //   for (const token of line.tokens) {
    //     oline += `${token.type}:${token.text}|`;
    //   }
    //   // console.log(oline);
    // }

    // console.log(doc);
    return semants;

  }

  /* all the joy lies here */

  private static nextRelevantToken(allowNewLine: boolean = false): CxLangToken|null {
    if (!this.line) return null;
    do {
      // proceed to next token
      this.tokenIndex++;
      // end of line reached?
      if (this.tokenIndex >= this.line.tokens.length) {
        if (!allowNewLine) {
          this.token = null;
          return null;
        } else {
          this.tokenIndex = 0;
          this.lineIndex++;
          this.line = this.tokenized.lines[this.lineIndex];
          if (!this.line) return null;
        }
      }
      this.token = this.line.tokens[this.tokenIndex];
    } while (!this.currentIsRelevant())
    return this.token;
  }

  private static currentIsRelevant(): boolean {
    if (
      this.token &&
      this.token.type != CxLangTokenType.Whitespace &&
      this.token.type != CxLangTokenType.Terminator &&
      this.token.type != CxLangTokenType.CommentBlock &&
      this.token.type != CxLangTokenType.CommentLine &&
      this.token.type != CxLangTokenType.PreprocessorConditional &&
      this.token.type != CxLangTokenType.PreprocessorDirective
    ) return true;
    return false;
  }

  // next Cerberus X keyword
  private static currentKeyword(): CxLangSemant|null {
    // this.pushCache();
    const token = this.token;
    if (token?.type == CxLangTokenType.Keyword) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.Keyword, token);
    }
    return null;
  }

  // valid identifier
  private static currentIdentifier(): CxLangSemant|null {
    const token = this.token;
    if (
      token && (
        token.type == CxLangTokenType.Identifier ||
        token.type == CxLangTokenType.Keyword
      )
    ) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.Identifier, token);
    }
    return null;
  }

  // storage declaration; `enumerate`|`global`|`local`|`field`|`const` variable [, variable..]
  private static currentStorageDecl(): CxLangSemant|null {
    const token = this.token;
    const storageDecl = token?.isIn(['global','local','field','const']);
    const enumDecl = token?.is('enumerate');
    if (token && (storageDecl || enumDecl)) {
      const type = storageDecl ? CxLangSemantType.StorageDecl : CxLangSemantType.EnumDecl;
      const childs: (CxLangSemant|null)[] = [];
      let ntoken: CxLangToken|null = null;
      do {
        ntoken = this.nextRelevantToken(ntoken != null);
        childs.push(this.currentVarDecl());
      } while (this.token?.is(','))
      return new CxLangSemant(type, token, childs);
    }
    return null;
  }

  // function/method declaration: 
  // `function`|`method` identifier [`:` type] `(` [parameters] `)`
  private static currentFunctionDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.isIn(['function', 'method'])) {
      this.nextRelevantToken();
      const childs = [
        this.currentIdentifier(),
        this.currentTypeDecl(),
        this.currentParamDecl()
      ];
      return new CxLangSemant(CxLangSemantType.FunctionDecl, token, childs);
    }
    return null;
  }

  private static currentClassDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('class')) {
      this.nextRelevantToken();
      const childs = [
        this.currentIdentifier(),
        // TODO: gentype decl, extends, implements
      ];
      return new CxLangSemant(CxLangSemantType.ClassDecl, token, childs);
    }
    return null;
  }

  private static currentParamDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('(')) {
      const childs: (CxLangSemant|null)[] = [];
      do {
        this.nextRelevantToken(true);
        childs.push(this.currentVarDecl());
      } while (this.token?.is(','));
      if (this.token?.is(')')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.ParamDecl, token, childs);
      }
    }
    return null;
  }

  // variable declaration; identifier [`:` type [`=` value]] | [`:=` value]
  private static currentVarDecl(): CxLangSemant|null {
    const ident = this.currentIdentifier();
    if (ident) {
      const childs: (CxLangSemant|null)[] = [ident];
      const type = this.currentTypeDecl();
      if (type) {
        childs.push(type);
        if (type.token?.is(':=')) {
          childs.push(this.currentExpression());
        }
      }
      childs.push(this.currentAssignment());
      return new CxLangSemant(CxLangSemantType.VarDecl, ident.token, childs);
    }
    return null;
  }

  // type; `:=` | `:` type | `?` | `%` | `#` | `$`
  private static currentTypeDecl(): CxLangSemant|null {
    const token = this.token;
    // shorthand types
    if (token?.isIn(['?','%','#','$'])) {
      this.nextRelevantToken();
      const childs = [this.currentTypeArray()];
      return new CxLangSemant(CxLangSemantType.TypeDecl, token, childs);
    }
    // inferred type
    else if (token?.is(':=')) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.TypeDecl, token);
    }
    // explicit type
    else if (token?.is(':')) {
      this.nextRelevantToken();
      const childs = [this.currentType()];
      return new CxLangSemant(CxLangSemantType.TypeDecl, token, childs);
    }
    return null;
  }

  private static currentType(): CxLangSemant|null {
    const ident = this.currentIdentifier();
    if (ident) {
      const childs = [
        ident,
        this.currentTypeArguments(),
        this.currentTypeArray()
      ];
      return new CxLangSemant(CxLangSemantType.Type, ident.token, childs);
    }
    return null;
  }

  // generic type in typing; < type [, type..] >
  private static currentTypeArguments(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('<')) {
      const childs: (CxLangSemant|null)[] = [];
      do {
        this.nextRelevantToken(true);
        childs.push(this.currentType());
      } while (this.token?.is(','));
      if (this.token?.is('>')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.TypeArgument, token, childs);
      }
    }
    return null;
  }

  // type-array; `[` expression `]`
  private static currentTypeArray(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('[')) {
      this.nextRelevantToken();
      const childs = [this.currentExpression()];
      if (this.token?.is(']')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.TypeArray, token, childs);
      }
    }
    return null;
  }

  // assignment; `=` expression
  private static currentAssignment(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('=')) {
      this.nextRelevantToken();
      const childs = [this.currentExpression()];
      return new CxLangSemant(CxLangSemantType.Assignment, token, childs)
    }
    return null;
  }

  // expression; [unary-operator] expression [operator expression]
  private static currentExpression(): CxLangSemant|null {
    // const childs: CxLangSemant[] = [];
    const token = this.token;
    if (token?.is('new')) {
      this.nextRelevantToken();
      const childs = [this.currentAccessor(true)];
      return new CxLangSemant(CxLangSemantType.NewExpression, token, childs);
    }
    else if (token) {
      const childs = [this.currentUnaryOperator()];
      while (true) {
        childs.push(this.currentAccessor() || this.currentLiteral());
        const op = this.currentOperator();
        if (op) {
          childs.push(op);
        } else {
          return new CxLangSemant(CxLangSemantType.Expression, token, childs);
        }
      }
    }
    return null;
  }

  // decl-expression: identifier [ivocation] [indexing..] [accessor]
  // accessor: [`.`] decl-expression [accessor]
  private static currentAccessor(allowTypeArgs: boolean = false): CxLangSemant|null {
    const token = this.token;
    if (token?.is('.')) this.nextRelevantToken();
    const ident = this.currentIdentifier();
    if (token && ident) {
      const childs: (CxLangSemant|null)[] = [ident];
      if (allowTypeArgs) childs.push(this.currentTypeArguments());
      childs.push(this.currentInvocation());
      // cover array of array of array ...
      let indexing: CxLangSemant|null;
      while (indexing = this.currentIndexing()) {
        childs.push(indexing);
      }
      // more to come?
      childs.push(this.currentAccessor());
      return new CxLangSemant(CxLangSemantType.Accessor, token, childs);
    }
    return null;
  }

  // unary operator: `+`, `-`, `~`, `not`
  private static currentUnaryOperator(): CxLangSemant|null {
    const token = this.token;
    if (token?.isIn(['+', '-', '~', 'not'])) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.UnaryOperator, token);
    }
    return null;
  }

  // literal
  private static currentLiteral(): CxLangSemant|null {
    const token = this.token;
    if (token && (
      token.type == CxLangTokenType.LiteralBinary ||
      token.type == CxLangTokenType.LiteralCharcode ||
      token.type == CxLangTokenType.LiteralCharcodeEscaped ||
      token.type == CxLangTokenType.LiteralFloat ||
      token.type == CxLangTokenType.LiteralHexadecimal ||
      token.type == CxLangTokenType.LiteralInteger ||
      token.isIn(['true', 'false', 'null'])
    )) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.Literal, token);
    }
    // TODO multiline strings
    else if (token && (
      token.type == CxLangTokenType.LiteralString
    )) {
      this.nextRelevantToken();
      // look for indexing
      const childs = [
        new CxLangSemant(CxLangSemantType.LiteralStringLine, token),
        this.currentIndexing()
      ];
      return new CxLangSemant(CxLangSemantType.LiteralString, token, childs);
    }
    // TODO array literals
    return null;
  }

  // invocation; ( term [, term..] )
  private static currentInvocation(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('(')) {
      const childs: (CxLangSemant|null)[] = [];
      do {
        this.nextRelevantToken(true);
        childs.push(this.currentExpression());
      } while (this.token?.is(','));
      if (this.token?.is(')')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.Invocation, token, childs);
      }
    }
    return null;
  }

  // indexing; `[` expression [, expression..] `]`
  private static currentIndexing(): CxLangSemant|null {
    // TODO spreading
    const token = this.token;
    if (token?.is('[')) {
      const childs: (CxLangSemant|null)[] = [];
      do {
        this.nextRelevantToken(true);
        childs.push(this.currentExpression());
      } while (this.token?.is(','));
      if (this.token?.is(']')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.Indexing, token, childs);
      }
    }
    return null;
  }

  // operator; + | - | * | / | = | ...
  private static currentOperator(): CxLangSemant|null {
    const token = this.token;
    if (token && (
      token.isIn([
        '+','-','~','*','/','&','|',
        '=','<','>','<=','>=','<>',
        'shl', 'shr', 'and', 'or', 'mod'
      ])
    )) {
      this.nextRelevantToken(true);
      return new CxLangSemant(CxLangSemantType.Operator, token);
    }
    return null;
  }

  // if block
  private static currentIfBlock(): CxLangSemant|null {
    const token = this.token;
    if (token && token.is('if')) {
      // if block is when nothing follows then (or then omitted)
      let t: CxLangToken|null;
      let hasThen: boolean = false;
      let isOneLiner: boolean = false;
      while (t = this.nextRelevantToken()) {
        if (!hasThen) {
          if (t.is('then')) hasThen = true;
        } else {
          isOneLiner = true;
        }
      }
      if (!isOneLiner) return new CxLangSemant(CxLangSemantType.Scope, token);
      return null;
    }
    return null;
  }

}

export class CxLangSemant {
  public type: CxLangSemantType;
  public token: CxLangToken;
  public childs: CxLangSemant[]|undefined;
  public parent: CxLangSemant|undefined;

  constructor (type: CxLangSemantType, token: CxLangToken, childs: (CxLangSemant|null)[]|undefined = undefined) {
    this.type = type;
    this.token = token;
    this.childs = undefined;
    // copy only not-null childs
    if (childs) {
      for (const c of childs) {
        if (c) {
          if (!this.childs) this.childs = [];
          this.childs.push(c)
        }
      }
    }
    if (this.childs) {
      for (const child of this.childs) {
        child.parent = this;
      }
    }
  }

  public appendChild(semant: CxLangSemant) {
    if (!this.childs) this.childs = [];
    this.childs.push(semant);
    semant.parent = this;
  }

  public getIdentifier(): string {
    if (this.childs) {
      for (const child of this.childs) {
        if (child.type == CxLangSemantType.Identifier) {
          return child.token.text || '';
        }
      }
    }
    return '';
  }

  /**
   * Returns the definitions following the identifier as pretty printed string
   */
  public getDetailsText(): string {
    // console.log('getting details for', this);
    let texts: string[] = [];
    let acquire = false;
    if (this.childs) {
      for (const child of this.childs) {
        if (!acquire) {
          if (child.type == CxLangSemantType.Identifier) acquire = true;
        } else {
          texts.push(child.prettyPrint());
        }
      }
    }
    return texts.join('\u2009');
  }

  public prettyPrint(): string {
    let text = '';
    switch (this.type) {
      case CxLangSemantType.Keyword:
      case CxLangSemantType.Identifier:
        text = this.token.text || 'NA';
        break;
      case CxLangSemantType.StorageDecl:
      case CxLangSemantType.EnumDecl:
      case CxLangSemantType.TypeDecl:
      case CxLangSemantType.Assignment:
        text = this.token.text + '\u2009' + this.prettyPrintChilds();
        break;
      case CxLangSemantType.Literal:
      case CxLangSemantType.LiteralStringLine:
      case CxLangSemantType.UnaryOperator:
      case CxLangSemantType.Operator:
        text = this.token.text;
        break;
      case CxLangSemantType.TypeArgument:
        text = '<\u2009' + this.prettyPrintChilds() + '\u2009>';
        break;
      case CxLangSemantType.ParamDecl:
      case CxLangSemantType.Invocation:
        text = '(\u2009' + this.prettyPrintChilds() + '\u2009)';
        break;
      case CxLangSemantType.Indexing:
      case CxLangSemantType.TypeArray:
        text = '[\u2009' + this.prettyPrintChilds() + '\u2009]';
        break;
      case CxLangSemantType.Accessor:
        if (this.token.is('.')) text = '.\u2009';
        text += this.prettyPrintChilds();
        break;
      case CxLangSemantType.NewExpression:
        text = 'New\u2009' + this.prettyPrintChilds();
        break;
      default:
        text = this.prettyPrintChilds();
        break;
    }
    return text;
  }

  public prettyPrintChilds(): string {
    let texts: string[] = [];
    if (this.childs) {
      for (const child of this.childs) {
        texts.push(child.prettyPrint());
      }
    }
    return texts.join('\u2009');
  }
}

export enum CxLangSemantType {
  Document,
  Keyword,
  Identifier,
  StorageDecl,
  EnumDecl,
  VarDecl,
  TypeDecl,
  Type,
  TypeArgument,
  TypeArray,
  FunctionDecl,
  ParamDecl,
  ClassDecl,
  Assignment,
  Expression,
  NewExpression,
  Accessor,
  Literal,
  LiteralString,
  LiteralStringLine,
  Invocation,
  Indexing,
  UnaryOperator,
  Operator,
  Scope,
  EndScope
}
