import * as vscode from 'vscode';
import { CxLangSemant, CxLangSemanter, CxLangSemantType } from '../features/cxlang/cxlang-semanter.feature';
import { CxLangTokenizer, CxLangToken } from '../features/cxlang/cxlang-tokenizer.feature';

/**
 * Provides a `vscode.DocumentSymbol` tree for the outline
 */
export class CxDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private fileSymbol: vscode.DocumentSymbol = {} as unknown as vscode.DocumentSymbol;

  private scopeStack: vscode.DocumentSymbol[] = [];

  /**
   * Builds the tree. Invoked automatically by VS Code
   * @param document `vscode.TextDocument` to build the tree for
   * @param token `vscode.CancellationToken`
   * @returns `vscode.DocumentSymbol[]`
   */
  public provideDocumentSymbols( document: vscode.TextDocument, token: vscode.CancellationToken ): vscode.DocumentSymbol[] {
    const tokenized = CxLangTokenizer.tokenize(document);
    const semanted = CxLangSemanter.semant(tokenized);

    // prepare root (file) symbol
    const fileName: string = (document.fileName.match(/[^\\\/]*$/) || ["untitled"])[0];
    const fileRange: vscode.Range = new vscode.Range(0,0, 0,0).with(
      undefined, document.lineAt(document.lineCount-1).range.end
    )
    this.fileSymbol = new vscode.DocumentSymbol(
      fileName,
      "",
      vscode.SymbolKind.File,
      fileRange,
      new vscode.Range(0,0, 0,0)
    );
    // state
    this.scopeStack = [this.fileSymbol];
    this.symboliseChilds(semanted);
    
    return [this.fileSymbol];
  }

  private symboliseChilds(semants: CxLangSemant[]) {
    for (const s of semants) {
      if (s.type == CxLangSemantType.ClassDecl && s.childs) {
        // classes always go to file symbol
        this.scopeStack = this.scopeStack.slice(-1);
        let kind = vscode.SymbolKind.Class;
        let ident = s.getIdentifier();
        this.scopeStack.unshift(this.appendSymbol2(ident, '', kind, s.childs[0].token));
      }
      else if (s.type == CxLangSemantType.FunctionDecl && s.childs) {
        let kind = vscode.SymbolKind.Function;
        if (s.token.is('method')) {
          kind = vscode.SymbolKind.Method;
        }
        let ident = s.getIdentifier();
        this.scopeStack.unshift(this.appendSymbol2(ident, s.getDetailsText(), kind, s.childs[0].token));
        // also: parameters
        s.childs.forEach((c) => {
          if (c.type == CxLangSemantType.ParamDecl) {
            c.childs?.forEach((cc) => {
              let kind = vscode.SymbolKind.Variable;
              let ident = cc.getIdentifier();
              this.appendSymbol2(ident || 'NA', cc.getDetailsText(), kind, cc.token);
            });
          }
        })
      }
      else if (s.type == CxLangSemantType.StorageDecl && s.childs) {
        let kind = vscode.SymbolKind.Variable;
        if (s.token.is('const')) {
          kind = vscode.SymbolKind.Constant;
        }
        for (const k of s.childs) {
          let ident = k.getIdentifier();
          this.appendSymbol2(ident || 'NA', k.getDetailsText(), kind, k.token);
        }
      }
      else if (s.type == CxLangSemantType.EnumDecl && s.childs) {
        // find common prefix
        let commonName = '';
        if (s.childs && s.childs[0]) {
          commonName = s.childs[0].getIdentifier();
          for (const k of s.childs) {
            let ident = k.getIdentifier();
            commonName = this.getCommonBeginning(commonName, ident);
          }
          if (commonName) {
            commonName += "*"
          } else {
            commonName = "(no common prefix)"
          }
        }
        this.scopeStack.unshift(this.appendSymbol2(commonName, '', vscode.SymbolKind.Enum, s.token));
        let kind = vscode.SymbolKind.EnumMember;
        for (const k of s.childs) {
          let ident = k.getIdentifier();
          this.appendSymbol2(ident || 'NA', k.getDetailsText(), kind, k.token);
        }
        this.scopeStack.shift();
      }
      else if (s.type == CxLangSemantType.Scope) {
        let kind = vscode.SymbolKind.Namespace;
        this.scopeStack.unshift(this.appendSymbol2(s.token.text, '', kind, s.token));
      }
      else if (s.type == CxLangSemantType.EndScope) {
        this.scopeStack.shift();
      }
    }
  }

  private appendSymbol2(identifier: string, details: string, kind: vscode.SymbolKind, token: CxLangToken): vscode.DocumentSymbol {
    const cur = this.scopeStack[0] || this.fileSymbol;
    const symbol = new vscode.DocumentSymbol(
      identifier,
      details,
      kind,
      token.range,
      token.range
    );
    cur.children.push(symbol);
    return symbol;
  }

  // start-based intersection of two strings
  private getCommonBeginning(text1: string, text2: string): string {
    let common: string = "";
    let len: number = Math.min(text1.length, text2.length);
    for (let i = 0; i < len; i++) {
      if (text1.charCodeAt(i) === text2.charCodeAt(i)) {
        common += text1.charAt(i);
      } else {
        break;
      }
    }
    return common;
  }
}