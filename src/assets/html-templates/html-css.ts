const html = `
html {
  color: var(--vscode-editor-foreground, var(--theme-foreground));
  font-family: var(--vscode-font-family, var(--theme-font-family));
  font-weight: var(--vscode-font-weight, var(--theme-font-weight));
  font-size: var(--vscode-font-size, var(--theme-font-size));
}
body {
  padding: 0;
}
main {
  padding: 0.5rem 1.5rem;
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
  width: 100%;
  table-layout: fixed;
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
table th:first-child, table td:first-child {
  width: 27%;
}
table th:not(:first-child), table td:not(:first-child) {
  width: auto;
}
table th {
	vertical-align: bottom;
}

hr {
  border: unset;
  border-top: 1px solid var(--vscode-textSeparator-foreground);
}

.multicolumn{
	column-width: 15rem;
	column-gap: 4rem;
  column-rule: 1px solid var(--vscode-textSeparator-foreground);
}
[onClick] {
  cursor: pointer;
}
a[name] {
  position: relative;
  top: -3rem;
}
#browser {
  display: grid;
  grid-template-columns: 8rem 2rem 2rem 1fr 13rem;
  grid-gap: 1rem;
  position: fixed;
  box-sizing: border-box;
  top: 0;
  padding: 0.5rem 1.5rem;
  width: 100%;
  background: var(--vscode-titleBar-activeBackground);
  z-index: 9999;
}
#browser svg {
  position: absolute;
  margin-top: 0.2rem;
  height: 1.6rem;
}
#browser svg>path {
  fill: var(--vscode-titleBar-activeForeground)
}
#browser .inactive svg>path {
  fill-opacity: 0.2;
}
#browser #logo>svg {
  margin-top: -0.2rem;
  margin-bottom: -0.2rem;
  height: 2.4rem;
}
#browser #navback,
#browser #navfwd {
  cursor: pointer;
}
#browser #addressbar,
#browser #searchbar {
  position: relative;
  height: 2rem;
}
#browser #addressbar>input,
#browser #searchbar>input {
  all: unset;
  box-sizing: border-box;
  padding: 0 1rem;
  width: 100%;
  height: 2rem;
  background: var(--vscode-settings-textInputBackground);
  border: 0.2px solid var(--vscode-settings-textInputForeground);
  border-radius: 2rem;
  color: var(--vscode-settings-textInputForeground);
}
#browser #addressbar>input:focus,
#browser #searchbar>input:focus {
  outline: unset;
  box-shadow: inset 0 0 1px 1px var(--vscode-settings-textInputForeground);
}
#browser #searchbar>input {
  padding-right: 3rem;
}
#browser #searchbar>svg {
  position: absolute;
  right: 0.5rem;
  top: 0;
}
#browser #addressbar .location {
  position: absolute;
  top: 0.1rem;
  left: 0;
  margin: 0 1rem;
  max-width: calc(100% - 2rem);
  padding-right: 0.1rem;
  height: 1.8rem;
  overflow: hidden;
  line-height: 1.8rem;
  background: var(--vscode-settings-textInputBackground);
  color: var(--vscode-settings-textInputForeground);
}
#browser #addressbar:focus-within .location {
  display: none;
}
#menu {
  display: flex;
  margin-top: 3rem;
  padding: 0 1.5rem;
  background: var(--vscode-tab-inactiveBackground);
}
#menu>div {
  display: inline-block;
  margin-right: -1px;
  padding: 0.5rem 1rem;
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

.decl:last-child {
  min-height: 100vh;
}

.title {
  padding-top: 4rem;
}
.title h1 {
  margin: 0 -0.5rem;
  border: 1px solid var(--color);
  border-radius: 0.4rem;
  padding: 0.5rem;
  background: var(--vscode-textCodeBlock-background);
  font-size: var(--vscode-editor-font-size);
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  color: var(--color);
}
.subtitle {
}
.title h1 span {
  opacity: 0.5;
}

.property-icon {
  display: inline-block;
  vertical-align: -0.2em;
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

.toc {
  margin: 0 -0.5rem;
  width: calc(100% + 1rem);
  border-collapse: separate;
}
.toc th,
.toc td {
  position: relative;
  padding: 0.5rem;
  border: unset;
  border-right: 1px solid var(--vscode-textSeparator-foreground);
  border-bottom: 1px solid var(--vscode-textSeparator-foreground);
}
.toc th {
  border-top: 1px solid var(--vscode-textSeparator-foreground);
}
.toc th:first-child {
  border-left: 1px solid var(--vscode-textSeparator-foreground);
  border-top-left-radius: 0.4rem;
}
.toc td:first-child {
  border-left: 1px solid var(--vscode-textSeparator-foreground);
}
.toc th:last-child {
  border-top-right-radius: 0.4rem;
}
.toc tr:last-child td:first-child {
  border-bottom-left-radius: 0.4rem;
}
.toc tr:last-child td:last-child {
  border-bottom-right-radius: 0.4rem;
}

.content-ruler {
  margin: 2rem -0.5rem;
}

`;

export default html;