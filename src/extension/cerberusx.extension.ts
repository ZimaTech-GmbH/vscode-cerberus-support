import * as vscode from 'vscode';

import { CxDocumentSymbolProvider } from './documentSymbolProvider';
import { CxBuilder } from './features/builder/builder.feature';
import { CxConfiguration } from './features/configuration/configuration.feature';
import { CxDocumentation } from './features/documentation/documentation.feature';

/**
 * Extension container
 */
export class CxExtension {
  // "null as vscode.ExtensionContext" to suppress the "possibly null" message
  private static context: vscode.ExtensionContext;
  public static output: vscode.OutputChannel;

  constructor() { }

  public static activate(context: vscode.ExtensionContext) {
    this.context = context;
    this.output = vscode.window.createOutputChannel('Cerberus X');

    // register functions to be called when configuration is valid
    CxConfiguration.onConfigurationValid(() => {
      CxDocumentation.loadDecls();
    });

    vscode.workspace.onDidChangeConfiguration(() => {
      CxConfiguration.validate();
    });

    this.registerCommands();

    this.context.subscriptions.push(
      vscode.languages.registerDocumentSymbolProvider(
        { scheme: 'file', language: 'cerberus-x' },
        new CxDocumentSymbolProvider()
      )
    );

    // done setting up, start working by validating current configuration
    CxConfiguration.validate();
  }

  private static registerCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'cerberus-x.helloWorld',
        () => vscode.window.showInformationMessage('Hello World from Cerberus X Support!')
      )
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'cerberus-x.showDocumentation',
        () => CxDocumentation.show()
      )
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'cerberus-x.buildHtml',
        () => CxBuilder.buildHtml()
      )
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'cerberus-x.runHtml',
        () => CxBuilder.runHtml()
      )
    );
  }


}