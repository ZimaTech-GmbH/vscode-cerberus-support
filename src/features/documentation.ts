//zdoc ### src/features/documentation.ts ###

import * as vscode from 'vscode';
import { TextDecoder } from 'util';

import { CxConfiguration } from './configuration';

// dictionary to replace any default value based on decl.kind
// const kindDictionary = require('./documentationKindDictionary.json');
import * as kdict from './documentationKindDictionary.json';
// Cast to any because I know what I'm doing.
const kindDictionary = kdict as any;

export interface DocDecl {
  ident: string;
  kind: string;
  uid: string;
  target?: string;
  childs?: DocDecl[];
  parent?: DocDecl;
  // set by applying kind dictionary:
  name?: string;
  prefix?: string;
  color?: string;
}

/*zdoc
Global Cerberus X documentation declarations
zdoc*/
export class CxDocumentation {
  //zdoc Root DocDecl
  public static rootDecl: DocDecl;
  // currently (navigated to) DocDecl
  private static currentDecl: DocDecl;
  // all decls ordered by uid (maps uid => DocDecl)
  private static declsByUid: any = {};
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
    this.webview.html = this.getWebviewContent(this.rootDecl);

    // simple navigation
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          // navigate to given site
          case 'navigate':
            this.currentDecl = this.declsByUid[message.text];
            panel.webview.html = this.getWebviewContent(this.currentDecl);
            break;
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
        let loadedDecls: DocDecl = JSON.parse(new TextDecoder().decode(contents));
        if (loadedDecls.kind == 'root') {
          // set global decls to currently loaded one
          this.rootDecl = loadedDecls;
          // set parent decls and map uid => DocDecl for quick access
          this.prepareDeclForUse(this.rootDecl);
          // start navigating at root
          this.currentDecl = this.rootDecl;
          vscode.window.showInformationMessage('Cerberus X decls loaded');
        }
      },
      (err) => {
        vscode.window.showErrorMessage(err.message, 'Rebuild Help');
      }
    );
  }

  // set parent decls of childs, recursively
  private static prepareDeclForUse(decl: DocDecl): void {
    // put to uid => DocDecl map
    this.declsByUid[decl.uid] = decl;
    // apply kindDictionary
    // I know what I'm doing, that's why I can cast to any here
    const specs = (kindDictionary as any)[decl.kind] || {};
    // apply dictionary, fall back to defaults where necessary
    decl.prefix = specs.prefix;
    decl.name = specs.name;
    decl.color = specs.color || '--vscode-symbolIcon-textForeground';
    // go through child decls and repeat
    if (!decl.childs) return;
    for (const c of decl.childs) {
      c.parent = decl;
      this.prepareDeclForUse(c);
    }
  }

  // get html for requested decl
  private static getWebviewContent(decl: DocDecl): string {
    // no decl? no contents!
    if (!decl) return '404 - Page not found';

    let html: string;
  
    let title: string = decl.kind + ': ' + decl.ident;
    let uid: string = decl.uid;
  
    html = 
  `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="docs/html">
    <title>${this.getIdentifier(decl)}</title>
    <script>
      const vscode = acquireVsCodeApi();
      function navigate(ident) {
        vscode.postMessage({command: 'navigate', text: ident});
      }
    </script>
  </head>
  <body>
    <header>
      You are here 
  `;
    // build navigation path
    let path: any[] = [decl];
    let c = decl;
    while (c.parent) {
      path.unshift(c.parent);
      c = c.parent;
    }
    for (const c of path) {
      html +=
  `		&raquo;&nbsp;<span onClick="navigate('${c.uid}')" style="cursor: pointer;color:var(${c.color});">${this.getName(c)}</span>&nbsp;
  `;
    }
      
    html +=
  `	</header>
    <h1>${this.getIdentifier(decl, true)}</h1>
    <small>${uid}</small>
    <h2>Contents</h2>
    <ul>
  `;
    
    if (decl.childs) {
      for (let c of decl.childs) {
        let target = c.target || c.uid;
        let content: string = c.ident;
        content = content.replace(/!\[([^\]]*)\]\(([^\)]*)\)/g, (match, p1, p2) => {
          const src = this.webview.asWebviewUri(vscode.Uri.file(CxConfiguration.get('path') + '/docs/html/' + p2));
          return `<img alt="${p1}" src="${src}" />`;
        })
        html +=
  `		<li onClick="navigate('${target}')">${c.uid}, ${c.kind}: ${content}</li>
  `;
      }
    
    }
    
    html +=
  `	</ul>
    </body>
  </html>`;
  
    return html;
  }

  // return decl name (or identifier, if name is not set)
  public static getName(decl: DocDecl): string {
    return decl.name || decl.ident;
  }

  // return decl identifier, if themed is set to true, it will be put
  // in one or more <span> with matching css classes
  private static getIdentifier(decl: DocDecl, themed: boolean = false): string {
    let text: string;
    let ident: string = this.getName(decl);
    // apply span
    if (themed) {
      text = `<span style="color:var(${decl.color});">${ident}</span>`;
    } else {
      text = ident;
    }
    if (decl.prefix) {
      text = decl.prefix + ' ' + text;
    }
    return text;
  }

  // kindDictionary 

}