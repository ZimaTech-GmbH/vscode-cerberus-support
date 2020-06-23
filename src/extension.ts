// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

import { CxDocumentSymbolProvider } from './features/documentSymbolProvider';

var decls: any;
var curdecl: any;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-cerberusx-support" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-cerberusx-support.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Cerberus X Support!');
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-cerberusx-support.showDocumentation', () => {
			// Create web panel
			let panel = vscode.window.createWebviewPanel(
				'cxDocumentation',
				'Cerberus X Documentation',
				{
					viewColumn: vscode.ViewColumn.Two,
					preserveFocus: true
				},
				{
					retainContextWhenHidden: true,
					enableScripts: true,
					enableCommandUris: true,
					enableFindWidget: true,
					localResourceRoots: [vscode.Uri.parse( "file://C:/Software/Cerberus/docs/html", true )]
				}
			)
			const onDiskPath: vscode.Uri = vscode.Uri.file("C:/Software/Cerberus/docs/html/data/mojo2/graphics/bb_additive.png");
			const imgSource: vscode.Uri = panel.webview.asWebviewUri(onDiskPath);
			// panel.webview.html = getWebviewContent(imgSource);

			panel.webview.html = getWebviewContent2();

			// panel.webview.onDidReceiveMessage(
			// 	message => {
			// 		vscode.window.showErrorMessage(message.text);
			// 		console.log(message);
			// 	},
			// 	undefined,
			// 	context.subscriptions
			// );
			panel.webview.onDidReceiveMessage(
				message => {
					panel.webview.html = getWebviewContent2(message.text);
				}
			);
		})
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ scheme: 'file', language: 'cerberus' },
			new CxDocumentSymbolProvider()
		)
	);

	loadDecls();
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(imgSource: vscode.Uri) {

	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <img src="${imgSource}" width="300" />
  </body>
  </html>`;
}

function getWebviewContent2( page: string = '' ) {
	let html: string;

	let d: any = curdecl;

	// navigate
	if (d.uid != page) {
		for (let c of d.childs) {
			if (c.uid === page) {
				curdecl = c;
				d = curdecl;
				break;
			}
		}
	}

	let title: string = d.kind + ': ' + d.ident;
	let uid: string = d.uid;

	html = 
`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
	<script>
		const vscode = acquireVsCodeApi();
		function navigate(ident) {
			vscode.postMessage({command: 'alert', text: ident});
		}
	</script>
</head>
<body>
	<h1>${title}</h1>
	<small>${uid}</small>
	<h2>Contents</h2>
	<ul>
`;
	
	for (let c of d.childs) {
		html +=
`		<li onClick="navigate('${c.uid}')">${c.kind}: ${c.ident}</li>
`;
	}

	html +=
`	</ul>
	</body>
</html>`;

	return html;
}

// load decls.json
function loadDecls() {
	fs.readFile('C:\\Software\\Cerberus\\docs\\html\\decls.json', 'utf8', (err, data) => {
		if (err) {
			vscode.window.showErrorMessage(err.message);
		} else if (data) {
			let d: any = JSON.parse(data);
			if (d.kind === "root") {
				decls = d;
				curdecl = decls;
				vscode.window.showInformationMessage('Cerberus X decls loaded');
			}
		}
	})
}