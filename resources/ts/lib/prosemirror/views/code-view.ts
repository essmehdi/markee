import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView as CodeMirror, keymap as cmKeymap, drawSelection, showPanel } from "@codemirror/view";

import { languages } from "@codemirror/language-data";
import { Compartment } from "@codemirror/state";
import { Node, Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import SyncedCodeMirrorView from "./synced-codemirror-view";

/**
 * Code block view to render CodeMirror for Markdown code blocks
 */
export default class CodeBlockView extends SyncedCodeMirrorView {
	protected currentLanguage: Compartment = new Compartment();
	private selector!: HTMLInputElement;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined, mdSchema: Schema) {
		super(node, view, getPos, mdSchema);
		this.cm = new CodeMirror({
			doc: this.node.textContent,
			extensions: [
				cmKeymap.of([...this.codeMirrorKeymap(), ...defaultKeymap, indentWithTab]),
				drawSelection(),
				this.currentLanguage.of([]),
				syntaxHighlighting(defaultHighlightStyle),
				CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
				showPanel.of(this.createLanguageSelector(node.attrs.language ?? "")),
			],
		});

		this.dom = this.cm.dom;
		this.dom.classList.add("md-block");
	}

	createLanguageSelector(initialLang: string) {
		this.selector = document.createElement("input") as HTMLInputElement;
		this.selector.className = "cm-code-lang";
		this.selector.addEventListener("change", (event) => {
			this.handleLanguageSelection((event.target as HTMLInputElement).value);
		});
		if (initialLang) {
			this.selector.value = initialLang;
			this.handleLanguageSelection(initialLang);
		}
		return () => ({ dom: this.selector });
	}

	async handleLanguageSelection(lang: string) {
		const languageDescription = lang !== "" ? languages.find((language) => language.alias.includes(lang.trim())) : null;
		if (languageDescription) {
			const languageSupport = await languageDescription.load();
			this.selector.value = lang;
			this.cm.dispatch({
				effects: [this.currentLanguage.reconfigure(languageSupport)],
			});
		}
	}

	update(node: Node) {
		const handled = super.update(node);
		if (handled) {
			this.handleLanguageSelection(node.attrs.language ?? "");
		}
		return handled;
	}
}
