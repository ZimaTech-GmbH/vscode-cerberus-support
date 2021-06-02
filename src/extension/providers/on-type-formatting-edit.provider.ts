import * as vscode from 'vscode';

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
        "\t", "\r", "\n"
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
  public provideOnTypeFormattingEdits(document: vscode.TextDocument, position: vscode.Position, char: string, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
    const newline = (char == '\r' || char == '\n');
    // text to examine - when newline, complete previous line
    let lpos = position.line;
    let cpos1 = position.character - 1;
    let text: string;
    if (newline) {
      lpos--;
      text = document.lineAt(lpos).text;
      cpos1 = text.length - 1;
    } else {
      cpos1 = position.character - 1;
      text = document.lineAt(lpos).text.substr(0, cpos1);
    }
    // go through line, extract last typed word
    let cpos0 = -1;
    let instr: boolean = false;
    for (let index = 0; index < text.length; index++) {
      const ch = text.charAt(index);
      // track string delimiters (won't work with multiline strings)
      if (ch == '"') {
        instr = !instr;
        continue;
      }
      if (keywordDelimiters.includes(ch)) {
        cpos0 = index;
      }
    }
    // extract last word
    if (!instr) {
      cpos0++;
      let word = text.substring(cpos0);
      // is keyword?
      if (keywords.find((val) => {
        return val.toLowerCase() == word;
      })) {
        //... then capitalize
        word = word.charAt(0).toUpperCase() + word.substring(1);
        // and replace
        const range = new vscode.Range(
          new vscode.Position(lpos, cpos0),
          new vscode.Position(lpos, cpos1)
        );
        const edit = new vscode.TextEdit(range, word);
        return [edit];
      }
    }
    return null;
  }
}