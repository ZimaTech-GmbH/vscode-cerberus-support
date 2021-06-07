
import { CxLangToken, CxLangTokenizedDocument, CxLangTokenizedLine, CxLangTokenType } from './cxlang-tokenizer.feature';

export class CxLangSemanter {
  private static tokenized: CxLangTokenizedDocument;
  private static lineIndex: number = 0;
  private static line: CxLangTokenizedLine|null = null;
  private static tokenIndex: number = 0;
  private static token: CxLangToken|null = null;

  public static semant(tokenized: CxLangTokenizedDocument): CxLangSemant {
    console.log('semanting');
    let start = Date.now();

    // TODO: only changed tokens ?

    this.tokenized = tokenized;

    // reset cursor
    this.lineIndex = 0;
    this.line = this.tokenized.lines[0];
    this.tokenIndex = -1;
    this.token = null;

    const doc = new CxLangSemant(CxLangSemantType.Document, undefined);

    let token: CxLangToken|null;
    while (token = this.nextRelevantToken(true)) {
      let semant: CxLangSemant|null;
      // console.log(token?.text);
      if (semant = this.currentStorageDecl()) {
        doc.appendChild(semant);
      }
      else if (semant = this.currentFunctionDecl()) {
        doc.appendChild(semant);
      }
      else if (semant = this.currentClassDecl()) {
        doc.appendChild(semant);
      }
      else if (semant = this.currentEnumDecl()) {
        doc.appendChild(semant);
      }
      else if (token.isIn(['if', 'select', 'while', 'repeat', 'for'])) {
        doc.appendChild(
          new CxLangSemant(CxLangSemantType.Scope, token)
        );
      }
      else if (token.isIn(['end', 'endif', 'wend', 'forever', 'until', 'next'])) {
        doc.appendChild(
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

    console.log(doc);
    return doc;

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

  // storage declaration; `global`|`local`|`field`|`const` variable [, variable..]
  private static currentStorageDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.isIn(['global','local','field','const'])) {
      // this.nextRelevantToken();
      let decls: CxLangSemant[]|undefined;
      let ntoken: CxLangToken|null = null;
      do {
        ntoken = this.nextRelevantToken(ntoken != null);
        const decl = this.currentVarDecl();
        if (decl) {
          if (!decls) decls = [];
          decls.push(decl);
        }
      } while (this.token?.is(','))
      if (decls) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.StorageDecl, token, decls);
      }
    }
    return null;
  }

  private static currentEnumDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('enumerate')) {
      let decls: CxLangSemant[]|undefined;
      let ntoken: CxLangToken|null = null;
      do {
        ntoken = this.nextRelevantToken(ntoken != null);
        const decl = this.currentVarDecl();
        if (decl) {
          if (!decls) decls = [];
          decls.push(decl);
        }
      } while (this.token?.is(','))
      if (decls) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.EnumDecl, token, decls);
      }
    }
    return null;
  }

  // function/method declaration: 
  // `function`|`method` identifier [`:` type] `(` [parameters] `)`
  private static currentFunctionDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.isIn(['function', 'method'])) {
      this.nextRelevantToken();
      const ident = this.currentIdentifier();
      if (ident) {
        let childs = [ident];
        const type = this.currentTypeDecl();
        if (type) childs.push(type);
        const params = this.currentParamDecl();
        if (params) childs.push(params);
        return new CxLangSemant(CxLangSemantType.FunctionDecl, token, childs);
      }
    }
    return null;
  }

  private static currentClassDecl(): CxLangSemant|null {
    const token = this.token;
    if (token?.is('class')) {
      this.nextRelevantToken();
      const ident = this.currentIdentifier();
      if (ident) {
        let childs = [ident];
        // TODO: gentype decl, extends, implements
        // const type = this.currentTypeDecl();
        // if (type) childs.push(type);
        // const params = this.currentParamDecl();
        // if (params) childs.push(params);
        return new CxLangSemant(CxLangSemantType.ClassDecl, token, childs);
      }
    }
    return null;
  }

  private static currentParamDecl(): CxLangSemant|null {
    let token = this.token;
    if (token?.is('(')) {
      let params: CxLangSemant[]|undefined;
      do {
        token = this.nextRelevantToken(true);
        const param = this.currentVarDecl();
        if (param) {
          if (!params) params = [];
          params.push(param);
        }
      } while (this.token?.is(','));
      if (this.token?.is(')')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.ParamDecl, undefined, params);
      }
    }
    return null;
  }

  // variable declaration; identifier [`:` type [`=` value]] | [`:=` value]
  private static currentVarDecl(): CxLangSemant|null {
    const childs: CxLangSemant[] = [];
    const ident = this.currentIdentifier();
    if (ident) {
      childs.push(ident);
      const type = this.currentTypeDecl();
      if (type) {
        childs.push(type);
        if (type.token?.is(':=')) {
          const value = this.currentTerm();
          if (value) childs.push(value);
        }
      }
      if (this.token?.is('=')) {
        this.nextRelevantToken();
        const value = this.currentTerm();
        if (value) childs.push(value);
      }
      return new CxLangSemant(CxLangSemantType.VarDecl, undefined, childs);
    }
    return null;
  }

  // type; := | :type | ? | % | # | $
  private static currentTypeDecl(): CxLangSemant|null {
    const token = this.token;
    // shorthand types
    if (token?.isIn(['?','%','#','$'])) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.TypeDecl, token);
    }
    // inferred type
    else if (token?.is(':=')) {
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.TypeDecl, token);
    }
    // explicit type
    else if (token?.is(':')) {
      const ntoken = this.nextRelevantToken();
      if (
        ntoken &&
        (
          ntoken.type == CxLangTokenType.Identifier ||
          ntoken.type == CxLangTokenType.Keyword
        )
      ) {
        this.nextRelevantToken();
        // look for generic types
        let childs: CxLangSemant[]|undefined;
        const type = this.currentTypeArguments();
        if (type) childs = [type];
        return new CxLangSemant(CxLangSemantType.TypeDecl, ntoken, childs);
      } else {
        return null;
      }
    }
    return null;
  }

  // generic type in typing; < type [, type..] >
  private static currentTypeArguments(): CxLangSemant|null {
    // this.pushCache();
    let token = this.token;
    if (token?.is('<')) {
      let types: CxLangSemant[]|undefined;
      do {
        token = this.nextRelevantToken(true);
        const type = this.currentTypeDecl();
        if (type) {
          if (!types) types = [];
          types.push(type);
        } else {
          return null;
        }
      } while (this.token?.is(','));
      if (this.token?.is('>')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.TypeArgument, undefined, types);
      }
    }
    return null;
  }

  // term; value [operator value]
  private static currentTerm(): CxLangSemant|null {
    const childs: CxLangSemant[] = [];
    let val = this.currentValue();
    if (val) {
      let op: CxLangSemant|null;
      do {
        childs.push(val);
        op = this.currentOperator();
        if (op) {
          childs.push(op)
          val = this.currentValue();
        } else {
          return new CxLangSemant(CxLangSemantType.Term, undefined, childs);
        }
      } while (op && val)
    }
    return null;
  }

  // value; literal | declaration.value | declaration[invocation][indexing]
  // TODO: scoping after inocation/indexing
  private static currentValue(): CxLangSemant|null {
    // TODO: get sign
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
      return new CxLangSemant(CxLangSemantType.Value, token);
    }
    // TODO multiline strings
    else if (token && (
      token.type == CxLangTokenType.LiteralString
    )) {
      // look for indexing
      let childs: CxLangSemant[]|undefined;
      const indexing = this.currentIndexing();
      if (indexing) childs = [indexing];
      this.nextRelevantToken();
      return new CxLangSemant(CxLangSemantType.Indexing, token, childs);
    }
    else if (token && (
      token.type == CxLangTokenType.Identifier ||
      token.type == CxLangTokenType.Keyword
    )) {
      this.nextRelevantToken();
      let childs: CxLangSemant[]|undefined;
      // look for child accessor
      // if (this.nextRelevantToken()?.is('.')) {
      //   const child = this.getValue(true);
      //   if (child) childs = [child];
      // }
      // look for invocation and indexing
      // else {
        const invocation = this.currentInvocation();
        if (invocation) childs = [invocation];
        const indexing = this.currentIndexing();
        if (indexing) {
          if (!childs) childs = [];
          childs = [indexing];
        }
      // }
      return new CxLangSemant(CxLangSemantType.Indexing, token, childs);
    }
    return null;
  }

  // invocation; ( term [, term..] )
  private static currentInvocation(): CxLangSemant|null {
    let token = this.token;
    if (token?.is('(')) {
      let terms: CxLangSemant[]|undefined;
      do {
        token = this.nextRelevantToken(true);
        const term = this.currentTerm();
        if (term) {
          if (!terms) terms = [];
          terms.push(term);
        } else {
          return null;
        }
      } while (this.token?.is(','));
      if (this.token?.is(')')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.Invocation, undefined, terms);
      }
    }
    return null;
  }

  // indexing; `[` term [, term..] `]`
  private static currentIndexing(): CxLangSemant|null {
    // TODO spreading
    let token = this.token;
    if (token?.is('[')) {
      let terms: CxLangSemant[]|undefined;
      do {
        token = this.nextRelevantToken(true);
        const term = this.currentTerm();
        if (term) {
          if (!terms) terms = [];
          terms.push(term);
        } else {
          return null;
        }
      } while (this.token?.is(','));
      if (this.token?.is(']')) {
        this.nextRelevantToken();
        return new CxLangSemant(CxLangSemantType.Invocation, undefined, terms);
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

}

export class CxLangSemant {
  public type: CxLangSemantType;
  public token: CxLangToken|undefined;
  public childs: CxLangSemant[]|undefined;
  public parent: CxLangSemant|undefined;

  constructor (type: CxLangSemantType, token: CxLangToken|undefined, childs: CxLangSemant[]|undefined = undefined) {
    this.type = type;
    this.token = token;
    this.childs = childs;
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
}

export enum CxLangSemantType {
  Document,
  Keyword,
  Identifier,
  StorageDecl,
  EnumDecl,
  VarDecl,
  TypeDecl,
  TypeArgument,
  FunctionDecl,
  ParamDecl,
  ClassDecl,
  Term,
  Value,
  Invocation,
  Indexing,
  Operator,
  Scope,
  EndScope
}
