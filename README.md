This file was auto-generated with `zdoccer.js` 1.3.0

# Index

  - [VS Code extension for Cerberus X](#vs-code-extension-for-cerberus-x)
    - [Involved Parties](#involved-parties)
    - [License](#license)
    - [Testing the extension](#testing-the-extension)
    - [Building the extension](#building-the-extension)
    - [Code Scaffolding](#code-scaffolding)
    - [Documentation](#documentation)
  - [Sourcecode Documentation](#sourcecode-documentation)
    - [`function activate(context: vscode.ExtensionContext)`](#function-activate-context-vscode-extensioncontext)
    - [`function deactivate() {}`](#function-deactivate)
    - [`class CxExtension`](#class-cxextension)
      - [`public static activate(context: vscode.ExtensionContext)`](#public-static-activate-context-vscode-extensioncontext)
    - [`class CxBuilder`](#class-cxbuilder)
      - [`public static cerberusGetBuildFile(): string`](#public-static-cerberusgetbuildfile-string)
      - [`public static buildHtml(): Promise<void>`](#public-static-buildhtml-promise-void)
      - [`public static build(file: string, args: string[]): Promise<void>`](#public-static-build-file-string-args-string-promise-void)
      - [`public static runHtml(): Promise<void>`](#public-static-runhtml-promise-void)
    - [`class CxChildProcess`](#class-cxchildprocess)
      - [`public static spawn(title: string, paths: {[name: string]: string}, command: string, args: string[] = []): Promise<void>`](#public-static-spawn-title-string-paths-name-string-string-command-string-args-string-promise-void)
    - [`class CxConfiguration`](#class-cxconfiguration)
      - [`public static version: string|undefined`](#public-static-version-string-undefined)
      - [`public static platform: string|undefined`](#public-static-platform-string-undefined)
      - [`public static transccPath: string|undefined`](#public-static-transccpath-string-undefined)
      - [`public static makedocsPath: string|undefined`](#public-static-makedocspath-string-undefined)
      - [`public static cserverPath: string|undefined`](#public-static-cserverpath-string-undefined)
      - [`public static get(section: string): any`](#public-static-get-section-string-any)
      - [`public static set(section: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Thenable<void>`](#public-static-set-section-string-value-any-target-vscode-configurationtarget-vscode-configurationtarget-workspace-thenable-void)
      - [`public static onConfigurationValid(callback: ()=>void): void`](#public-static-onconfigurationvalid-callback-void-void)
      - [`public getDetailsText(): string`](#public-getdetailstext-string)
      - [`// public nextTokenIndex(from: number = 0): number`](#public-nexttokenindex-from-number-0-number)
    - [`class DocDeclHtmlTransformer`](#class-docdeclhtmltransformer)
      - [`public static setWebview(webview: vscode.Webview)`](#public-static-setwebview-webview-vscode-webview)
      - [`public static transform(decl: DocDecl): string`](#public-static-transform-decl-docdecl-string)
    - [`class DocDecl`](#class-docdecl)
      - [`public static getByUid(uid: string): DocDecl|null`](#public-static-getbyuid-uid-string-docdecl-null)
      - [`public getChild(ident: string): DocDecl|null`](#public-getchild-ident-string-docdecl-null)
      - [`public getTextOfChild(kind: string): string`](#public-gettextofchild-kind-string-string)
      - [`public getDocPath(): string`](#public-getdocpath-string)
      - [`public getUident(): string`](#public-getuident-string)
    - [`class CxDocumentation`](#class-cxdocumentation)
      - [`public static rootDecl: DocDecl`](#public-static-rootdecl-docdecl)
      - [`private static currentDecl: DocDecl`](#private-static-currentdecl-docdecl)
      - [`private static history: DocDecl[] = []`](#private-static-history-docdecl)
      - [`private static historyRev: DocDecl[] = []`](#private-static-historyrev-docdecl)
      - [`private static panel: vscode.WebviewPanel`](#private-static-panel-vscode-webviewpanel)
      - [`private static webview: vscode.Webview`](#private-static-webview-vscode-webview)
      - [`public static build(): Promise<void>`](#public-static-build-promise-void)
      - [`public static init(): void`](#public-static-init-void)
      - [`public static loadDecls()`](#public-static-loaddecls)
      - [`public static canNavBack(): boolean`](#public-static-cannavback-boolean)
      - [`public static canNavFwd(): boolean`](#public-static-cannavfwd-boolean)
    - [`class CxDocumentSymbolProvider`](#class-cxdocumentsymbolprovider)
      - [`public provideDocumentSymbols( document: vscode.TextDocument, token: vscode.CancellationToken ): vscode.DocumentSymbol[]`](#public-providedocumentsymbols-document-vscode-textdocument-token-vscode-cancellationtoken-vscode-documentsymbol)
    - [`class CxOnTypeFormattingEditProvider`](#class-cxontypeformattingeditprovider)
      - [`public static init(context: vscode.ExtensionContext)`](#public-static-init-context-vscode-extensioncontext)
      - [`public provideOnTypeFormattingEdits(document: vscode.TextDocument, position: vscode.Position, char: string, options: vscode.FormattingOptions, ctoken: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]>`](#public-provideontypeformattingedits-document-vscode-textdocument-position-vscode-position-char-string-options-vscode-formattingoptions-ctoken-vscode-cancellationtoken-vscode-providerresult-vscode-textedit)


---

*original Markdown from src/.readme.md*

<div id="vs-code-extension-for-cerberus-x"></div><!-- alias: vs-code-extension-for-cerberus-x -->

# VS Code extension for Cerberus X

`VS Code extension for Cerberus X` enables programming Cerberus X in Visual Studio Code. The goal of this extension is to provide basic and more sophisticated features necessary and useful for working with Cerberus X.

<div id="involved-parties"></div><!-- alias: involved-parties -->

## Involved Parties

`VS Code extension for Cerberus X` was created by Olivier Stuker inspired by Adamredwoods' `Visual Studio Code extension for Cerberus Programming Language` and Hezkore's `BlitzMax Language Basics for Visual Studio Code`.

POC: [Olivier "Holzchopf" Stuker](https://cerberus-x.com/community/members/holzchopf.49/)

<div id="license"></div><!-- alias: license -->

## License

See `LICENSE.md`

<div id="testing-the-extension"></div><!-- alias: testing-the-extension -->

## Testing the extension

From within VS Code, just hit `F5` to start a testing instance with `VS Code extension for Cerberus X` loaded. Then load any `.cxs` file to activate the extension.

Automatic testing is not yet set up.

<div id="building-the-extension"></div><!-- alias: building-the-extension -->

## Building the extension

Run
```
vsce package
```

Needs `vsce` (see https://code.visualstudio.com/api/working-with-extensions/publishing-extension )

<div id="code-scaffolding"></div><!-- alias: code-scaffolding -->

## Code Scaffolding

This extension was initialised with `Yeoman` and `VS Code Extension Generator`.

Features are provided by singleton classes. To add features, create a new `.ts` file in `src/features` containing not more than the features' singleton class and - optionally, and these may even be outsourced - definitions strongly linked to that feature (like type definitions, enumerations, interfaces).

To keep the project folder tidy, we use the following structure:

```
src/              # entry point (extension.ts)
  assets/         # assets (to be compiled into the extension)
  extension/      # extension source
    features/     # features (everything that can be seen as a module)
    providers/    # providers
  test/           # test suite
syntaxes/         # Cerberus X syntax definition
```

<div id="documentation"></div><!-- alias: documentation -->

## Documentation

This project is documented using `zdoccer.js` - a script that creates the `README.md` from markdown files and Javadoc-documented source in the specified folder.

To document any feature of your project, preceed it with a block comment of the following form:
```
/**
 * markdown for your feature goes here
 */
<line of code to be documented>
```

Or a single line comment of the following form:
```
/** markdown goes here */
<line of code to be documented>
```

If `<line of code to be documented>` is not empty, it will be prepended to the markdown block.

To update the `README.md`, run the `zdoccer.js` script:
```
node zdoccer.js src
```

<div id="sourcecode-documentation"></div><!-- alias: sourcecode-documentation -->

# Sourcecode Documentation

`VS Code extension for Cerberus X` is split into multiple singleton classes, grouping similar functionalities or features of same context.


---

*transformed Javadoc from src/extension.ts*

<div id="function-activate-context-vscode-extensioncontext"></div><!-- alias: activate -->

## `function activate(context: vscode.ExtensionContext)`


This function is called when the extension is activated.
See `package.json > "activationEvents"` for the definition of events that
activate the extension.

Starts the extension, see [CxExtension **&#x1f875;**](#class-cxextension)


<div id="function-deactivate"></div><!-- alias: deactivate -->

## `function deactivate() {}`


this method is called when your extension is deactivated




---

*transformed Javadoc from src/extension/cerberusx.extension.ts*

<div id="class-cxextension"></div><!-- alias: cxextension -->

## `class CxExtension`


Extension container


<div id="public-static-activate-context-vscode-extensioncontext"></div><!-- alias: activate -->

### `public static activate(context: vscode.ExtensionContext)`


Checks the Cerberus X configuration and registers all handlers and providers.
- *param* `context` &mdash; hosting `vscode.ExtensionContext`




---

*transformed Javadoc from src/extension/features/builder/builder.feature.ts*

<div id="class-cxbuilder"></div><!-- alias: cxbuilder -->

## `class CxBuilder`


Different Cerberus X builders


<div id="public-static-cerberusgetbuildfile-string"></div><!-- alias: cerberusgetbuildfile -->

### `public static cerberusGetBuildFile(): string`

returns currently active build file or empty string if not defined

<div id="public-static-buildhtml-promise-void"></div><!-- alias: buildhtml -->

### `public static buildHtml(): Promise<void>`


Builds HTML5 game
- *returns* &mdash; Promise resolving on success


<div id="public-static-build-file-string-args-string-promise-void"></div><!-- alias: build -->

### `public static build(file: string, args: string[]): Promise<void>`


Generic build, invokes `transcc`
- *param* `file` &mdash; path to file to build
- *param* `args` &mdash; compiler flags
- *returns* &mdash; Promise resolving on success


<div id="public-static-runhtml-promise-void"></div><!-- alias: runhtml -->

### `public static runHtml(): Promise<void>`


Runs HTML5 game
- *returns* &mdash; Promise resolving on success




---

*transformed Javadoc from src/extension/features/child-process/child-process.feature.ts*

<div id="class-cxchildprocess"></div><!-- alias: cxchildprocess -->

## `class CxChildProcess`


Child process helper


<div id="public-static-spawn-title-string-paths-name-string-string-command-string-args-string-promise-void"></div><!-- alias: spawn -->

### `public static spawn(title: string, paths: {[name: string]: string}, command: string, args: string[] = []): Promise<void>`


Spawns a new child process and outputs stdout and stderr data
- *param* `title` &mdash; How the process is described in output
- *param* `paths` &mdash; Paths to list, e.g. {transcc: 'path/there'}
- *param* `command` &mdash; command to execute
- *param* `args` &mdash; command arguments
- *returns* &mdash; a promise resolving when the process finished




---

*transformed Javadoc from src/extension/features/configuration/configuration.feature.ts*

<div id="class-cxconfiguration"></div><!-- alias: cxconfiguration -->

## `class CxConfiguration`


Provides and checks configuration for Cerberus X


<div id="public-static-version-string-undefined"></div><!-- alias: version -->

### `public static version: string|undefined`

Cerberus X version

<div id="public-static-platform-string-undefined"></div><!-- alias: platform -->

### `public static platform: string|undefined`

platform (`winnt`, `macos` or `linux`)

<div id="public-static-transccpath-string-undefined"></div><!-- alias: transccpath -->

### `public static transccPath: string|undefined`

path to transcc executable

<div id="public-static-makedocspath-string-undefined"></div><!-- alias: makedocspath -->

### `public static makedocsPath: string|undefined`

path to makedocs executable

<div id="public-static-cserverpath-string-undefined"></div><!-- alias: cserverpath -->

### `public static cserverPath: string|undefined`

path to cserver executable

<div id="public-static-get-section-string-any"></div><!-- alias: get -->

### `public static get(section: string): any`


Returns Cerberus X configuration value from `section`
- *param* `section` &mdash; key
- *returns* &mdash; matching value


<div id="public-static-set-section-string-value-any-target-vscode-configurationtarget-vscode-configurationtarget-workspace-thenable-void"></div><!-- alias: set -->

### `public static set(section: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Thenable<void>`


Sets a Cerberus X configuration value.
Use `undefined` to unset.
- *param* `section` &mdash; key
- *param* `value` &mdash; value
- *returns* &mdash; `Thenable<void>` resolving when done


<div id="public-static-onconfigurationvalid-callback-void-void"></div><!-- alias: onconfigurationvalid -->

### `public static onConfigurationValid(callback: ()=>void): void`


Defines functions to be called when configuration is valid
- *param* `callback` &mdash; function to be called




---

*transformed Javadoc from src/extension/features/cxlang/cxlang-semanter.feature.ts*

<div id="public-getdetailstext-string"></div><!-- alias: getdetailstext -->

### `public getDetailsText(): string`


Returns the definitions following the identifier as pretty printed string




---

*transformed Javadoc from src/extension/features/cxlang/cxlang-tokenizer.feature.ts*

<div id="public-nexttokenindex-from-number-0-number"></div><!-- alias: public-nexttokenindex -->

### `// public nextTokenIndex(from: number = 0): number`


Index of next non-whitespace token
- *param* `from` &mdash; optional start index
- *returns* &mdash; index or -1 if line end reached




---

*transformed Javadoc from src/extension/features/documentation/docdecl-html-transformer.ts*

<div id="class-docdeclhtmltransformer"></div><!-- alias: docdeclhtmltransformer -->

## `class DocDeclHtmlTransformer`


Transformer for [DocDecl **&#x1f875;**](#class-docdecl) -> HTML


<div id="public-static-setwebview-webview-vscode-webview"></div><!-- alias: setwebview -->

### `public static setWebview(webview: vscode.Webview)`


Sets Webview, necessary for URI resolving
- *param* `webview` &mdash; valid `vscode.Webview`


<div id="public-static-transform-decl-docdecl-string"></div><!-- alias: transform -->

### `public static transform(decl: DocDecl): string`


Transforms given [DocDecl **&#x1f875;**](#class-docdecl) to string of HTML (full page)
- *param* `decl` &mdash; `DocDecl` to transform
- *returns* &mdash; html string




---

*transformed Javadoc from src/extension/features/documentation/docdecl.ts*

<div id="class-docdecl"></div><!-- alias: docdecl -->

## `class DocDecl`


Any kind of Cerberus X declaration


<div id="public-static-getbyuid-uid-string-docdecl-null"></div><!-- alias: getbyuid -->

### `public static getByUid(uid: string): DocDecl|null`


Returns DocDecl by uid (must match exactly, always 6 digits)
- *param* `uid` &mdash; 6 digit uid
- *returns* &mdash; matching `DocDecl` or `null`


<div id="public-getchild-ident-string-docdecl-null"></div><!-- alias: getchild -->

### `public getChild(ident: string): DocDecl|null`


Returns child decl by ident
- *param* `ident` &mdash; identifier to match
- *returns* &mdash; matching `DocDecl` or `null`


<div id="public-gettextofchild-kind-string-string"></div><!-- alias: gettextofchild -->

### `public getTextOfChild(kind: string): string`


Returns value of child of given `kind`
- *param* `kind` &mdash; `kind` property that has to match
- *returns* &mdash; string value of match


<div id="public-getdocpath-string"></div><!-- alias: getdocpath -->

### `public getDocPath(): string`


Absolute doc path for this decl
- *returns* &mdash; doc path as string


<div id="public-getuident-string"></div><!-- alias: getuident -->

### `public getUident(): string`


full path (uident) for this decl (and cache, speeds things up)
- *returns* &mdash; full path as string




---

*transformed Javadoc from src/extension/features/documentation/documentation.feature.ts*

<div id="class-cxdocumentation"></div><!-- alias: cxdocumentation -->

## `class CxDocumentation`


Cerberus X in-editor documentation


<div id="public-static-rootdecl-docdecl"></div><!-- alias: rootdecl -->

### `public static rootDecl: DocDecl`

Root DocDecl

<div id="private-static-currentdecl-docdecl"></div><!-- alias: currentdecl -->

### `private static currentDecl: DocDecl`

currently (navigated to) DocDecl

<div id="private-static-history-docdecl"></div><!-- alias: history -->

### `private static history: DocDecl[] = []`

history of navigated DocDecl

<div id="private-static-historyrev-docdecl"></div><!-- alias: historyrev -->

### `private static historyRev: DocDecl[] = []`

when going back, this is the stack of "forward" DocDecl

<div id="private-static-panel-vscode-webviewpanel"></div><!-- alias: panel -->

### `private static panel: vscode.WebviewPanel`

panel

<div id="private-static-webview-vscode-webview"></div><!-- alias: webview -->

### `private static webview: vscode.Webview`

webview (instance needed for navigating and stuff)

<div id="public-static-build-promise-void"></div><!-- alias: build -->

### `public static build(): Promise<void>`


Invokes makedocs to build the docs
- *returns* &mdash; Promise resolving when done


<div id="public-static-init-void"></div><!-- alias: init -->

### `public static init(): void`


Registers the feature and prepares components


<div id="public-static-loaddecls"></div><!-- alias: loaddecls -->

### `public static loadDecls()`


Loads declarations from `docs/html/decls.json`


<div id="public-static-cannavback-boolean"></div><!-- alias: cannavback -->

### `public static canNavBack(): boolean`


Whether navigating back is possible


<div id="public-static-cannavfwd-boolean"></div><!-- alias: cannavfwd -->

### `public static canNavFwd(): boolean`


Whether navigating forward is possible




---

*transformed Javadoc from src/extension/providers/document-symbol.provider.ts*

<div id="class-cxdocumentsymbolprovider"></div><!-- alias: cxdocumentsymbolprovider -->

## `class CxDocumentSymbolProvider`


Provides a `vscode.DocumentSymbol` tree for the outline


<div id="public-providedocumentsymbols-document-vscode-textdocument-token-vscode-cancellationtoken-vscode-documentsymbol"></div><!-- alias: providedocumentsymbols -->

### `public provideDocumentSymbols( document: vscode.TextDocument, token: vscode.CancellationToken ): vscode.DocumentSymbol[]`


Builds the tree. Invoked automatically by VS Code
- *param* `document` &mdash; `vscode.TextDocument` to build the tree for
- *param* `token` &mdash; `vscode.CancellationToken`
- *returns* &mdash; `vscode.DocumentSymbol[]`




---

*transformed Javadoc from src/extension/providers/on-type-formatting-edit.provider.ts*

<div id="class-cxontypeformattingeditprovider"></div><!-- alias: cxontypeformattingeditprovider -->

## `class CxOnTypeFormattingEditProvider`


Provides a `vscode.OnTypeFormattingEditProvider` for real-time formatting


<div id="public-static-init-context-vscode-extensioncontext"></div><!-- alias: init -->

### `public static init(context: vscode.ExtensionContext)`


Initializes provider
- *param* `context` &mdash; `vscode.ExtensionContext`


<div id="public-provideontypeformattingedits-document-vscode-textdocument-position-vscode-position-char-string-options-vscode-formattingoptions-ctoken-vscode-cancellationtoken-vscode-providerresult-vscode-textedit"></div><!-- alias: provideontypeformattingedits -->

### `public provideOnTypeFormattingEdits(document: vscode.TextDocument, position: vscode.Position, char: string, options: vscode.FormattingOptions, ctoken: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]>`


Provides on type formatting edits. Invoked automatically by VS Code
- *param* `document` &mdash; current `vscode.TextDocument`
- *param* `position` &mdash; `vscode.Position` after triggering
- *param* `char` &mdash; triggering char as `string`
- *param* `options` &mdash; `vscode.FormattingOptions`
- *param* `token` &mdash; `vscode.CancellationToken`
- *returns* &mdash; `vscode.TextEdit`s to apply


