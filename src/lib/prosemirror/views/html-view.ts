import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView as CodeMirror, keymap as cmKeymap, drawSelection } from "@codemirror/view";
import { Node, Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import SyncedCodeMirrorView from "./synced-codemirror-view";
import { autoCloseTags, html } from "@codemirror/lang-html";
import DOMPurify from "dompurify";

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
		this.renderHTML(this.node.textContent);
		this.renderedHTMLContainer.classList.add("md-html-block-render");

		this.container = document.createElement("div");
		this.container.appendChild(this.cm.dom);
		this.container.appendChild(this.renderedHTMLContainer);

		this.dom = this.container;
		this.dom.classList.add("md-block", "md-html-block-editor");
	}

	override update(node: Node): boolean {
		const handledUpdate = super.update(node);
		if (handledUpdate) {
			this.renderHTML(node.textContent);
		}
		return handledUpdate;
	}

	renderHTML(html: string) {
		const sanitizedHTML = this.sanitizeHTML(html);
		this.renderedHTMLContainer.innerHTML = sanitizedHTML.trim();
		this.processHTML();
	}

	sanitizeHTML(html: string): string {
		const dom = document.createElement("div");
		dom.innerHTML = html;
		const childrenElements = dom.getElementsByTagName("*");
		for (let i = 0; i < childrenElements.length; i++) {
			if (childrenElements[i].innerHTML) {
				childrenElements[i].innerHTML = childrenElements[i].innerHTML.trim();
			}
		}
		html = dom.innerHTML;

		const purified = DOMPurify.sanitize(html, {
			FORBID_TAGS: ["picture", "source"],
		});

		return purified;
	}

	processHTML() {
		const pictures = this.renderedHTMLContainer.querySelectorAll("picture");
		for (let i = 0; i < pictures.length; i++) {
			const picture = pictures[i];
			const pictureParent = picture.parentElement!;
			const img = picture.querySelector("img");
			if (img) {
				pictureParent.insertBefore(img, picture);
				pictureParent.removeChild(picture);
			}
		}
	}
}
