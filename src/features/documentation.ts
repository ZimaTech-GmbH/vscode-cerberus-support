//zdoc ### src/features/documentation.ts ###

import * as vscode from 'vscode';
import { TextDecoder } from 'util';

import { DocDecl } from './DocDecl';
import { CxConfiguration } from './configuration';
import { CxDeclHtmlTransformer } from './declHtmlTransformer';

/*zdoc
Global Cerberus X documentation
zdoc*/
export class CxDocumentation {
  //zdoc Root DocDecl
  public static rootDecl: DocDecl;
  // currently (navigated to) DocDecl
  private static currentDecl: DocDecl;
  // webview (instance needed for navigating and stuff)
  private static webview: vscode.Webview;

  //zdoc Register feature and prepare components
  public static show(): void {
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
    // initialize transformer and get html for current decl
    CxDeclHtmlTransformer.setWebview(this.webview);
    this.webview.html = CxDeclHtmlTransformer.transform(this.currentDecl);

    // simple navigation
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          // navigate to given site
          case 'navigateById':
            this.currentDecl = DocDecl.getByUid(message.text) || this.rootDecl;
            vscode.window.showInformationMessage('by id'+message.text);
            panel.webview.html = CxDeclHtmlTransformer.transform(this.currentDecl);
            break;
          // navigate to ident
          case 'navigate':
            this.currentDecl = this.currentDecl.find(message.text) || this.rootDecl;
            vscode.window.showInformationMessage('by ident'+message.text);
            panel.webview.html = CxDeclHtmlTransformer.transform(this.currentDecl);
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

  //zdoc Load declarations from docs/html/decls.json
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
        vscode.window.showErrorMessage(err.message, 'Rebuild Help');
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