import { EditorView as CodeMirror, ViewUpdate } from "@codemirror/view";

import { Compartment } from "@codemirror/state";
import { exitCode } from "prosemirror-commands";
import { redo, undo } from "prosemirror-history";
import { Node, Schema } from "prosemirror-model";
import { Selection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import mdSchema from "../editor-schema";

/**
 * Code block view to render CodeMirror for Markdown code blocks
 */
export default abstract class SyncedCodeMirrorView {
	protected node: Node;
	protected view: EditorView;
	protected cm!: CodeMirror; // Will be defined in concrete class
	protected updating: boolean;
	protected getPos: () => number | undefined;
	protected schema: Schema;
	protected currentLanguage: Compartment = new Compartment();

	public dom!: HTMLElement; // Will be defined in concrete class

	constructor(node: Node, view: EditorView, getPos: () => number | undefined, mdSchema: Schema) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.schema = mdSchema;

		this.updating = false;
	}

	forwardUpdate(update: ViewUpdate) {
		if (this.updating || !this.cm.hasFocus) return;
		let offset = (this.getPos() ?? 0) + 1,
			{ main } = update.state.selection;
		const selFrom = offset + main.from,
			selTo = offset + main.to;
		const pmSel = this.view.state.selection;
		if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
			const tr = this.view.state.tr;
			update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
				if (text.length) tr.replaceWith(offset + fromA, offset + toA, this.schema.text(text.toString()));
				else tr.delete(offset + fromA, offset + toA);
				offset += toB - fromB - (toA - fromA);
			});
			tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
			this.view.dispatch(tr);
		}
	}

	setSelection(anchor: number, head?: number) {
		this.cm.focus();
		this.updating = true;
		this.cm.dispatch({ selection: { anchor, head } });
		this.updating = false;
	}

	codeMirrorKeymap() {
		const view = this.view;
		return [
			{ key: "Backspace", run: () => this.maybeDelete() ?? false },
			{ key: "ArrowUp", run: () => this.maybeEscape("line", -1) ?? false },
			{ key: "ArrowLeft", run: () => this.maybeEscape("char", -1) ?? false },
			{ key: "ArrowDown", run: () => this.maybeEscape("line", 1) ?? false },
			{ key: "ArrowRight", run: () => this.maybeEscape("char", 1) ?? false },
			{
				key: "Ctrl-Enter",
				run: () => {
					const eCode = exitCode(view.state, view.dispatch);
					if (!eCode) return false;
					view.focus();
					return true;
				},
			},
			{ key: "Ctrl-z", mac: "Cmd-z", run: () => undo(view.state, view.dispatch) },
			{ key: "Shift-Ctrl-z", mac: "Shift-Cmd-z", run: () => redo(view.state, view.dispatch) },
			{ key: "Ctrl-y", mac: "Cmd-y", run: () => redo(view.state, view.dispatch) },
		];
	}

	maybeDelete() {
		const { state } = this.cm,
			{ main } = state.selection;
		if (!main.empty) return false;
		if (main.from > 0) return false;

		const tr = this.view.state.tr;
		const targetPos = this.getPos() ?? 0;
		tr.setBlockType(
			targetPos,
			targetPos + this.node.nodeSize,
			(this.view.state.schema as typeof mdSchema).nodes.paragraph
		);
		this.view.dispatch(tr);
		this.view.focus();
		return true;
	}

	maybeEscape(unit: string, dir: number) {
		const { state } = this.cm;
		let main = state.selection.main;
		if (!main.empty) return false;
		if (unit === "line") main = state.doc.lineAt(main.head);
		if (dir < 0 ? main.from > 0 : main.to < state.doc.length) return false;
		const targetPos = (this.getPos() ?? 0) + (dir < 0 ? 0 : this.node.nodeSize);
		const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
		const tr = this.view.state.tr.setSelection(selection).scrollIntoView();
		this.view.dispatch(tr);
		this.view.focus();
	}

	update(node: Node) {
		if (node.type != this.node.type) return false;
		this.node = node;
		if (this.updating) return true;
		const newText = node.textContent,
			curText = this.cm.state.doc.toString();
		if (newText != curText) {
			let start = 0,
				curEnd = curText.length,
				newEnd = newText.length;
			while (start < curEnd && curText.charCodeAt(start) == newText.charCodeAt(start)) {
				++start;
			}
			while (
				curEnd > start &&
				newEnd > start &&
				curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
			) {
				curEnd--;
				newEnd--;
			}
			this.updating = true;
			this.cm.dispatch({
				changes: {
					from: start,
					to: curEnd,
					insert: newText.slice(start, newEnd),
				},
			});
			this.updating = false;
		}
		return true;
	}

	selectNode() {
		this.cm.focus();
	}

	stopEvent() {
		return true;
	}
}
