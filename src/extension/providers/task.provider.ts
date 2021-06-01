import * as vscode from 'vscode';
import { CxConfiguration } from '../features/configuration/configuration.feature';

export class CxTaskProvider implements vscode.TaskProvider {
  public provideTasks(token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
    const tasks: vscode.Task[] = [];

    // build documentation
    // const path = CxConfiguration.get('path') + '/bin/makedocs_winnt.exe';
    // const exec = new vscode.ShellExecution(path);
    // tasks.push(new vscode.Task(
    //   {
    //     type: 'makedocs'
    //   },
    //   vscode.TaskScope.Workspace,
    //   'Rebuild documentation',
    //   'Cerberus X',
    //   exec
    // ));

    return tasks;
  }

  public resolveTask() {
    return undefined;
  }
}