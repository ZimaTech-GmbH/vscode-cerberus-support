
import * as childProcess from 'child_process';
import { CxExtension } from '../../cerberusx.extension';

export class CxChildProcess {
  /**
   * Spawns a new child process and outputs stdout and stderr data
   * @param title How the process is described in output
   * @param paths Paths to list, e.g. {transcc: 'path/there'}
   * @param command command to execute
   * @param args command arguments
   * @returns a promise resolving when the process finished
   */
  public static spawn(title: string, paths: {[name: string]: string}, command: string, args: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      CxExtension.output.show();
      CxExtension.output.appendLine('');
      CxExtension.output.appendLine('');
      CxExtension.output.appendLine(title);
      for (const key in paths) {
        CxExtension.output.appendLine(key + ' path: ' + paths[key]);
      }

      const process = childProcess.spawn(command, args);
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
}
