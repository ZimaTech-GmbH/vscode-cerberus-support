const html = `
const vscode = acquireVsCodeApi();
function navigateById(uid) {
  vscode.postMessage({command: 'navigateById', text: uid});
}
function navigate(ident) {
  vscode.postMessage({command: 'navigate', text: ident});
}
function navigateToHash(ident) {
  window.location.hash = ident;
}
function navInput(elem, event) {
  if (event.keyCode == 13) {
    navigate(elem.value);
  }
}
function searchInput(elem, event) {
  const query = elem.value;
  if (event.keyCode == 13) {
    vscode.postMessage({command: 'search', text: query});
  } else {
    const sbar = document.getElementById('searchbar');
    if (query != '') {
      sbar.className = '';
    } else {
      sbar.className = 'inactive';
    }
  }
}`;

export default html;