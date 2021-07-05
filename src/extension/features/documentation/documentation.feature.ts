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
  /** history of navigated DocDecl */
  private static history: DocDecl[] = [];
  /** when going back, this is the stack of "forward" DocDecl */
  private static historyRev: DocDecl[] = [];
  /** panel */
  private static panel: vscode.WebviewPanel;
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
  public static init(): void {
    // create web panel
    this.panel = vscode.window.createWebviewPanel(
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
    this.panel.onDidDispose(() => {
      this.panel = null as unknown as vscode.WebviewPanel;
    });

    // populate web view
    this.webview = this.panel.webview;

    // initialize transformer and get html for current decl
    DocDeclHtmlTransformer.setWebview(this.webview);
    this.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);

    // simple navigation
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          // navigate to given site
          case 'navigateById':
            this.history.unshift(this.currentDecl);
            this.historyRev = [];
            this.currentDecl = DocDecl.getByUid(message.text) || this.rootDecl;
            vscode.window.showInformationMessage('by id '+message.text);
            this.panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            break;
          // navigate to ident
          case 'navigate':
            this.history.unshift(this.currentDecl);
            this.historyRev = [];
            const navResults = DocDecl.getByIdent(message.text);
            this.currentDecl = navResults ? navResults[0] : this.rootDecl;
            vscode.window.showInformationMessage('by ident '+message.text);
            this.panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            break;
          // navigate back
          case 'navBwd':
            const rev = this.history.shift();
            if (rev) {
              this.historyRev.unshift(this.currentDecl);
              this.currentDecl = rev;
              this.panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            }
            break;
          // navigate forward
          case 'navFwd':
            const rrev = this.historyRev.shift();
            if (rrev) {
              this.history.unshift(this.currentDecl);
              this.currentDecl = rrev;
              this.panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            }
            break;
          // search
          case 'search':
            this.history.unshift(this.currentDecl);
            this.historyRev = [];
            const results = DocDecl.getByIdent(message.text);
            this.currentDecl = results ? results[0] : this.rootDecl;
            vscode.window.showInformationMessage('searched '+message.text);
            this.panel.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
            break;
          default:
            vscode.window.showInformationMessage('Unknown message type from webview recieved.')
            break;
        }
      }
    );
  }

  public static show(args: any = undefined): void {
    if (!this.panel) {
      this.init();
    }
    // start decl given?
    if (args?.autolocate == 'curpos') {
      const editor = vscode.window.activeTextEditor;
      if (editor?.selection.isEmpty) {
        this.history.unshift(this.currentDecl);
        // the Position object gives you the line and character where the cursor is
        const position = editor.selection.active;
        const range = editor.document.getWordRangeAtPosition(position);
        const word = editor.document.getText(range);
        // console.log(word);
        // TODO: find by ident
        const results = DocDecl.getByIdent(word);
        this.currentDecl = results ? results[0] : this.rootDecl;
        vscode.window.showInformationMessage('searched '+word);
        this.webview.html = DocDeclHtmlTransformer.transform(this.currentDecl);
      }
    }
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
          const results = DocDecl.getByIdent('Home');
          this.currentDecl = results ? results[0] : this.rootDecl;
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

  /**
   * Whether navigating back is possible
   */
  public static canNavBack(): boolean {
    return this.history.length > 0;
  }

  /**
   * Whether navigating forward is possible
   */
   public static canNavFwd(): boolean {
    return this.historyRev.length > 0;
  }
}