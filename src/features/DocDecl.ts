//zdoc ### src/features/DocDecl.ts ###

// dictionary to replace any default value based on decl.kind
import * as kdict from './documentationKindDictionary.json';
// Cast to any because I know what I'm doing.
const kindDictionary = kdict as any;

/*zdoc
Any kind of Cerberus X declaration
zdoc*/
export class DocDecl {
  ident: string = '';
  kind: string = '';
  uid: string = '';
  target?: string;
  childs?: DocDecl[];
  parent?: DocDecl;
  // set by applying kind dictionary:
  name: string|null = null;
  prefix?: string;
  color?: string;
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
  private static byUid: any = {};

  // initialize decl fields by object
  constructor(obj: any) {
    this.ident = obj.ident || '';
    this.kind = obj.kind || '';
    this.uid = obj.uid || '';
    this.target = obj.target || '';
    // apply kindDictionary
    const specs = kindDictionary[this.kind] || {};
    // apply dictionary, fall back to defaults where necessary
    this.prefix = specs.prefix;
    this.name = specs.name;
    this.color = specs.color || '--vscode-symbolIcon-textForeground';
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

  //zdoc Get DocDecl by uid (must match exactly, always 6 digits)
  public static getByUid(uid: string): DocDecl|null {
    return this.byUid[uid];
  }

  // return decl name (or identifier, if name is not set)
  public getName(): string {
    return (this.name || this.ident);
  }

  // return value of given child
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

  // return absolute doc path for this decl
  public getDocPath(): string {
    if (this.kind == 'doc' || this.kind == 'index') {
      return '/' + this.getUident();
    } else if (this.kind == 'root') {
      return '/';
    } else {
      return '.' + this.getUident();
    }
  }

  // return full path (uident) for this decl (and cache, speeds things up)
  public getUident(): string {
    if (this.uident) {
      return this.uident;
    }
    this.uidentscope = this.getTextOfChild('uident_scope');
    this.uidentparams = this.getTextOfChild('uident_params');
    this.uident = this.uidentscope + this.ident + this.uidentparams;
    return this.uident;
  }

  // // whether this decl can by found by link resolving
  // private canBeFound(): boolean {
  //   switch (this.kind) {
  //     case 'doc':
  //     case 'module':
  //     case 'index':
  //     case 'class':
  //     case 'interface':
  //     case 'function':
  //     case 'const':
  //     case 'global':
  //     case 'method':
  //     case 'property':
  //     case 'ctor':
  //     case 'classfunction':
  //     case 'classconst':
  //     case 'classglobal':
  //     case 'field':
  //     case 'enum_element':
  //       return true;
  //   }
  //   return false;
  // }

  //zdoc Find (child) decl by ident
  public find(ident: string): DocDecl|null {
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
      if (d.ident == ident) {
        return d;
      }
    }
    return null;
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