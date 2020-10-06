this file was auto-generated with `zdoccer.sh`
# Index
[VS Code extension for Cerberus X](#vs-code-extension-for-cerberus-x)  
&emsp;[Involved Parties](#involved-parties)  
&emsp;[License](#license)  
&emsp;[Testing the extension](#testing-the-extension)  
&emsp;[Code Scaffolding](#code-scaffolding)  
&emsp;[Documentation](#documentation)  
&emsp;[Architecture Documentation](#architecture-documentation)  
&emsp;[Feature Documentation](#feature-documentation)  
&emsp;&emsp;[src/extension.ts](#srcextensionts)  
&emsp;&emsp;[src/features/configuration.ts](#srcfeaturesconfigurationts)  
&emsp;&emsp;[src/features/declHtmlTransformer.ts](#srcfeaturesdeclhtmltransformerts)  
&emsp;&emsp;[src/features/DocDecl.ts](#srcfeaturesdocdeclts)  
&emsp;&emsp;[src/features/documentation.ts](#srcfeaturesdocumentationts)  
&emsp;&emsp;[src/features/documentSymbolProvider.ts](#srcfeaturesdocumentsymbolproviderts)  
# VS Code extension for Cerberus X #

`VS Code extension for Cerberus X` enables programming Cerberus X in Visual Studio Code. The goal of this extension is to provide basic and more sophisticated features necessary and useful for working with Cerberus X.

## Involved Parties ##

`VS Code extension for Cerberus X` was created by Olivier Stuker inspired by Adamredwoods' `Visual Studio Code extension for Cerberus Programming Language` and Hezkore's `BlitzMax Language Basics for Visual Studio Code`.

POC: [Olivier "Holzchopf" Stuker](https://cerberus-x.com/community/members/holzchopf.49/)

## License ##

See `LICENSE.md`

## Testing the extension ##

From within VS Code, just hit `F5` to start a testing instance with `VS Code extension for Cerberus X` loaded. Then load any `.cxs` file to activate the extension.

Automatic testing is not yet set up.

## Code Scaffolding ##

This extension was initialised with `Yeoman` and `VS Code Extension Generator`.

Features are provided by singleton classes. To add features, create a new `.ts` file in `src/features` containing not more than the features' singleton class and - optionally, and these may even be outsourced - definitions strongly linked to that feature (like type definitions, enumerations, interfaces).

To keep the project folder tidy, we use the following structure:

```
src/              # entry point (extension.ts)
  assets/         # assets (to be compiled into the extension)
  features/       # features
  test/           # test suite
syntaxes/         # Cerberus X syntax definition
```

## Documentation ##

This project is documented using `zdoccer.sh` - a script that creates the `README.md` from a `README.preamble.md`, the documented source in the `src` folder and a `README.termination.md`.

To document any feature of your project, precede it with a block comment of the following form:
```
/*zdoc
markdown for your feature goes here
zdoc*/
<line of code to be documented>
```

Or a single line comment of the following form:
```
//zdoc markdown goes here
<line of code to be documented>
```

If `<line of code to be documented>` is not empty, it will be prepended to the markdown block.

To update the `README.md`, run the `zdoccer.sh` script.

## Architecture Documentation ##

`VS Code extension for Cerberus X` is split into multiple singleton classes, grouping similar functionalities or features of same context.

## Feature Documentation ##
---

### src/extension.ts ###

---
`export function activate(context: vscode.ExtensionContext)`

This function is called when the extension is activated.
See `package.json > "activationEvents"` for the definition of events that
activate the extension.

Checks the Cerberus X configuration and registers all handlers and providers.

---

### src/features/configuration.ts ###

---
`export class CxConfiguration`

Provides and checks configuration for Cerberus X

---
`  public static get(section: string): any`

Get Cerberus X configuration value from *section*

---
`  public static set(section: string, value: any): Thenable<void>`

Set Cerberus X configuration value at *section*

---

### src/features/declHtmlTransformer.ts ###

---
`export class CxDeclHtmlTransformer`

Transformer for DocDecl -> HTML

---
`  public static setWebview(webview: vscode.Webview)`

Set valid Webview for URI resolving

---
`  public static transform(decl: DocDecl): string`

Transform given DocDecl to string of HTML (full page)

---

### src/features/DocDecl.ts ###

---
`export class DocDecl`

Any kind of Cerberus X declaration

---
`  public static getByUid(uid: string): DocDecl|null`

Get DocDecl by uid (must match exactly, always 6 digits)

---
`  public find(ident: string): DocDecl|null`

Find (child) decl by ident

---

### src/features/documentation.ts ###

---
`export class CxDocumentation`

Global Cerberus X documentation

---
`  public static rootDecl: DocDecl`

Root DocDecl

---
`  public static show(): void`

Register feature and prepare components

---
`  public static loadDecls()`

Load declarations from docs/html/decls.json

---

### src/features/documentSymbolProvider.ts ###

---
`export class CxDocumentSymbolProvider implements vscode.DocumentSymbolProvider`

Provides a `vscode.DocumentSymbol` tree for the outline

---
`  public provideDocumentSymbols( document: vscode.TextDocument, token: vscode.CancellationToken ): vscode.DocumentSymbol[]`

Builds the tree. Invoked automatically by VS Code.

