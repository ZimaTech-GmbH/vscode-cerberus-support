import * as vscode from 'vscode';
import { TextDecoder } from 'util';

/**
 * Provides and checks configuration for Cerberus X
 */
export class CxConfiguration {
  private static onConfigurationValidCallbacks: (()=>void)[] = [];
  /** Cerberus X version */
  public static version: string|undefined;
  /** platform (`winnt`, `macos` or `linux`) */
  public static platform: string|undefined;
  /** path to transcc executable */
  public static transccPath: string|undefined;
  /** path to makedocs executable */
  public static makedocsPath: string|undefined;
  /** path to cserver executable */
  public static cserverPath: string|undefined;

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
  public static set(section: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Thenable<void> {
    return vscode.workspace.getConfiguration('cerberusX').update(section, value, target);
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
    // invalidate old stuff
    this.version = undefined;
    this.transccPath = undefined;
    this.makedocsPath = undefined;
    this.cserverPath = undefined;
    // determine platform
    const platforms: {[architecture: string]: string} = {
      "win32": 'winnt',
      "darwin": 'macos',
      "linux": 'linux'
    };
    this.platform = platforms[process.platform];
    // re-validate
    Promise.all([
      this.validateVersions(path),
      this.validateConfig(path),
      this.validateTranscc(path),
      this.validateMakedocs(path),
      this.validateCServer()
    ]).then(() => {
      // call on*valid callbacks
      for (const callback of this.onConfigurationValidCallbacks) {
        callback();
      }
      vscode.window.showInformationMessage('Cerberus X ' + this.version + ' up and running!');
      //TODO: move these to commands
      // vscode.window.showInformationMessage('Platform: ' + this.platform);
      // vscode.window.showInformationMessage('transcc: ' + this.transccPath);
      // vscode.window.showInformationMessage('makedocs: ' + this.makedocsPath);
      // vscode.window.showInformationMessage('cserver: ' + this.cserverPath);
    }).catch((error) => {
      this.messageInvalidPath('Cerberus X path set to invalid target. Reason: ' + error);
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
            reject('Could not retrieve current version from VERSIONS.TXT');
          } else {
            this.version = version[1];
            resolve();
          }
        },
        // no VERSIONS.TXT = invalid path
        () => {
          reject('VERSIONS.TXT not found');
        }
      );
    });
  }

  // validate config file, also sets platform and cserverPath
  private static validateConfig(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // try loading config file
      const cfile = vscode.Uri.file(path + '/bin/config.' + this.platform + '.txt');
      vscode.workspace.fs.readFile(cfile).then(
      (contents) => {
        this.readConfig(contents);
        resolve();
      },
      (error) => {
        reject('Error loading ' + cfile + ': ' + error);
      });
    });
  }

  // validates transcc, sets transccPath, resolves anyway
  private static validateTranscc(path: string): Promise<void> {
    const names: {[platform: string]: string} = {
      'winnt': 'transcc_winnt.exe',
      'macos': 'transcc_macos.app',
      'linux': 'transcc_linux'
    };
    const name = names[this.platform || ''];
    const cpath = path + '/bin/' + name;
    return new Promise((resolve, reject) => {
      this.validateFileExists(cpath).then(() => {
        this.transccPath = cpath;
      }).catch(() => {
        vscode.window.showInformationMessage(`${name} not found - compiling won't be available`);
      }).finally(() => resolve());
    });
  }

  // validates makedocs, sets makedocsPath, resolves anyway
  private static validateMakedocs(path: string): Promise<void> {
    const names: {[platform: string]: string} = {
      'winnt': 'makedocs_winnt.exe',
      'macos': 'makedocs_macos.app',
      'linux': 'makedocs_linux'
    };
    const name = names[this.platform || ''];
    const cpath = path + '/bin/' + name;
    return new Promise((resolve, reject) => {
      this.validateFileExists(cpath).then(() => {
        this.makedocsPath = cpath;
      }).catch(() => {
        vscode.window.showInformationMessage(`${name} not found - building documentation won't be available`);
      }).finally(() => resolve());
    });
  }

  // validates makedocs, sets cserverPath, resolves anyway
  private static validateCServer(): Promise<void> {
    const name = this.cserverPath || '';
    return new Promise((resolve, reject) => {
      this.validateFileExists(name).then(() => {

      }).catch(() => {
        this.cserverPath = undefined;
        vscode.window.showInformationMessage(`${name} not found - running HTML5 games won't be available`);
      }).finally(() => resolve());
    });
  }

  // validates file exists, resolves if so
  private static validateFileExists(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const uri = vscode.Uri.file(path);
      vscode.workspace.fs.stat(uri).then(
        (stat) => {
          if (stat.type = vscode.FileType.File) {
            resolve();
          } else {
            reject();
          }
        },
        () => {
          reject();
        }
      );
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
        await this.set('path', path[0].fsPath, vscode.ConfigurationTarget.Global);
        this.validate();
      }
    });
  }

  // reads config file for htmlplayer path, sets cserverPath temporarily
  private static readConfig(contents: Uint8Array) {
    let text: string = new TextDecoder().decode(contents);
    // retrieve html player path
    let matches = text.match(/(?<=HTML_PLAYER=")(.*)(?=")/gm);
    if (matches) {
      const htmlplayer = matches[0].replace("${CERBERUSDIR}", this.get('path'));
      this.cserverPath = htmlplayer;
    }
  }
}