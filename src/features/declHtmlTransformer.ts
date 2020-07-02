//zdoc ### src/features/declHtmlTransformer.ts ###

import * as vscode from 'vscode';

import { CxConfiguration } from './configuration';
import { DocDecl } from './DocDecl';

/*zdoc
Transformer for DocDecl -> HTML
zdoc*/
export class CxDeclHtmlTransformer {
  public static webview: vscode.Webview;

  //zdoc Set valid Webview for URI resolving
  public static setWebview(webview: vscode.Webview) {
    this.webview = webview;
  }

  //zdoc Transform given DocDecl to string of HTML (full page)
  public static transform(decl: DocDecl): string {
    // no decl? no contents!
    if (!decl) {
      decl = new DocDecl({
        "ident": "404 - Page not Found",
        "uid": "xxxxxx",
        "kind": "404"
      });
    }
  
    let html: string;

    html = `
<!DOCTYPE html>
<html lang="en">
${this.getHead(decl)}
${this.getBody(decl)}
</html>`;
    
    return html;
  }

  // return html containing scripts and styles
  private static getHead(decl: DocDecl): string {
    let html = `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="docs/html">
  <title>${decl.getName()}</title>
  <script>
${this.getScript()}
  </script>
  <style>
${this.getStyle()}
  </style>
</head>`;
    return html;
  }

  // return javascript for page
  private static getScript() {
    let html = `
const vscode = acquireVsCodeApi();
function navigateById(uid) {
  vscode.postMessage({command: 'navigateById', text: uid});
}
function navigate(ident) {
  vscode.postMessage({command: 'navigate', text: ident});
}
function navigateToHash(ident) {
  window.location.hash = ident;
}
function navInput(elem, event) {
  if (event.keyCode == 13) {
    navigate(elem.value);
  }
}
function searchInput(elem, event) {
  const query = elem.value;
  if (event.keyCode == 13) {
    vscode.postMessage({command: 'search', text: query});
  } else {
    const sbar = document.getElementById('searchbar');
    if (query != '') {
      sbar.className = '';
    } else {
      sbar.className = 'inactive';
    }
  }
}`;
    return html;
  }

  // return css for page
  private static getStyle() {
    let html = `
body {
  padding: 0;
}
main {
  padding: 0.5em 1.5em;
}

div.pretty {
  background: var(--vscode-textCodeBlock-background);
  tab-size: 4;
}
div.pretty code {
  white-space: pre-wrap;
}
div.pretty code.d {
  color: var(--vscode-symbolIcon-textForeground);
}
div.pretty code.k {
  color: var(--vscode-symbolIcon-functionForeground);
}
div.pretty code.i {
  color: var(--vscode-symbolIcon-variableForeground);
}
div.pretty code.l {
  color: var(--vscode-symbolIcon-constantForeground);
}
div.pretty code.r {
}

table {
	border-collapse: collapse;
	border-spacing: 0;
}
table tr:nth-child(even) td:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--vscode-editor-foreground);
  opacity: 0.05;
}
table th, table td {
  position: relative;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vscode-textSeparator-foreground);
	text-align: left;
	vertical-align: top;
}
table th {
	vertical-align: bottom;
}

.multicolumn{
	column-width: 15em;
	column-gap: 4em;
  column-rule: 1px solid var(--vscode-textSeparator-foreground);
}
[onClick] {
  cursor: pointer;
}
a[name] {
  position: relative;
  top: -3em;
}
#browser {
  display: grid;
  grid-template-columns: 8em 2em 2em 1fr 13em;
  grid-gap: 1em;
  position: fixed;
  box-sizing: border-box;
  top: 0;
  padding: 0.5em 1.5em;
  width: 100%;
  background: var(--vscode-titleBar-activeBackground);
}
#browser svg {
  position: absolute;
  margin-top: 0.2em;
  height: 1.6em;
}
#browser svg>path {
  fill: var(--vscode-titleBar-activeForeground)
}
#browser .inactive svg>path {
  fill-opacity: 0.2;
}
#browser #logo>svg {
  margin-top: -0.2em;
  margin-bottom: -0.2em;
  height: 2.4em;
}
#browser #navback,
#browser #navfwd {
  cursor: pointer;
}
#browser #addressbar,
#browser #searchbar {
  position: relative;
  height: 2em;
  background: var(--vscode-settings-textInputBackground);
  border-radius: 2em;
}
#browser #addressbar>input,
#browser #searchbar>input {
  box-sizing: border-box;
  padding: 0 1em;
  width: 100%;
  height: 2em;
  background: none;
  border: none;
  color: var(--vscode-settings-textInputForeground);
}
#browser #searchbar>input {
  padding-right: 3em;
}
#browser #searchbar>svg {
  position: absolute;
  right: 0.5em;
  top: 0;
}
#menu {
  display: flex;
  margin-top: 3em;
  padding: 0 1.5em;
  background: var(--vscode-tab-inactiveBackground);
}
#menu>div {
  display: inline-block;
  margin-right: -1px;
  padding: 0.5em 1em;
  border: 1px solid var(--vscode-tab-border);
  border-top: none;
  border-bottom: none;
  background: var(--vscode-tab-inactiveBackground);
  color: var(--vscode-tab-inactiveForeground);
  text-transform: uppercase;
}
#menu>div.active {
  background: var(--vscode-tab-activeBackground);
  color: var(--vscode-tab-activeForeground);
}`;
    return html;
  }

  // return body for page
  private static getBody(decl: DocDecl): string {
    let html = `
<body>
${this.getHeader(decl)}
${this.getMain(decl)}
</body>`;
    return html;
  }

  // get header for page
  private static getHeader(decl: DocDecl): string {
    let html = `
<header>
${this.getBrowser(decl)}
${this.getNavi(decl)}
</header>`;

//   // build navigation path
//   let path2: any[] = [decl];
//   let c = decl;
//   while (c.parent) {
//     path2.unshift(c.parent);
//     c = c.parent;
//   }
//   for (const c of path2) {
//     html += `
// &raquo;&nbsp;<span onClick="navigateById('${c.uid}')" style="cursor: pointer;color:var(${c.color});">${c.getName()}</span>&nbsp;
// `;
//   }
    
//   html += `
//   </header>
//     `;
    return html;
  }

  // get "browser" navigator
  private static getBrowser(decl: DocDecl): string {
    let html = `
<nav id="browser">
  <div id="logo">
    <svg version="1.1" viewBox="0 0 28.6 13.2" xmlns="http://www.w3.org/2000/svg">
      <path d="m3.55 0.825 0.609 2.44-2.13 2.44 0.305 0.609-2.13 3.96 1.22 0.914 1.52-0.305 2.44-2.74h1.22l1.52 1.52 1.83 2.74 2.44-0.914-0.609-2.74-1.52-2.13 0.305-1.52-3.66-1.52-1.22-1.52zm0.609 0.914 1.22 0.609 0.914 1.22-1.52-0.305zm-0.609 3.35-0.305 1.22-0.609-0.609zm-2.13 3.96 0.305 0.914h-0.914zm23.5-8.23-2.13 1.22-1.22 1.52-3.66 1.52 0.305 1.52-1.52 2.13-0.609 2.74 2.44 0.914 1.83-2.74 1.52-1.52h1.22l2.44 2.74 1.52 0.305 1.22-0.914-2.13-3.96 0.305-0.609-2.13-2.44zm-0.609 0.914-0.609 1.52-1.52 0.305 0.914-1.22zm0.609 3.35 0.914 0.609-0.609 0.609zm2.13 3.96 0.609 0.914h-0.914zm-15.8-8.23-0.305 2.74 0.609 0.914-0.609 1.83 1.52 2.13 0.609 2.44 1.22 0.305 1.22-0.305 0.609-2.44 1.52-2.13-0.609-1.83 0.609-0.914-0.305-2.74-1.83 2.74h-2.44zm0.305 1.22 0.914 1.52-0.609 0.609-0.609-0.914zm5.48 0 0.305 1.22-0.609 0.914-0.609-0.609zm-5.18 3.05 2.13 0.609-0.914 0.914zm4.88 0-1.22 1.52-0.914-0.914zm-3.35 3.96h1.83l-0.914 0.914z" />
    </svg>
  </div>
  <div id="navback">
    <svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="m15 1.98a2 2 0 0 0-1.38 0.605l-8 8a2 2 0 0 0 0 2.83l8 8a2 2 0 1 0 2.83-2.83l-6.59-6.59 6.59-6.59a2 2 0 0 0-1.45-3.43z" />
    </svg>
  </div>
  <div id="navfwd" class="inactive">
    <svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="m8.98 1.98a2 2 0 0 0-1.39 3.43l6.59 6.59-6.59 6.59a2 2 0 1 0 2.83 2.83l8-8a2 2 0 0 0 0-2.83l-8-8a2 2 0 0 0-1.44-0.605z" />
    </svg>
  </div>
  <div id="addressbar">
    <input type="text" value="${decl.getDocPath()}" onKeyUp="navInput(this,event)"/>
  </div>
  <div id="searchbar" class="inactive">
    <input type="text" placeholder="search..." onKeyUp="searchInput(this,event)"/>
    <svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="m10 2c-4.39 0-8 3.61-8 8 0 4.39 3.61 8 8 8 1.48 0 2.86-0.414 4.05-1.12l4.54 4.54a2 2 0 1 0 2.83-2.83l-4.54-4.54c0.707-1.19 1.12-2.57 1.12-4.05 0-4.39-3.61-8-8-8zm0 4c2.23 0 4 1.77 4 4 0 2.23-1.77 4-4 4-2.23 0-4-1.77-4-4 0-2.23 1.77-4 4-4z" />
    </svg>
  </div>
</nav>`;
    return html;
  }

  // get navigator for page
  private static getNavi(decl: DocDecl): string {
    let html = `
<nav id="menu">
  <div onClick="navigate('Home')">Home</div>
  <div onClick="navigate('Modules')">Modules</div>
  <div onClick="navigate('Indexes')">Indexes</div>
  <div>Home</div>
</nav>
<div id="currentlocation">
  Home
</div>`;
    return html;
  }

  // get main (content) for page
  private static getMain(decl: DocDecl): string {
    // title to display in h1
    let title: string = decl.getName();
    if (decl.prefix) {
      title = `<span style="color:var(${decl.color});">${decl.prefix}</span> ${title}`;
    }

    // chapters to list on this page
    let chapters: DocDecl[] = [];
    // description / contents on this page
    let contents: DocDecl[] = []
    if (decl.childs) {
      for (const c of decl.childs) {
        switch (c.kind) {
          case 'root_modules':
          case 'root_docs':
          case 'module':
          case 'class':
          case 'function':
          case 'method':
          case 'doc':
          case 'index_entry':
            chapters.push(c);
            break;
          case 'description':
          case 'contents':
            contents.push(c);
        }
      }
    }

    // transform contents
    let tcontents: string = '';
    if (contents.length > 0) {
      for (const c of contents) {
        let text = c.ident;

        // replace makedocs links <a href="uid:UID">
        text = text.replace(/<a\s([^>]*?)href="uid:([0-9]*)"(.*?)>/g, '<a $1onClick="navigateById(\'$2\')"$3>');
        // replace makedocs anchor links <a href="#HASH">
        text = text.replace(/<a\s([^>]*?)href="(#[^"]*)"(.*?)>/g, '<a $1onClick="navigateToHash(\'$2\')"$3>');
        // fix image srcs <img src="SRC"/>
        text = text.replace(/<img\s([^>]*?)src="([^"]*)"(.*?)>/g, (match, p1, p2, p3) => {
          const src = this.webview.asWebviewUri(vscode.Uri.file(CxConfiguration.get('path') + '/docs/html/' + p2));
          return `<img ${p1}src="${src}"${p3}/>`;
        })
        tcontents += text;
      }
    }

    let html = `
<main>
${tcontents}`;

    // list contents of this page
    if (chapters.length > 0) {
      html += `
<h2>Contents</h2>
<table>
  <thead>
    <tr>
      <th>Title</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>`;
      for (const c of chapters) {
        const target = c.target || c.uid;
        const tdecl = DocDecl.getByUid(target);
        const name = c.getName();
        const summary = tdecl ? tdecl.getTextOfChild('summary') : '';
        html += `
    <tr>
      <td onClick="navigateById('${target}')">${name}</td>
      <td>${summary}</td>
    </tr>`;
      }
      html += `
  </tbody>
</table>`;
    }
    html += `
</main>`;
    return html;
  }
}
