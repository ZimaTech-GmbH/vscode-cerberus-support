//zdoc ### src/features/declHtmlTransformer.ts ###

import * as vscode from 'vscode';

import { CxConfiguration } from '../configuration/configuration.feature';
import { DocDecl } from './DocDecl';

import templateCss from '../../../assets/html-templates/html-css';
import templateJs from '../../../assets/html-templates/html-js';
import iconCerberus from '../../../assets/html-templates/svg-cerberus';
import iconNavBack from '../../../assets/html-templates/svg-nav-back';
import iconNavFwd from '../../../assets/html-templates/svg-nav-fwd';
import iconNavSearch from '../../../assets/html-templates/svg-nav-search';

/*zdoc
Transformer for DocDecl -> HTML
zdoc*/
export class DocDeclHtmlTransformer {
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
  <title>${decl.name}</title>
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
    return templateJs;
  }

  // return css for page
  private static getStyle() {
    return templateCss;
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
    ${iconCerberus}
  </div>
  <div id="navback">
    ${iconNavBack}
  </div>
  <div id="navfwd" class="inactive">
  ${iconNavFwd}
  </div>
  <div id="addressbar">
    <input type="text" value="${decl.getDocPath()}" onKeyUp="navInput(this,event)"/>
    <div class="location">${this.getLocation(decl)}</div>
  </div>
  <div id="searchbar" class="inactive">
    <input type="text" placeholder="search..." onKeyUp="searchInput(this,event)"/>
    ${iconNavSearch}
  </div>
</nav>`;
    return html;
  }

  // get location for page as html (clickable links)
  private static getLocation(decl: DocDecl): string {
    let path: string = '';
    let pdecl: DocDecl|undefined = decl;
    let glue: string = '.';
    if (pdecl.kind == 'root_docs' || pdecl.kind == 'doc' || pdecl.kind == 'root_modules' || pdecl.kind == 'index') glue = '/';
    do {
      if (path != '') {
        path = glue + path;
      }
      let ident = pdecl.ident;
      // for modules: drop the leading module scope
      if (pdecl.kind == 'module') {
        ident = ident.replace(/^.*\./, '');
      }
      // for functions and such: append uid_params
      if (pdecl.kind == 'function' || pdecl.kind == 'method' || pdecl.kind == 'classfunction') {
        ident += pdecl.getTextOfChild('uident_params');
      }
      path = `<a onClick="navigateById('${pdecl.uid}')">${ident}</a>` + path;
      pdecl = pdecl.parent;
    } while (
      pdecl &&
      pdecl.kind != 'root_modules' &&
      pdecl.kind != 'root_docs' &&
      pdecl.kind != 'root'
    );
    return glue + path;
  }

  // get navigator for page
  private static getNavi(decl: DocDecl): string {
    let html = `
<nav id="menu">
  <div onClick="navigate('Home')">Home</div>
  <div onClick="navigate('Modules')">Modules</div>
  <div onClick="navigate('Indexes')">Indexes</div>
</nav>`;
    return html;
  }

  // get main (content) for page
  private static getMain(decl: DocDecl): string {
    // title to display on top
    let title: string = decl.name;
    // if (decl.prefix) {
    //   title = `<span style="color:var(${decl.color});">&square;</span>${decl.prefix} ${title}`;
    // }
    title = `
<div class="title" style="--color: var(${decl.color});">
  <div class="subtitle">
    <div class="property-icon">${decl.icon}</div>${decl.prefix} in ${decl.getUident()}
  </div>
  <h1>${decl.name} <span>: ${decl.getTextOfChild('type')} ${decl.getTextOfChild('uident_params')}</span></h1>
</div>`;

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
          case 'interface':
          case 'function':
          case 'const':
          case 'global':
          case 'enum':
          case 'method':
          case 'property':
          case 'ctor':
          case 'classfunction':
          case 'classglobal':
          case 'classenum':
          case 'field':
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
${title}
${tcontents}`;

    // list contents of this page
    if (chapters.length > 0) {
      html += `
<h2>Contents</h2>
<table>
  <thead>
    <tr>
      <th width="38%">Title</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>`;
      for (const c of chapters) {
        const target = c.target || c.uid;
        const tdecl = DocDecl.getByUid(target);
        const name = c.name;
        const summary = tdecl ? tdecl.getTextOfChild('summary') : '';
        html += `
    <tr>
      <td onClick="navigateById('${target}')" style="--color: var(${tdecl?.color})"><div class="property-icon">${tdecl?.icon}</div>${name}</td>
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
