import * as vscode from 'vscode';

import { CxConfiguration } from '../configuration/configuration.feature';
import { DocDecl } from './docdecl';

import templateCss from '../../../assets/html-templates/html-css';
import templateJs from '../../../assets/html-templates/html-js';
import iconCerberus from '../../../assets/html-templates/svg-cerberus';
import iconNavBack from '../../../assets/html-templates/svg-nav-back';
import iconNavFwd from '../../../assets/html-templates/svg-nav-fwd';
import iconNavSearch from '../../../assets/html-templates/svg-nav-search';
import { CxDocumentation } from './documentation.feature';

/**
 * Transformer for [[DocDecl]] -> HTML
 */
export class DocDeclHtmlTransformer {
  public static webview: vscode.Webview;

  /**
   * Sets Webview, necessary for URI resolving
   * @param webview valid `vscode.Webview`
   */
  public static setWebview(webview: vscode.Webview) {
    this.webview = webview;
  }

  /**
   * Transforms given [[DocDecl]] to string of HTML (full page)
   * @param decl `DocDecl` to transform
   * @returns html string
   */
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

  // transforms urls in `html` as in links for use in webview
  private static transformUrls(html: string): string {
    // replace makedocs links <a href="uid:UID">
    html = html.replace(/<a\s([^>]*?)href="uid:([0-9]*)"(.*?)>/g, '<a $1onClick="navigateById(\'$2\')"$3>');
    // replace makedocs anchor links <a href="#HASH">
    html = html.replace(/<a\s([^>]*?)href="(#[^"]*)"(.*?)>/g, '<a $1onClick="navigateToHash(\'$2\')"$3>');
    // fix image srcs <img src="SRC"/>
    html = html.replace(/<img\s([^>]*?)src="([^"]*)"(.*?)>/g, (match, p1, p2, p3) => {
      const src = this.webview.asWebviewUri(vscode.Uri.file(CxConfiguration.get('path') + '/docs/html/' + p2));
      return `<img ${p1}src="${src}"${p3}/>`;
    })
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

    return html;
  }

  // get "browser" navigator
  private static getBrowser(decl: DocDecl): string {
    const bwdClass = CxDocumentation.canNavBack() ? '' : 'inactive';
    const fwdClass = CxDocumentation.canNavFwd() ? '' : 'inactive';
    let html = `
<nav id="browser">
  <div id="logo" onClick="navigate('Home')">
    ${iconCerberus}
  </div>
  <div id="navback" onClick="navBwd()" class="${bwdClass}">
    ${iconNavBack}
  </div>
  <div id="navfwd" onClick="navFwd()" class="${fwdClass}">
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
    let title: string = this.getTitle(decl);

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
        tcontents += this.transformUrls(c.ident);
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
<table class="toc">
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
        const name = c.name;
        let summary = tdecl ? tdecl.getTextOfChild('summary') : '';
        summary = this.transformUrls(summary);
        html += `
    <tr>
      <td onClick="navigateById('${target}')" style="--color: var(${tdecl?.color})"><div class="property-icon">${tdecl?.icon}</div>${name}</td>
      <td>${summary}</td>
    </tr>`;
      }
      html += `
  </tbody>
</table>

<hr class="content-ruler"/>`;
      for (const c of chapters) {
        html += '<article class="decl">';
        html += this.getTitle(c);
        html += this.transformUrls(c.getTextOfChild('description'));
        html += '</article>';
      }
    }
    html += `
</main>`;
    return html;
  }

  private static getTitle(decl: DocDecl): string {
    let txtType = decl.getTextOfChild('type');
    let txtParams = '';
    switch (decl.kind) {
      case 'function':
      case 'classfunction':
      case 'method':
        txtParams = '(';
        let params: string[] = [];
        for (const c of decl.childs || []) {
          if (c.kind == 'parameter') {
            let param = c.ident;
            let t = c.getTextOfChild('type');
            if (t) param += ':' + t;
            let d = c.getTextOfChild('initial_value');
            if (d) param += '=' + d;
            params.push(param);
          }
        }
        txtParams += params.join(', ');
        txtParams += ')';
    }
    let html = `
<div class="title" style="--color: var(${decl.color});" id="decl-${decl.uid}">
  <h1><div class="property-icon">${decl.icon}</div><span>${decl.prefix}</span> ${decl.name} <span>: ${txtType} ${txtParams}</span></h1>
</div>`;
    return html;
  }
}
