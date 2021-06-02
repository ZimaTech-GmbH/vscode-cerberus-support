import * as vscode from 'vscode';

import { CxBuilder } from './features/builder/builder.feature';
import { CxConfiguration } from './features/configuration/configuration.feature';
import { CxDocumentation } from './features/documentation/documentation.feature';
import { CxTaskProvider } from './providers/task.provider';
import { CxDocumentSymbolProvider } from './providers/document-symbol.provider';
import { CxOnTypeFormattingEditProvider } from './providers/on-type-formatting-edit.provider';

/**
 * Extension container
 */
export class CxExtension {
  // "null as vscode.ExtensionContext" to suppress the "possibly null" message
  private static context: vscode.ExtensionContext;
  public static output: vscode.OutputChannel;

  constructor() { }

  /**
   * Checks the Cerberus X configuration and registers all handlers and providers.
   * @param context hosting `vscode.ExtensionContext`
   */
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

    CxOnTypeFormattingEditProvider.init(this.context);
    
    // this.context.subscriptions.push(
    //   vscode.tasks.registerTaskProvider('makedocs', new CxTaskProvider())
    // )

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
        'cerberus-x.buildDocumentation',
        () => CxDocumentation.build()
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