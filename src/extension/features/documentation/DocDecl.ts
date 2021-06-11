// dictionary to replace any default value based on decl.kind
import * as kdict from './docdecl-kind-dictionary.json';
// Cast to any because I know what I'm doing.
const kindDictionary = kdict as any;

/**
 * Any kind of Cerberus X declaration
 */
export class DocDecl {
  ident: string = '';
  kind: string = '';
  uid: string = '';
  target?: string;
  childs?: DocDecl[];
  parent?: DocDecl;
  // set by applying kind dictionary:
  get name(): string {
    const specs = kindDictionary[this.kind] || {};
    return specs.name || this.ident;
  };
  get icon(): string {
    const specs = kindDictionary[this.kind] || {};
    return specs.icon || '#';
  }
  get prefix(): string {
    const specs = kindDictionary[this.kind] || {};
    return specs.prefix || '';
  }
  get color(): string {
    const specs = kindDictionary[this.kind] || {};
    return specs.color || '--vscode-symbolIcon-textForeground';
  }
  // for finder...
  // - to not end up in an endless loop
  private static _finderRun: number = 0;
  private _finderCheck: number = 0;
  // - to speed up things
  private static _root: DocDecl;
  private static _modroot: DocDecl;
  private static _docroot: DocDecl;
  private uident?: string;
  private uidentscope?: string;
  private uidentparams?: string;
  private static byUid: {[uid: string]: DocDecl} = {};

  // initialize decl fields by object
  constructor(obj: any) {
    this.ident = obj.ident || '';
    this.kind = obj.kind || '';
    this.uid = obj.uid || '';
    this.target = obj.target || '';
    // // apply kindDictionary
    // const specs = kindDictionary[this.kind] || {};
    // // apply dictionary, fall back to defaults where necessary
    // this.icon = specs.icon || "-";
    // this.prefix = specs.prefix;
    // this.name = specs.name;
    // this.color = specs.color || '--vscode-symbolIcon-textForeground';
    // for finder
    if (this.kind == 'root') {
      DocDecl._root = this;
    } else if (this.kind == 'root_modules') {
      DocDecl._modroot = this;
    } else if (this.kind == 'root_docs') {
      DocDecl._docroot = this;
    }
    DocDecl.byUid[this.uid] = this;
  }

  /**
   * Returns DocDecl by uid (must match exactly, always 6 digits)
   * @param uid 6 digit uid
   * @returns matching `DocDecl` or `null`
   */
  public static getByUid(uid: string): DocDecl|null {
    return this.byUid[uid];
  }

  public static getByIdent(ident: string): DocDecl[]|null {
    if (!ident) return null;
    return this._root.getChildsByIdent(ident, true);
  }

  /**
   * Returns child decl by ident
   * @param ident identifier to match
   * @returns matching `DocDecl` or `null`
   */
   public getChild(ident: string): DocDecl|null {
    // let decl: DocDecl = this;
    // // absolute path?
    // if (ident.startsWith('/')) {
    //   decl = DocDecl._docroot;
    // } else if(ident.startsWith('.')) {
    //   decl = DocDecl._modroot;
    // }
    // // make decls findable again
    // DocDecl._finderRun += 1;
    // return decl.findFromHere(ident);
    for (const uid in DocDecl.byUid) {
      const d = DocDecl.byUid[uid];
      if (d.canBeFound() && d.ident == ident) {
        return d;
      }
    }
    return null;
  }

  public getChildsByIdent(ident: string, deep: boolean = false): DocDecl[]|null {
    if (!ident || !this.childs) return null;
    ident = ident.toLowerCase();
    const decls: DocDecl[] = [];
    for (const d of this.childs) {
      if (d.canBeFound() && d.ident.toLowerCase() == ident) {
        decls.push(d);
      }
      if (deep) {
        const declsDeep = d.getChildsByIdent(ident, true);
        if (declsDeep) decls.push(...declsDeep);
      }
    }
    if (decls.length == 0) return null;
    return decls;
  }

  /**
   * Returns value of child of given `kind`
   * @param kind `kind` property that has to match
   * @returns string value of match
   */
  public getTextOfChild(kind: string): string {
    if (this.childs) {
      for (const c of this.childs) {
        if (c.kind == kind) {
          return c.ident;
        }
      }
    }
    return '';
  }

  /**
   * Absolute doc path for this decl
   * @returns doc path as string
   */
  public getDocPath(): string {
    if (this.kind == 'doc' || this.kind == 'index') {
      return '/' + this.getUident();
    } else if (this.kind == 'root') {
      return '/';
    } else {
      return '.' + this.getUident();
    }
  }

  /**
   * full path (uident) for this decl (and cache, speeds things up)
   * @returns full path as string
   */
  public getUident(): string {
    if (this.uident) {
      return this.uident;
    }
    this.uidentscope = this.getTextOfChild('uident_scope');
    this.uidentparams = this.getTextOfChild('uident_params');
    this.uident = this.uidentscope + this.ident + this.uidentparams;
    return this.uident;
  }

  // whether this decl can by found by link resolving
  private canBeFound(): boolean {
    switch (this.kind) {
      case 'doc':
      case 'module':
      case 'index':
      case 'class':
      case 'interface':
      case 'function':
      case 'const':
      case 'global':
      case 'method':
      case 'property':
      case 'ctor':
      case 'classfunction':
      case 'classconst':
      case 'classglobal':
      case 'field':
      case 'enum_element':
        return true;
    }
    return false;
  }

  // // find decl from this decl
  // private findFromHere(ident: string): DocDecl|null {
  //   let decl: DocDecl|null = this;
  //   do {
  //     // check all childs
  //     const match = decl.findInHere(ident);
  //     if (match) return match;
  //     // no match? go one layer up
  //     decl = decl.parent || null;
  //   } while (decl);
  //   return null;
  // }

  // // find decl in this decl (or this, if matching)
  // private findInHere(ident: string): DocDecl|null {
  //   // I've already been checked
  //   if (this._finderCheck == DocDecl._finderRun) {
  //     return null;
  //   }
  //   // make sure I won't be checked again
  //   this._finderCheck = DocDecl._finderRun;
  //   // can I even be found?
  //   if (this.canBeFound()) {
  //     // it's me! (exact match, including params)
  //     if (this.getUident().endsWith(ident)) {
  //       return this;
  //     }
  //     // no params given?
  //     // (remember that uidentscope will only be set after getUident)
  //     else if ((this.uidentscope + this.ident).endsWith(ident)) {
  //       return this;
  //     }
  //   }
  //   // not found yet. look in childs
  //   if (this.childs) {
  //     for (const c of this.childs) {
  //       let target = c;
  //       // for import / extends / inh_ etc, look at target
  //       switch (c.kind) {
  //         case 'import':
  //         case 'extends':
  //         case 'implements':
  //         case 'inh_method':
  //         case 'inh_property':
  //         case 'inh_ctor':
  //         case 'inh_classfunction':
  //         case 'inh_classconst':
  //         case 'inh_classglobal':
  //         case 'inh_classenum':
  //           target = c.target ? DocDecl.byUid[c.target] : c;
  //           break;
  //       }
  //       const match = target.findInHere(ident);
  //       if (match) return match;
  //     }
  //   }
  //   return null;
  // }
}