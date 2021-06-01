//zdoc ### src/extension.ts ###

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { CxExtension } from './extension/cerberusx.extension';

/*zdoc
This function is called when the extension is activated.
See `package.json > "activationEvents"` for the definition of events that
activate the extension.

Checks the Cerberus X configuration and registers all handlers and providers.
zdoc*/
export function activate(context: vscode.ExtensionContext) {
  CxExtension.activate(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
