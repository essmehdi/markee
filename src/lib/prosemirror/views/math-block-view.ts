import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import {
	StreamLanguage,
	defaultHighlightStyle,
	syntaxHighlighting,
} from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import {
	EditorView as CodeMirror,
	keymap as cmKeymap,
	drawSelection,
} from "@codemirror/view";
import katex from "katex";
import { Node, Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import SyncedCodeMirrorView from "./synced-codemirror-view";

/**
 * Provides the node view for the HTML block. When focused, it shows
 * HTML editor. If not, the rendered HTML is displayed
 */
export default class MathBlockView extends SyncedCodeMirrorView {
	private container: HTMLDivElement;
	private renderedMathContainer: HTMLDivElement;

	constructor(
		node: Node,
		view: EditorView,
		getPos: () => number | undefined,
		mdSchema: Schema
	) {
		super(node, view, getPos, mdSchema);

		// HTML editor
		this.cm = new CodeMirror({
			doc: this.node.textContent,
			extensions: [
				cmKeymap.of([
					...this.codeMirrorKeymap(),
					...defaultKeymap,
					indentWithTab,
				]),
				drawSelection(),
				syntaxHighlighting(defaultHighlightStyle),
				StreamLanguage.define(stex),
				CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
			],
		});

		// Rendered HTML block
		this.renderedMathContainer = document.createElement("div");
		this.renderedMathContainer.classList.add("md-math-block-render");
		this.renderMath(this.node.textContent);

		this.container = document.createElement("div");
		this.container.appendChild(this.cm.dom);
		this.container.appendChild(this.renderedMathContainer);

		this.dom = this.container;
		this.dom.classList.add("md-block", "md-math-block-editor");
	}

	override update(node: Node): boolean {
		const handledUpdate = super.update(node);
		if (handledUpdate) {
			this.renderMath(node.textContent);
		}
		return handledUpdate;
	}

	renderMath(math: string) {
		math = math.trim();
		katex.render(math === "" ? "<Empty>" : math, this.renderedMathContainer, {
			displayMode: true,
			throwOnError: false,
		});
	}
}
