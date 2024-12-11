import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import { EditorView, NodeViewConstructor } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";
import editorKeymap from "@/lib/prosemirror/keymap";
import markdownParser from "@/lib/prosemirror/plugins/parser";
import floatingToolbar from "@/lib/prosemirror/plugins/floating-toolbar";
import footnoter from "@/lib/prosemirror/plugins/footnotes";
import listItemDecorator from "@/lib/prosemirror/plugins/list-checkbox";
import textShortcuts from "@/lib/prosemirror/plugins/text-shortcuts";
import transformer from "@/lib/prosemirror/plugins/transformer";
import CodeBlockView from "@/lib/prosemirror/views/code-view";
import HTMLView from "@/lib/prosemirror/views/html-view";
import ParagraphView from "@/lib/prosemirror/views/paragraph-view";
import "katex/dist/katex.min.css";
import MathBlockView from "@/lib/prosemirror/views/math-block-view";

const nodeViews: { [key: string]: NodeViewConstructor } = {
	paragraph(node, view, getPos) {
		return new ParagraphView(node, view, getPos);
	},
	code(node, view, getPos) {
		return new CodeBlockView(node, view, getPos, mdSchema);
	},
	html(node, view, getPos) {
		return new HTMLView(node, view, getPos, mdSchema);
	},
	math_block(node, view, getPos) {
		return new MathBlockView(node, view, getPos, mdSchema);
	}
};

const editorInitialState = EditorState.create({
	schema: mdSchema,
	plugins: [
		history(),
		keymap(editorKeymap(mdSchema)),
		markdownParser,
		transformer,
		textShortcuts,
		listItemDecorator,
		footnoter,
		tableEditing(),
		floatingToolbar,
	],
});

const editorRoot = document.getElementById("editor");
const view = new EditorView(editorRoot, {
	state: editorInitialState,
	nodeViews,
	attributes: {
		class: "md-editor",
		autofocus: "true",
	},
});
view.focus();


