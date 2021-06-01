import * as vscode from 'vscode';
import { TextDecoder } from 'util';

/**
 * Provides and checks configuration for Cerberus X
 */
export class CxConfiguration {
  private static onConfigurationValidCallbacks: (()=>void)[] = [];
  public static version: string = '';

  /**
   * Returns Cerberus X configuration value from `section`
   * @param section key
   * @returns matching value
   */
  public static get(section: string): any {
    return vscode.workspace.getConfiguration('cerberusX').get(section);
  }
  /**
   * Sets a Cerberus X configuration value.
   * Use `undefined` to unset.
   * @param section key
   * @param value value
   * @returns `Thenable<void>` resolving when done
   */
  public static set(section: string, value: any): Thenable<void> {
    return vscode.workspace.getConfiguration('cerberusX').update(section, value, true);
  }

  /**
   * Defines functions to be called when configuration is valid
   * @param callback function to be called
   */
  public static onConfigurationValid(callback: ()=>void): void {
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
    Promise.all([
      this.validateVersions(path),
      this.validateConfig(path),
      this.validateTranscc(path)
    ]).then(() => {
      // call on*valid callbacks
      for (const callback of this.onConfigurationValidCallbacks) {
        callback();
      }
      vscode.window.showInformationMessage('Cerberus X ' + this.version + ' up and running!');
    }).catch(() => {
      this.messageInvalidPath('Cerberus X path set to invalid target.');
    });
  }

  // validate versions file
  private static validateVersions(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // look for VERSIONS.TXT
      const vfile = vscode.Uri.file(path + '/VERSIONS.TXT');
      vscode.workspace.fs.readFile(vfile).then(
        // VERSIONS.TXT existing, try to extract current version
        (contents) => {
          let text: string = new TextDecoder().decode(contents);
          let version = text.match(/^[\*]{5}\s([^\*]*)\s[\*]{5}/);
          if (!version) {
            vscode.window.showInformationMessage('Could not retrieve current version from VERSIONS.TXT');
            this.version = '';
          } else {
            this.version = version[1];
          }
          resolve();
        },
        // no VERSIONS.TXT = invalid path
        () => {
          reject();
        }
      );
    });
  }

  // validate config file
  private static validateConfig(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // look for config files
      const infixes = ['winnt', 'macos'];
      const tries = [];
      let success: boolean = false;
      for (const infix of infixes) {
        const cfile = vscode.Uri.file(path + '/bin/config.' + infix + '.txt');
        // try reading
        tries.push(vscode.workspace.fs.readFile(cfile).then(
          //... success! read
          (contents) => {
            this.readConfig(contents);
            success = true;
          },
          () => {

          }
        ));
      }
      // once both readFiles are complete, check whether one of them succeeded
      Promise.all(tries).then(() => {
        if (!success) {
          vscode.window.showInformationMessage('Could not find any config file in /bin/');
        }
        resolve();
      })
    });
  }

  // validate transcc
  private static validateTranscc(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // look for config files
      const names = ['transcc_winnt.exe', 'transcc_macos.app'];
      const tries = [];
      let success: boolean = false;
      for (const name of names) {
        const cpath = path + '/bin/' + name;
        const cfile = vscode.Uri.file(cpath);
        // try accessing
        tries.push(vscode.workspace.fs.stat(cfile).then(
          //... success!
          (stat) => {
            if (stat.type = vscode.FileType.File) {
              this.set('transccPath', cpath)
              success = true;
            }
          },
          () => {
            
          }
        ));
      }
      // once both stats are complete, check whether one of them succeeded
      Promise.all(tries).then(() => {
        if (!success) {
          vscode.window.showInformationMessage('Could not find any transcc in /bin/');
        }
        resolve();
      })
    });
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

  private static readConfig(contents: Uint8Array) {
    let text: string = new TextDecoder().decode(contents);
    // retrieve html player path
    let matches = text.match(/(?<=HTML_PLAYER=")(.*)(?=")/gm);
    if (matches) {
      const htmlplayer = matches[0].replace("${CERBERUSDIR}", this.get('path'));
      this.set('cserverPath', htmlplayer);
    }
  }
}