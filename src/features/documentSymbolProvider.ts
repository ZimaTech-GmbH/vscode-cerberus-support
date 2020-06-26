//zdoc ### src/features/documentSymbolProvider.ts ###

import * as vscode from 'vscode';

enum PreprocessorBlock {
  Conditional,
  Comment
}

/*zdoc
Provides a `vscode.DocumentSymbol` tree for the outline
zdoc*/
export class CxDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private preprocessorStack: number[] = [];

  //zdoc Builds the tree. Invoked automatically by VS Code.
  public provideDocumentSymbols( document: vscode.TextDocument, token: vscode.CancellationToken ): vscode.DocumentSymbol[] {
    // prepare root (file) symbol
    const fileName: string = (document.fileName.match(/[^\\\/]*$/) || ["untitled"])[0];
    const fileRange: vscode.Range = new vscode.Range(0,0, 0,0).with(
      undefined, document.lineAt(document.lineCount-1).range.end
    )
    const fileSymbol: vscode.DocumentSymbol = new vscode.DocumentSymbol(
      fileName,
      "",
      vscode.SymbolKind.File,
      fileRange,
      new vscode.Range(0,0, 0,0)
    );
    // state
    let curSymbol: vscode.DocumentSymbol = fileSymbol;
    let parentSymbols: (vscode.DocumentSymbol|null)[] = [];
    let appendingSymbol: vscode.DocumentSymbol|null = null;
    let appendingKind: number = vscode.SymbolKind.Variable;
    let appendingCancellation: string|null = null;
    let charOffset: number = 0;
    // go through document
    for (let lineIdx = 0; lineIdx < document.lineCount; lineIdx++) {
      const line: vscode.TextLine = document.lineAt( lineIdx );
      // ignore empty lines
      if (line.isEmptyOrWhitespace) continue;
      // extract actual text
      charOffset = line.firstNonWhitespaceCharacterIndex;
      let text: string = line.text.slice( charOffset );
      // ignore comment lines
      if (text.startsWith("'")) continue;
      // preprocessor directives:
      // conditional block
      if (text.match(/^#if\b/i)) {
        this.enterPreprocessorBlock(PreprocessorBlock.Conditional);
      // comment block
      } else if (text.match(/^#rem\b/i)) {
        this.enterPreprocessorBlock(PreprocessorBlock.Comment);
      // end of block
      } else if (text.match(/^#end\b/i)) {
        this.exitPreprocessorBlock();
      }
      // ignore block comments
      if (this.isInCommentBlock()) continue;

      // single blocky declarations (1 keyword, 1 declaration)
      let matches = text.match(/^(class|interface|function|method)\s+(([a-zA-Z_][a-zA-Z0-9_]*)[^']*)/i);
      if (matches) {
        const detail = matches[2].slice(matches[3].length, undefined);
        // initialise with any valid value - will be overwritten
        let kind: number = vscode.SymbolKind.File;
        switch (matches[1].toLowerCase()) {
          case "class":
            kind = vscode.SymbolKind.Class;
            break;
          case "interface":
            kind = vscode.SymbolKind.Interface;
            break;
          case "function":
            kind = vscode.SymbolKind.Function;
            break;
          case "method":
            kind = vscode.SymbolKind.Method;
            // method named "new" is constructor
            if (matches[3].toLowerCase() == "new") {
              kind = vscode.SymbolKind.Constructor;
            }
            break;
        }
        const symbol = new vscode.DocumentSymbol(
          matches[3],
          detail,
          kind,
          line.range,
          line.range
        );
        // for classes: check for type parameters
        if (kind == vscode.SymbolKind.Class) {
          const detmatches = detail.match(/[^'<]*</);
          if (detmatches) {
            // append parameters as variables
            appendingSymbol = symbol;
            appendingKind = vscode.SymbolKind.TypeParameter;
            appendingCancellation = '>';
            // skip stuff before parameter list (type, opening bracket)
            charOffset += text.length - detail.length + detmatches[0].length;
            text = detail.slice(detmatches[0].length, undefined);
          }
        }
        // for functions and methods: check for parameters (done by appender)
        if (kind == vscode.SymbolKind.Method || kind == vscode.SymbolKind.Function) {
          const detmatches = detail.match(/[^'\(]*\(/);
          if (detmatches) {
            // append parameters as variables
            appendingSymbol = symbol;
            appendingKind = vscode.SymbolKind.Variable;
            appendingCancellation = ')';
            // skip stuff before parameter list (type, opening bracket)
            charOffset += text.length - detail.length + detmatches[0].length;
            text = detail.slice(detmatches[0].length, undefined);
          }
        }
        // append new symbol
        curSymbol.children.push(symbol);
        parentSymbols.unshift(curSymbol);
        curSymbol = symbol;
        // when nothing is expected from the appender, go to next line
        if (!appendingSymbol) {
          continue;
        }
      }
      // other blocks that can have an "end" declaration
      // (may not be ignored, otherwise other "end" declaration will break)
      if (text.match(/^(If(?![^'\n]*Then\s*[^'\n]+)|Select|While|Repeat|For\b)/i)) {
        // put irrelevant symbol on stack
        parentSymbols.unshift(null);
        continue;
      }
      // end of single blocky declarations
      if (text.match(/^(end\b|endif|wend|forever|until|next)/i)) {
        const parent = parentSymbols.shift();
        // only fall back to relevant symbols
        if (parent) {
          // extend range of this symbol
          curSymbol.range = curSymbol.range.with(undefined, line.range.end);
          curSymbol = parent;
        }
        continue;
      }

      // multi-decls, like:
      // enums
      matches = text.match(/^(Enumerate\s+)(([a-zA-Z_][a-zA-Z0-9_]*[\s=0-9]*,?\s*)+)/i);
      if (matches) {
        // cut of keyword and let appender do the work
        charOffset += matches[1].length;
        text = matches[2];
        // prepare enum symbol
        appendingSymbol = new vscode.DocumentSymbol(
          "N/A",
          "",
          vscode.SymbolKind.Enum,
          line.range,
          line.range
        );
        appendingKind = vscode.SymbolKind.EnumMember;
        curSymbol.children.push(appendingSymbol);
      }
      // consts, globals, locals, fields
      matches = text.match(/^((Const|Global|Local|Field)\s+)([a-zA-Z_][a-zA-Z0-9_]*.*)/i);
      if (matches) {
        switch (matches[2].toLowerCase()) {
          case "const":
            appendingKind = vscode.SymbolKind.Constant;
            break;
          case "global":
            appendingKind = vscode.SymbolKind.Variable;
            break;
          case "local":
            appendingKind = vscode.SymbolKind.Variable;
            // testcase, ignore local (behaviour should be configurable)
            continue;
            break;
          case "field":
            appendingKind = vscode.SymbolKind.Field;
            break;
        }
        // cut of keyword and let appender do the work
        charOffset += matches[1].length;
        text = matches[3];
        appendingSymbol = curSymbol;
      }

      // possibly appended decls ("appender")
      if (appendingSymbol) {
        // do in a loop, as commas can appear at many places other than just as
        // decl separator (e.g. in parameter lists, generic type arguments,
        // strings...), which makes splitting by "," impossible
        while (text) {
          if (appendingCancellation && text.trim().startsWith(appendingCancellation)) {
            appendingCancellation = null;
            appendingSymbol = null;
            break;
          }
          // extract first decl (identifier[type]=[value])
          // (value may actually contain following decls, will be stripped)
          matches = text.match(/\s*([a-zA-Z_]\w*)(\s*[\?%#\$]\s*|\s*:\s*[a-zA-Z_]\w*\s*|\s*:=\s*)?=?(.*)/);
          // can be null when comment occured
          if (matches) {
            const name = matches[1];
            const type = matches[2];
            let value = this.extractValue(matches[3]);
            // cut away cancellation token (set when parameter list detected)
            if (appendingCancellation && value.endsWith(appendingCancellation)) {
              value = value.slice(undefined, value.length - 1);
              appendingCancellation = null;
            }
            // pretty print type and value
            let detail = type || '';
            if (detail.indexOf(':=')>=1 && value) {
              detail += value;
            } else if (value) {
              detail += "=" + value;
            }
            // range of this single symbol
            const range: vscode.Range = new vscode.Range(
              line.lineNumber, charOffset,
              line.lineNumber, charOffset + text.length - matches[3].length + value.length
            );
            // append decl
            let symbol: vscode.DocumentSymbol = new vscode.DocumentSymbol(
              name,
              detail,
              appendingKind,
              range,
              range
            );
            appendingSymbol.children.push(symbol);
            // extract following decls
            charOffset += (text.length - matches[3].length + value.length);
            text = matches[3].slice(value.length, undefined);
            
            // comma follows? strip, more decls to come
            if (text.startsWith(',')) {
              charOffset += 1;
              text = text.slice(1, undefined);
            }
            // if no comma follows, decl is over
            else {
              // finalize appedingSymbol
              // for enums: name according to prefix and expand range of enum
              if (appendingSymbol.kind == vscode.SymbolKind.Enum) {
                // prefix = everything starting from the beginning that's common
                let commonName: string = appendingSymbol.children[0].name;
                for (let symbol of appendingSymbol.children) {
                  commonName = this.getCommonBeginning(commonName, symbol.name);
                }
                if (commonName) {
                  commonName += "*"
                } else {
                  commonName = "(no common prefix)"
                }
                appendingSymbol.name = commonName;
                // expand range
                appendingSymbol.range = appendingSymbol.range.with(undefined, line.range.end)
              }
              appendingSymbol = null;
              break;
            }
          } else {
            break;
          }
        }
      }
    }

    return [fileSymbol];
  }

  // preprocessor-stack helpers
  private enterPreprocessorBlock(kind: number) {
    this.preprocessorStack.unshift(kind);
  }
  private exitPreprocessorBlock(): number|undefined {
    return this.preprocessorStack.shift();
  }
  private currentPreprocessorBlock(): number|undefined {
    return this.preprocessorStack[0];
  }
  // whether or not currently in comment block, respects nested directives
  private isInCommentBlock(): boolean {
    for (let block of this.preprocessorStack) {
      if (block == PreprocessorBlock.Comment) return true;
    }
    return false;
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

  // extract value (or expression, that evaluates to value) or parts of
  private extractValue(text: string): string {
    // console.log('extracting value from '+text);
    
    let stack: string[] = [];
    // angle brackets < > are only relevant in type statements (e.g. in New)
    let isAngleBracketRelevant: boolean = text.match(/^\s*new\s/i) ? true : false;
    let i: number;
    for (i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      // in string or char literal, only look for delimiters
      if (stack[0] == '"' && char == '"' || stack[0] == '`' && char == '`') {
        stack.shift();
      } else {
        // go up at closing brackets
        if (stack[0] == '(' && char == ')' || stack[0] == '[' && char == ']' ||
        isAngleBracketRelevant && char == '>') {
          stack.shift();
          // angle brackets stop being relevant, once type statement is over
          if (!stack[0]) isAngleBracketRelevant = false;
        }
        // go deeper at opening brackets
        else if (char == '(' || char == '[' ||
        isAngleBracketRelevant && char == '<') {
          stack.unshift(char);
        }
        // enter string
        else if (char == '"' || char == '`') {
          stack.unshift(char);
        }
      }
      // outside stack, comma ends value
      if (!stack[0] && char == ',') break;
    }
    
    return text.slice(undefined, i);
  }
}