import * as vscode from 'vscode';
import { TextDecoder } from 'util';

import { CxConfiguration } from '../configuration/configuration.feature';
import { DocDecl } from './docdecl';
import { DocDeclHtmlTransformer } from './docdecl-html-transformer';
import { CxChildProcess } from '../child-process/child-process.feature';

/**
 * Cerberus X in-editor documentation
 */
export class CxDocumentation {
  /** Root DocDecl */
  public static rootDecl: DocDecl;
  /** currently (navigated to) DocDecl */
  private static currentDecl: DocDecl;
  /** webview (instance needed for navigating and stuff) */
  private static webview: vscode.Webview;

  /**
   * Invokes makedocs to build the docs
   * @returns Promise resolving when done
   */
  public static build(): Promise<void> {
    return new Promise((resolve, reject) => {
      const makedocsPath = CxConfiguration.makedocsPath;
      if (makedocsPath) {
        const title = 'Building documentation';
        const paths = {'makedocs': makedocsPath};
        return CxChildProcess.spawn(title, paths, makedocsPath);
      }
    });
  }

  /**
   * Registers the feature and prepares components
   */
  public static show(args: any = undefined): void {
    // create web panel
    let panel = vscode.window.createWebviewPanel(
      'cerberus-x.documentation',
      'Cerberus X Documentation',
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true
      },
      {
        retainContextWhenHidden: true,
        enableScripts: true,
        enableCommandUris: true,
        enableFindWidget: true,
        localResourceRoots: [vscode.Uri.file( CxConfiguration.get('path') )]
      }
    )
    // populate web view
    this.webview = panel.webview;

    // start decl given?
    if (args?.autolocate == 'curpos') {
      const editor = vscode.window.activeTextEditor;
      if (editor?.selection.isEmpty) {
        // the Position object gives you the line and character where the cursor is
        const position = editor.selection.active;
        const range = editor.document.getWordRangeAtPosition(position);
        const word = editor.document.getText(range);
        console.log(word);
        // TODO: find by ident
      }
    }

    // initialize transformer and get html for current decl
    DocDeclHtmlTransformer.setWebview(this.webview);
    this.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);

    // simple navigation
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          // navigate to given site
          case 'navigateById':
            this.currentDecl = DocDecl.getByUid(message.text) || this.rootDecl;
            vscode.window.showInformationMessage('by id '+message.text);
            panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            break;
          // navigate to ident
          case 'navigate':
            this.currentDecl = this.currentDecl.find(message.text) || this.rootDecl;
            vscode.window.showInformationMessage('by ident '+message.text);
            panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            break;
          // search
          case 'search':

          default:
            vscode.window.showInformationMessage('Unknown message type from webview recieved.')
            break;
        }
      }
    );
  }

  /**
   * Loads declarations from `docs/html/decls.json`
   */
  public static loadDecls() {
    // path to decls.json
    const uri = vscode.Uri.file(CxConfiguration.get('path') + '/docs/html/decls.json');
    vscode.workspace.fs.readFile(uri).then(
      (contents) => {
        // decode contents as string and parse as json
        let loadedDecls: any = JSON.parse(new TextDecoder().decode(contents));
        if (loadedDecls.kind == 'root') {
          // create DocDecl objects, set parent decls, map uid => DocDecl
          // for quick access and store in global field
          this.rootDecl = this.prepareDeclForUse(loadedDecls);
          // start navigating at Home
          this.currentDecl = this.rootDecl.find('Home') || this.rootDecl;
          const actShowHelp = 'Show Help';
          vscode.window.showInformationMessage('Cerberus X decls loaded', actShowHelp).then(
            (action) => {
              if (action == actShowHelp) {
                this.show();
              }
            }
          );
        }
      },
      (err) => {
        const rebuildHelp = 'Rebuild Help';
        vscode.window.showErrorMessage(err.message, rebuildHelp).then((selected) => {
          if (selected == rebuildHelp) {
            this.build().then(() => {this.loadDecls()});
          }
        });
      }
    );
  }

  // set parent decls of childs, recursively
  private static prepareDeclForUse(obj: any): DocDecl {
    // create DocDecl object
    const decl: DocDecl = new DocDecl(obj);
    // go through child decls and repeat
    if (obj.childs) {
      decl.childs = [];
      for (const c of obj.childs) {
        const child: DocDecl = this.prepareDeclForUse(c);
        decl.childs.push(child);
        child.parent = decl;
      }
    }
    return decl;
  }
}