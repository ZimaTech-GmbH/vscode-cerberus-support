import * as vscode from 'vscode';
import * as childProcess from 'child_process';

import { CxExtension } from '../../cerberusx.extension';
import { CxConfiguration } from '../configuration/configuration.feature';

export class CxBuilder {

  /** returns currently active build file or empty string if not defined */
  public static cerberusGetBuildFile(): string {
    if (vscode.window.activeTextEditor?.document) {
      return vscode.window.activeTextEditor.document.uri.fsPath;
    }
    return "";
  }

  public static buildHtml(): Promise<void> {
    const file = this.cerberusGetBuildFile();
    if (file) {
      return this.build(file, ['-target="Html5_Game"']);
    } else {
      CxExtension.output.appendLine('No file in editor selected for build');
      return Promise.reject();
    }
  }
  
  public static build(file: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transccPath: string = CxConfiguration.get('transccPath');
      CxExtension.output.show();
      CxExtension.output.appendLine('Building: ' + file);
      CxExtension.output.appendLine('transcc path: ' + transccPath);

      args = [...args, file];

      const process = childProcess.spawn(transccPath, args);
      process.stdout.on('data', (data) => {
        CxExtension.output.appendLine(data.toString());
      });
      process.stderr.on('data', (data) => {
        CxExtension.output.appendLine(data.toString());
      });
      process.on('exit', (code) => {
        CxExtension.output.appendLine('Process terminated.')
        if (code) {
          CxExtension.output.appendLine('Exit code: ' + code);
        }
        resolve();
      });
    });
  }

  public static runHtml(): Promise<void> {
    const file = this.cerberusGetBuildFile();
    if (file) {
      return this.build(file, ['-target="Html5_Game"']).then(() => {
        const cserverPath: string = CxConfiguration.get('cserverPath');
        const gamePath = file.replace(/cxs$/,
          'build' + CxConfiguration.version + '/html5/CerberusGame.html'
        );
        CxExtension.output.show();
        CxExtension.output.appendLine('Running: ' + gamePath);
        CxExtension.output.appendLine('cserver path: ' + cserverPath);

        const args: string[] = [gamePath];

        const process = childProcess.spawn(cserverPath, args);
        process.stdout.on('data', (data) => {
          CxExtension.output.appendLine(data.toString());
        });
        process.stderr.on('data', (data) => {
          CxExtension.output.appendLine(data.toString());
        });
        process.on('exit', (code) => {
          CxExtension.output.appendLine('Process terminated.')
          if (code) {
            CxExtension.output.appendLine('Exit code: ' + code);
          }
        });
      });
    } else {
      CxExtension.output.appendLine('No file in editor selected for build');
      return Promise.reject();
    }    
  }

}