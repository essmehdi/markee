import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView as CodeMirror, keymap as cmKeymap, drawSelection } from "@codemirror/view";
import { Node, Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import SyncedCodeMirrorView from "./synced-codemirror-view";
import { autoCloseTags, html } from "@codemirror/lang-html"

/**
 * Provides the node view for the HTML block. When focused, it shows
 * HTML editor. If not, the rendered HTML is displayed
 */
export default class HTMLView extends SyncedCodeMirrorView {
	private container: HTMLDivElement;
	private renderedHTMLContainer: HTMLDivElement;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined, mdSchema: Schema) {
		super(node, view, getPos, mdSchema);

		// HTML editor
		this.cm = new CodeMirror({
			doc: this.node.textContent,
			extensions: [
				cmKeymap.of([...this.codeMirrorKeymap(), ...defaultKeymap, indentWithTab]),
				drawSelection(),
				syntaxHighlighting(defaultHighlightStyle),
				html(),
				autoCloseTags,
				CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
			],
		});

		// Rendered HTML block
		this.renderedHTMLContainer = document.createElement("div");
		this.renderedHTMLContainer.innerHTML = this.node.textContent.trim();
		this.renderedHTMLContainer.classList.add("md-html-block-render")

		this.container = document.createElement("div");
		this.container.appendChild(this.cm.dom);
		this.container.appendChild(this.renderedHTMLContainer);

		this.dom = this.container;
		this.dom.classList.add("md-block", "md-html-block-editor");
	}

	override update(node: Node): boolean {
		const handledUpdate = super.update(node);
		if (handledUpdate) {
			this.renderedHTMLContainer.innerHTML = node.textContent.trim();
		}
		return handledUpdate;
	}
}
