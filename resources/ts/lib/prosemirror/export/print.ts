import { EditorView } from "prosemirror-view";

function setDuplicateStyles(duplicateDoc: HTMLElement) {
	duplicateDoc.classList.add("exported");
	duplicateDoc.style.padding = "0";
	duplicateDoc.style.margin = "0";
	duplicateDoc.style.position = "fixed";
	duplicateDoc.style.top = "0";
	duplicateDoc.style.left = "0";
	duplicateDoc.style.zIndex = "-1";
	duplicateDoc.style.visibility = "hidden";
}

export function browserPrint(editorView: EditorView) {
	const duplicateDoc = editorView.dom.cloneNode(true) as HTMLElement;
	document.body.appendChild(duplicateDoc);
	setDuplicateStyles(duplicateDoc);

	duplicateDoc.querySelectorAll(".md-punctuation").forEach((el) => el.remove());

	window.print();

	duplicateDoc.remove();
}
