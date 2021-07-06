import * as vscode from 'vscode';

import { CxExtension } from '../../cerberusx.extension';
import { CxConfiguration } from '../configuration/configuration.feature';
import { CxChildProcess } from '../child-process/child-process.feature';

/**
 * Different Cerberus X builders
 */
export class CxBuilder {

  /** returns currently active build file or empty string if not defined */
  public static cerberusGetBuildFile(): string {
    if (vscode.window.activeTextEditor?.document) {
      return vscode.window.activeTextEditor.document.uri.fsPath;
    }
    return "";
  }

  /**
   * Builds HTML5 game
   * @returns Promise resolving on success
   */
  public static buildHtml(): Promise<void> {
    const file = this.cerberusGetBuildFile();
    if (file) {
      return this.build(file, ['-target="Html5_Game"']);
    } else {
      CxExtension.output.appendLine('No file in editor selected for build');
      return Promise.reject();
    }
  }
  
  /**
   * Generic build, invokes `transcc`
   * @param file path to file to build
   * @param args compiler flags
   * @returns Promise resolving on success
   */
  public static build(file: string, args: string[]): Promise<void> {
    const title = 'Building: ' + file;
    const transccPath: string = CxConfiguration.transccPath || 'undefined';
    const paths = {'transcc': transccPath};
    args = [...args, file];
    return CxChildProcess.spawn(title, paths, transccPath, args);
  }

  /**
   * Runs HTML5 game
   * @returns Promise resolving on success
   */
  public static runHtml(): Promise<void> {
    const file = this.cerberusGetBuildFile();
    if (file) {
      return this.build(file, ['-target="Html5_Game"']).then(() => {
        const cserverPath: string = CxConfiguration.cserverPath || 'undefined';
        const gamePath = file.replace(/cxs$/,
          'build' + CxConfiguration.version + '/html5/CerberusGame.html'
        );
        const title = 'Running: ' + gamePath;
        const paths = {'cserver': cserverPath};
        const args: string[] = [gamePath];
        return CxChildProcess.spawn(title, paths, cserverPath, args)
      });
    } else {
      CxExtension.output.appendLine('No file in editor selected for build');
      return Promise.reject();
    }    
  }

}