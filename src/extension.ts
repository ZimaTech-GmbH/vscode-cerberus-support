//zdoc ### src/extension.ts ###

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TextDecoder } from 'util';

import { CxDocumentSymbolProvider } from './features/documentSymbolProvider';
import { CxConfiguration } from './features/configuration';

var decls: any;
var curdecl: any;
var _webview: any;

/*zdoc
This function is called when the extension is activated.
See `package.json > "activationEvents"` for the definition of events that
activate the extension.

Checks the Cerberus X configuration and registers all handlers and providers.
zdoc*/
export function activate(context: vscode.ExtensionContext) {

	// register functions to be called once configuration is valid
	CxConfiguration.onConfigurationValid(() => {
		loadDecls();
	});

	// check if Cerberus X configuration is valid
	CxConfiguration.validate();

	vscode.workspace.onDidChangeConfiguration((event) => {
		CxConfiguration.validate();
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cerberus-x.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Cerberus X Support!');
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.commands.registerCommand('cerberus-x.showDocumentation', () => {
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
					localResourceRoots: [vscode.Uri.file( CxConfiguration.get('path') )]
				}
			)
			const onDiskPath: vscode.Uri = vscode.Uri.file("C:/Software/Cerberus/docs/html/data/mojo2/graphics/bb_additive.png");
			const imgSource: vscode.Uri = panel.webview.asWebviewUri(onDiskPath);
			// panel.webview.html = getWebviewContent(imgSource);

			_webview = panel.webview;
			panel.webview.html = getWebviewContent2();

			// simple navigation
			panel.webview.onDidReceiveMessage(
				message => {
					panel.webview.html = getWebviewContent2(message.text);
				}
			);
		})
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ scheme: 'file', language: 'cerberus-x' },
			new CxDocumentSymbolProvider()
		)
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent2( page: string = '' ) {
	let html: string;

	let d: any = curdecl;

	if (page == '') {
		curdecl = decls;
		d = curdecl;
	} else {
		curdecl = getDeclByUid(decls, page);
		d = curdecl;
	}

	let title: string = d.kind + ': ' + d.ident;
	let uid: string = d.uid;

	html = 
`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<base href="docs/html">
	<title>${title}</title>
	<script>
		const vscode = acquireVsCodeApi();
		function navigate(ident) {
			vscode.postMessage({command: 'alert', text: ident});
		}
	</script>
</head>
<body>
	<header>
		You are here 
`;
	// build navigation path
	let path: any[] = [d];
	let c = d;
	while (c.parent) {
		path.unshift(c.parent);
		c = c.parent;
	}
	for (const c of path) {
		html +=
`		&raquo;&nbsp;<span onClick="navigate('${c.uid}')" style="cursor: pointer;">${c.kind}: ${c.ident}</span>&emsp;
`;
	}
		
	html +=
`	</header>
	<h1>${title}</h1>
	<small>${uid}</small>
	<h2>Contents</h2>
	<ul>
`;
	
	if (d.childs) {
		for (let c of d.childs) {
			let target = c.target || c.uid;
			let content: string = c.ident;
			content = content.replace(/!\[([^\]]*)\]\(([^\)]*)\)/g, (match, p1, p2) => {
				const src = _webview.asWebviewUri(vscode.Uri.file(CxConfiguration.get('path') + '/docs/html/' + p2));
				return `<img alt="${p1}" src="${src}" />`;
			})
			html +=
`		<li onClick="navigate('${target}')">${c.uid}, ${c.kind}: ${content}</li>
`;
		}
	
	}
	
	html +=
`	</ul>
	</body>
</html>`;

	return html;
}

// load decls.json
function loadDecls() {
	const uri = vscode.Uri.file(CxConfiguration.get('path') + '/docs/html/decls.json');
	vscode.workspace.fs.readFile(uri).then(
		(contents) => {
			let d: any = JSON.parse(new TextDecoder().decode(contents));
			if (d.kind === "root") {
				// set global decls to currently loaded one
				decls = d;
				// current (navigated to) decls
				curdecl = decls;
				// set parent decl for every decl
				setThisChildsParentDecl(decls);
				vscode.window.showInformationMessage('Cerberus X decls loaded');
			}
		},
		(err) => {
			vscode.window.showErrorMessage(err.message, 'Rebuild Help');
		}
	);
}

function setThisChildsParentDecl(decl: any): void {
	if (!decl.childs) return;
	// set parent decl for every decl
	for (const c of decl.childs) {
		c.parent = decl;
		setThisChildsParentDecl(c);
	}
}

function getDeclByUid(decl: any, uid: string): any {
	if (decl.uid === uid) return decl;
	if (!decl.childs) return null;
	for (const c of decl.childs) {
		if (c.uid === uid) {
			return c;
		}
		const d = getDeclByUid(c, uid);
		if (d) return d;
	}
	return null;
}