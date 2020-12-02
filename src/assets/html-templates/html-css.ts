const html = `
body {
  padding: 0;
}
main {
  padding: 0.5em 1.5em;
}
img {
  width: unset;
  height: unset;
}

div.pretty {
  padding: 0.5rem 1rem;
  background: var(--vscode-textCodeBlock-background);
  tab-size: 4;
}
div.pretty code {
  white-space: pre-wrap;
}
div.pretty code.d {
  color: var(--vscode-symbolIcon-textForeground);
}
div.pretty code.k {
  color: var(--vscode-symbolIcon-functionForeground);
}
div.pretty code.i {
  color: var(--vscode-symbolIcon-variableForeground);
}
div.pretty code.l {
  color: var(--vscode-symbolIcon-constantForeground);
}
div.pretty code.r {
}

table {
	border-collapse: collapse;
	border-spacing: 0;
}
table tr:nth-child(even) td::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--vscode-editor-foreground);
  opacity: 0.05;
  z-index: -1;
}
table th, table td {
  position: relative;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vscode-textSeparator-foreground);
	text-align: left;
	vertical-align: top;
}
table th {
	vertical-align: bottom;
}

hr {
  border: unset;
  border-top: 1px solid var(--vscode-textSeparator-foreground);
}

.multicolumn{
	column-width: 15em;
	column-gap: 4em;
  column-rule: 1px solid var(--vscode-textSeparator-foreground);
}
[onClick] {
  cursor: pointer;
}
a[name] {
  position: relative;
  top: -3em;
}
#browser {
  display: grid;
  grid-template-columns: 8em 2em 2em 1fr 13em;
  grid-gap: 1em;
  position: fixed;
  box-sizing: border-box;
  top: 0;
  padding: 0.5em 1.5em;
  width: 100%;
  background: var(--vscode-titleBar-activeBackground);
  z-index: 9999;
}
#browser svg {
  position: absolute;
  margin-top: 0.2em;
  height: 1.6em;
}
#browser svg>path {
  fill: var(--vscode-titleBar-activeForeground)
}
#browser .inactive svg>path {
  fill-opacity: 0.2;
}
#browser #logo>svg {
  margin-top: -0.2em;
  margin-bottom: -0.2em;
  height: 2.4em;
}
#browser #navback,
#browser #navfwd {
  cursor: pointer;
}
#browser #addressbar,
#browser #searchbar {
  position: relative;
  height: 2em;
}
#browser #addressbar>input,
#browser #searchbar>input {
  all: unset;
  box-sizing: border-box;
  padding: 0 1em;
  width: 100%;
  height: 2em;
  background: var(--vscode-settings-textInputBackground);
  border: 0.2px solid var(--vscode-settings-textInputForeground);
  border-radius: 2em;
  color: var(--vscode-settings-textInputForeground);
}
#browser #addressbar>input:focus,
#browser #searchbar>input:focus {
  outline: unset;
  box-shadow: inset 0 0 1px 1px var(--vscode-settings-textInputForeground);
}
#browser #searchbar>input {
  padding-right: 3em;
}
#browser #searchbar>svg {
  position: absolute;
  right: 0.5em;
  top: 0;
}
#browser #addressbar .location {
  position: absolute;
  top: 0.1em;
  left: 0;
  margin: 0 1em;
  max-width: calc(100% - 2em);
  padding-right: 0.1em;
  height: 1.8em;
  overflow: hidden;
  line-height: 1.8em;
  background: var(--vscode-settings-textInputBackground);
  color: var(--vscode-settings-textInputForeground);
}
#browser #addressbar:focus-within .location {
  display: none;
}
#menu {
  display: flex;
  margin-top: 3em;
  padding: 0 1.5em;
  background: var(--vscode-tab-inactiveBackground);
}
#menu>div {
  display: inline-block;
  margin-right: -1px;
  padding: 0.5em 1em;
  border: 1px solid var(--vscode-tab-border);
  border-top: none;
  border-bottom: none;
  background: var(--vscode-tab-inactiveBackground);
  color: var(--vscode-tab-inactiveForeground);
  text-transform: uppercase;
}
#menu>div.active {
  background: var(--vscode-tab-activeBackground);
  color: var(--vscode-tab-activeForeground);
}

.title h1 {
  margin: 0 -0.5rem;
  border: 1px solid var(--color);
  border-radius: 0.4rem;
  padding: 0.5rem;
  background: var(--vscode-textCodeBlock-background);
  font-size: 1.2em;
}
.subtitle {
}
.title h1 span {
  opacity: 0.5;
}

.property-icon {
  display: inline-block;
  font-weight: normal;
  margin-right: 0.2em;
  width: 1em;
  height: 1em;
  min-width: 14px;
  min-height: 14px;
  color: var(--color);
}
.property-icon * {
  fill: none;
  stroke: var(--color);
  stroke-width: 2;
}
`;

export default html;