//zdoc ### src/features/configuration.ts ###

import * as vscode from 'vscode';
import { TextDecoder } from 'util';

/*zdoc
Provides and checks configuration for Cerberus X
zdoc*/
export class CxConfiguration {
  private static onConfigurationValidCallbacks: any[] = [];

  //zdoc Get Cerberus X configuration value from *section*
  public static get(section: string): any {
    return vscode.workspace.getConfiguration('cerberusX').get(section);
  }
  //zdoc Set Cerberus X configuration value at *section*
  public static set(section: string, value: any): Thenable<void> {
    return vscode.workspace.getConfiguration('cerberusX').update(section, value, true);
  }

  // define functions to be called when configuration is valid
  public static onConfigurationValid(callback: any): void {
    this.onConfigurationValidCallbacks.push(callback);
  }

  // helper functions

  // validate Cerberus X configuration
  public static validate(): void {
    const path = this.get('path');
    // no path set = invalid path
    if (!path) {
      this.messageInvalidPath('No Cerberus X path set.');
      return;
    }
    // look for VERSIONS.TXT
    const vfile = vscode.Uri.file(path + '/VERSIONS.TXT');
    vscode.workspace.fs.readFile(vfile).then(
      // VERSIONS.TXT existing, try to extract current version
      (contents) => {
        let text: string = new TextDecoder().decode(contents);
        let version = text.match(/^[\*]{5}\s([^\*]*)\s[\*]{5}/);
        if (!version) {
          vscode.window.showInformationMessage('Could not retrieve current version from VERSIONS.TXT');
        } else {
          vscode.window.showInformationMessage('Cerberus X ' + version[1] + ' up and running!');
        }
        // in either case, call on*valid callbacks
        for (const callback of this.onConfigurationValidCallbacks) {
          callback();
        }
      },
      // no VERSIONS.TXT = invalid path
      () => {
        this.messageInvalidPath('Cerberus X path set to invalid target.');
      }
    );
  }

  // inform user about invalid cerberus path
  private static messageInvalidPath(message: string): void {
    const itemSetPath: string = 'Set path'
    vscode.window.showErrorMessage(message, itemSetPath).then((action) => {
      // set path via system dialog, if user selects action
      if (action === itemSetPath) {
        this.selectPath();
      }
    });
  }

  public static async selectPath() {
    // show path selection dialog
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: 'Select'
    }
    vscode.window.showOpenDialog(options).then(async (path) => {
      // when path was selected, set in config and check config again
      if (path && path[0]) {
        await this.set('path', path[0].fsPath);
        this.validate();
      }
    });
  }
}