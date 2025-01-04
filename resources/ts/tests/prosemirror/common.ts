import { editorInitialState, nodeViews } from "@/Pages/Editor";
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