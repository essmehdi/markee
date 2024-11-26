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
	private titleClass: string | null = null;
	private editorView: EditorView;
	private getPosition: () => number | undefined;

	constructor(node: Node, editorView: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.dom = this.contentDOM = document.createElement("p");
		this.dom.classList.add("md-block");
		// this.dom.setAttribute("extends-previous", node.attrs.extendsPrevious);
		this.editorView = editorView;
		this.getPosition = getPos;
//		this.handleTitles(node);
	}

//	update(node: Node): boolean {
//		if (node.type.name !== "paragraph") return false;
//
//		this.handleTitles(node);
//
//		return true;
//	}

	/**
	 * Detects if the paragraph is a title and applies correct styling
	 * @param node Forwarded node from update function
	 */
	handleTitles(node: Node): void {
		const titleMatch = node.textContent.match(/^(#{1,6})\s+[^\s]+/);

		// Cleanup title classes
		this.dom.classList.remove("md-title");
		if (this.titleClass !== null) {
			this.dom.classList.remove(this.titleClass);
		}

		// Add appropriate classes if title
		if (titleMatch) {
			this.titleClass = `md-title-${titleMatch[1].length}`;
			this.dom.classList.add("md-title", this.titleClass);
		}
	}
}
