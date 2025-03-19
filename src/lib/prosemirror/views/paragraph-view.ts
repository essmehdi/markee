import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

/**
 * Paragraph view
 * Styles itself for titles if necessary
 */
export default class ParagraphView {
	public static CODE_BLOCK = /```([^`].*?)\n(.*\n)?```/;

	private node: Node;
	public dom: HTMLParagraphElement;
	public contentDOM: HTMLParagraphElement;

	constructor(node: Node, editorView: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.dom = this.contentDOM = document.createElement("p");
		this.dom.classList.add("md-block");
	}
}
