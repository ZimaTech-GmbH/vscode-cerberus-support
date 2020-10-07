//zdoc ### src/extension.ts ###

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as childProcess from 'child_process';

import { CxDocumentSymbolProvider } from './features/documentSymbolProvider';
import { CxConfiguration } from './features/configuration';
import { CxDocumentation } from './features/documentation';

/*zdoc
This function is called when the extension is activated.
See `package.json > "activationEvents"` for the definition of events that
activate the extension.

Checks the Cerberus X configuration and registers all handlers and providers.
zdoc*/
export function activate(context: vscode.ExtensionContext) {

  // register functions to be called once configuration is valid
  CxConfiguration.onConfigurationValid(() => {
    CxDocumentation.loadDecls();
  });

  // check if Cerberus X configuration is valid
  CxConfiguration.validate();

  vscode.workspace.onDidChangeConfiguration((event) => {
    CxConfiguration.validate();
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('cerberus-x.helloWorld', () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from Cerberus X Support!');
  });

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cerberus-x.showDocumentation',
      () => {CxDocumentation.show()}
    )
  );

  let outputChannel = vscode.window.createOutputChannel('transcc');

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cerberus-x.buildHtml',
      () => {
        if (vscode.window.activeTextEditor?.document) {
          const transccPath: string = CxConfiguration.get('transccPath');
          const srcPath = vscode.window.activeTextEditor.document.uri.fsPath;

          outputChannel.show();
          outputChannel.appendLine('Building HTML');
          outputChannel.appendLine('transcc path: ' + transccPath);
          outputChannel.appendLine('source file: ' + srcPath);

          const args: string[] = ['-target="Html5_Game"', srcPath]

          const proc = childProcess.spawn(transccPath, args);
          proc.stdout.on('data', (data) => {
            outputChannel.appendLine(data.toString());
          });
          proc.stderr.on('data', (data) => {
            outputChannel.appendLine(data.toString());
          });
          proc.on('exit', (code) => {
            outputChannel.appendLine('Process terminated.')
            if (code) outputChannel.appendLine('Exit code: '+code);
          });
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cerberus-x.runHtml',
      () => {
        if (vscode.window.activeTextEditor?.document) {
          const cserverPath: string = CxConfiguration.get('cserverPath');
          const srcPath = vscode.window.activeTextEditor.document.uri.fsPath;

          let outPath = srcPath.replace(/cxs$/,
            'build' + CxConfiguration.version + '/html5/CerberusGame.html'
          );

          outputChannel.show();
          outputChannel.appendLine('Running HTML');
          outputChannel.appendLine('cserver path: ' + cserverPath);
          outputChannel.appendLine('game file: ' + outPath);

          const args: string[] = [outPath];

          const proc = childProcess.spawn(cserverPath, args);
          proc.stdout.on('data', (data) => {
            outputChannel.appendLine(data.toString());
          });
          proc.stderr.on('data', (data) => {
            outputChannel.appendLine(data.toString());
          });
          proc.on('exit', (code) => {
            outputChannel.appendLine('Process terminated.')
            if (code) outputChannel.appendLine('Exit code: '+code);
          });
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      { scheme: 'file', language: 'cerberus-x' },
      new CxDocumentSymbolProvider()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
