import { editorInitialState, nodeViews } from "~/components/editor";
import { EditorView } from "prosemirror-view";

export function setupEditor() {
  const editorDom = document.createElement("div");

  const editorView = new EditorView(editorDom, {
    state: editorInitialState,
    nodeViews,
  });

  return {
    editorView,
    cleanup: () => {
      editorView.destroy();
      editorDom.remove();
    },
  };
}
