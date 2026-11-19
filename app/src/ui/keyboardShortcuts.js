// Keyboard shortcuts: undo/redo, export, surprise, and the help overlay.
// Typing in a text field must never trigger a shortcut, so inputs bail out.

export function bindShortcuts(actions) {
  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault(); actions.undo(); return;
    }
    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
      event.preventDefault(); actions.redo(); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault(); actions.exportPng(); return;
    }
    if (typing) return;
    if (event.key === "?") { actions.toggleHelp(); return; }
    if (event.key.toLowerCase() === "r" && !event.ctrlKey && !event.metaKey) { actions.surprise(); return; }
    if (event.key === "Escape") actions.closeHelp();
  });
}
