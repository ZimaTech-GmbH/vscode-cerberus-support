import * as vscode from 'vscode';
import { CxLangTokenizer, CxLangTokenType } from '../features/cxlang/cxlang-tokenizer.feature';

const keywordDelimiters = [' ', '\t', '(', ')', '<', '>', '[', ']', ',', ';', '-', '+', '*', '/', "'"];
// TODO: move to something global
const keywords = ['Abstract','And','Array','Bool','Case','Catch','Class','Const','Continue','Default','Eachin','Else','ElseIf','End','EndIf','Enumerate','Exit','Extends','Extern','False','Field','Final','Float','For','Forever','Function','Global','If','Implements','Import','Include','Inline','Int','Interface','Local','Method','Mod','Module','New','Next','Not','Object','Or','Private','Property','Public','Repeat','Return','Select','Self','Shl','Shr','Step','Strict','String','Super','Then','Throw','To','True','Try','Until','Void','Wend','While']

/**
 * Provides a `vscode.OnTypeFormattingEditProvider` for real-time formatting
 */
export class CxOnTypeFormattingEditProvider implements vscode.OnTypeFormattingEditProvider {
  /**
   * Initializes provider
   * @param context `vscode.ExtensionContext`
   */
  public static init(context: vscode.ExtensionContext) {
    // check formatOnType
    if (!vscode.workspace.getConfiguration('editor').get('formatOnType')) {
      // if off, ask to turn on
      const item = 'Yes';
      vscode.window.showInformationMessage('Would you like to turn on formatOnType for auto-capitalization of keywords?', item).then((resp) => {
        if (resp == item) {
          vscode.workspace.getConfiguration('editor').update('formatOnType', true, vscode.ConfigurationTarget.Workspace);
        }
      });
    }
    // register
    context.subscriptions.push(
      vscode.languages.registerOnTypeFormattingEditProvider(
        { scheme: 'file', language: 'cerberus-x' },
        new CxOnTypeFormattingEditProvider(),
        " ",
        "\t", "\r", "\n", "(", ")", "[", "]", "<", ">", "=", "+", "-", "*", "/", "~", "|", "&"
      )
    );
  }

  /**
   * Provides on type formatting edits. Invoked automatically by VS Code
   * @param document current `vscode.TextDocument`
   * @param position `vscode.Position` after triggering
   * @param char triggering char as `string`
   * @param options `vscode.FormattingOptions`
   * @param token `vscode.CancellationToken`
   * @returns `vscode.TextEdit`s to apply
   */
  public provideOnTypeFormattingEdits(document: vscode.TextDocument, position: vscode.Position, char: string, options: vscode.FormattingOptions, ctoken: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
    const newline = (char == '\r' || char == '\n');
    // text to examine - when newline, complete previous line
    let lpos = position.line;
    let cpos = position.character - 1;
    if (newline) {
      lpos--;
      const text = document.lineAt(lpos).text;
      cpos = text.length - 1;
    } else {
      cpos = position.character - 2;
    }
    // go through line, find last typed token
    const tokenized = CxLangTokenizer.tokenize(document);
    const line = tokenized.lines[lpos];
    const token = line.tokens.find((token) => {
      return cpos >= token.range.start.character && cpos < token.range.end.character;
    });
    if (token?.type == CxLangTokenType.Keyword) {
      // capitalize
      let text = token.text;
      text = text.charAt(0).toUpperCase() + text.substring(1);
      // and replace
      const edit = new vscode.TextEdit(token.range, text);
      return [edit];
    }
    return null;
  }
}