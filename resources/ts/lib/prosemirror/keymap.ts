import {
	baseKeymap,
	chainCommands,
	createParagraphNear,
	liftEmptyBlock,
	newlineInCode,
	setBlockType,
	splitBlock,
	wrapIn,
} from "prosemirror-commands";
import { redo, undo } from "prosemirror-history";
import { Fragment } from "prosemirror-model";
import { liftListItem, splitListItem, wrapInList } from "prosemirror-schema-list";
import { Command, EditorState, Selection, TextSelection, Transaction } from "prosemirror-state";
import {
	addColumnAfter,
	addColumnBefore,
	addRowAfter,
	deleteColumn,
	deleteRow,
} from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import { useSourceManager } from "../store/source-manager";
import { toggleBasicMarkup } from "./commands/markup";
import { addRowBefore, maybeDeleteTable } from "./commands/tables";
import mdSchema from "./editor-schema";
import { textShortcuts } from "./plugins/text-shortcuts";

export const editorActionKeybinds = {
	CODE_BLOCK: "Mod-Shift-k",
	BULLET_LIST: "Mod-Shift-l",
	ORDERED_LIST: "Mod-Shift-o",
	LIST_ITEM_TOGGLE_CHECKBOX: "Mod-Shift-c",
	LIST_ITEM_LIFT: "Mod-t",
	TABLE: "Mod-Shift-h",
	TABLE_ADD_COLUMN_AFTER: "Mod-]",
	TABLE_ADD_COLUMN_BEFORE: "Mod-[",
	TABLE_ADD_ROW_BEFORE: "Mod-{",
	TABLE_ADD_ROW_AFTER: "Mod-}",
	TABLE_DELETE_ROW: "Mod-d",
	TABLE_DELETE_COLUMN: "Mod-Shift-d",
	UNDO: "Mod-z",
	REDO: "Mod-y",
	BOLD_TOGGLE: "Mod-b",
	ITALIC_TOGGLE: "Mod-i",
	STRIKETHROUGH_TOGGLE: "Mod-Shift-x",
	INLINE_CODE_TOGGLE: "Mod-`",
	INLINE_MATH_TOGGLE: "Mod-m",

	SAVE: "Mod-s",
} as const;

/**
 * The default editor shortcuts
 */
export default function editorKeymap(schema: typeof mdSchema) {
	const keys: { [key: string]: Command } = { ...baseKeymap };

	keys[editorActionKeybinds.CODE_BLOCK] = setBlockType(schema.nodes.code, { language: "" });
	keys["Enter"] = chainCommands(
		checkForTextShortcuts,
		splitListItem(schema.nodes.list_item),
		liftListItem(schema.nodes.list_item),
		newlineInCode,
		createParagraphNear,
		liftEmptyBlock,
		escapeOrSplitBlock
	);
	keys["Backspace"] = chainCommands(deleteFirstEmptyBlock, maybeDeleteTable, baseKeymap["Backspace"]);
	keys["Shift-Enter"] = insertSoftBreak;
	keys[editorActionKeybinds.BULLET_LIST] = wrapInList(schema.nodes.bullet_list);
	keys[editorActionKeybinds.ORDERED_LIST] = wrapInList(schema.nodes.ordered_list);
	keys[editorActionKeybinds.LIST_ITEM_TOGGLE_CHECKBOX] = toggleListItemCheckbox;
	keys[editorActionKeybinds.LIST_ITEM_LIFT] = liftListItem(schema.nodes.list_item);
	keys[editorActionKeybinds.TABLE] = wrapIn(mdSchema.nodes.table);
	keys[editorActionKeybinds.TABLE_ADD_COLUMN_AFTER] = addColumnAfter;
	keys[editorActionKeybinds.TABLE_ADD_COLUMN_BEFORE] = addColumnBefore;
	keys[editorActionKeybinds.TABLE_ADD_ROW_BEFORE] = addRowBefore;
	keys[editorActionKeybinds.TABLE_ADD_ROW_AFTER] = addRowAfter;
	keys[editorActionKeybinds.TABLE_DELETE_ROW] = deleteRow;
	keys[editorActionKeybinds.TABLE_DELETE_COLUMN] = deleteColumn;
	keys[editorActionKeybinds.UNDO] = undo;
	keys[editorActionKeybinds.REDO] = redo;

	// Markup shortcuts
	keys[editorActionKeybinds.BOLD_TOGGLE] = toggleBasicMarkup("strong", "**");
	keys[editorActionKeybinds.ITALIC_TOGGLE] = toggleBasicMarkup("em", "*");
	keys[editorActionKeybinds.STRIKETHROUGH_TOGGLE] = toggleBasicMarkup("del", "~");
	keys[editorActionKeybinds.INLINE_CODE_TOGGLE] = toggleBasicMarkup("codespan", "`");
	keys[editorActionKeybinds.INLINE_MATH_TOGGLE] = toggleBasicMarkup("inlinemath", "$");

	// Editor global shortcuts
	keys[editorActionKeybinds.SAVE] = save;

	keys["ArrowLeft"] = arrowHandler("left");
	keys["ArrowRight"] = arrowHandler("right");
	keys["ArrowUp"] = arrowHandler("up");
	keys["ArrowDown"] = arrowHandler("down");

	return keys;
}

function save(editorState: EditorState): boolean {
	useSourceManager.getState().saveDocToSource(editorState);
	return true;
}

/**
 * Modified version of splitBlock command to prevent it in specific cases
 */
function escapeOrSplitBlock(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	const selectionFrom = editorState.selection.$from;
	if (
		selectionFrom.parent.type === mdSchema.nodes.table_cell ||
		selectionFrom.parent.type === mdSchema.nodes.table_header
	) {
		if (selectionFrom.index(selectionFrom.depth - 2) === selectionFrom.node(selectionFrom.depth - 2).childCount - 1) {
			const newPosition = selectionFrom.after(selectionFrom.depth - 2);
			const transaction = editorState.tr;
			dispatch?.(
				transaction
					.insert(newPosition, mdSchema.nodes.paragraph.createAndFill()!)
					.setSelection(TextSelection.near(transaction.doc.resolve(newPosition)))
			);
			return true;
		}
		return false;
	}
	return splitBlock(editorState, dispatch);
}

/**
 * Deletes a paragrah if it is the first one and empty
 */
function deleteFirstEmptyBlock(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	const currentNode = editorState.selection.$from.parent;
	if (
		currentNode.type === mdSchema.nodes.paragraph &&
		currentNode.textContent.trim() === "" &&
		editorState.selection.$from.node(editorState.selection.$from.depth - 1).type === mdSchema.nodes.doc &&
		editorState.selection.$from.index(editorState.selection.$from.depth - 1) === 0
	) {
		dispatch?.(editorState.tr.deleteRange(0, currentNode.nodeSize));
		return true;
	}
	return false;
}

function insertSoftBreak(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	dispatch?.(
		editorState.tr.replaceWith(editorState.selection.from, editorState.selection.to, mdSchema.nodes.soft_break.create())
	);
	return true;
}

/**
 * Create a table with the cursor content as the first cell
 */
export function wrapInTable(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	if (
		editorState.selection.$from.node().type === mdSchema.nodes.table_cell ||
		editorState.selection.$from.node().type === mdSchema.nodes.table_header
	) {
		return false;
	}

	const newSelectionPosition = editorState.tr.selection.anchor + 1;
	const transaction = editorState.tr;
	const cell = editorState.schema.nodes.table_cell.createAndFill()!;
	const headCell = editorState.schema.nodes.table_header.createAndFill()!;
	const node = editorState.schema.nodes.table.create(
		null,
		Fragment.fromArray([
			editorState.schema.nodes.table_row.create(null, Fragment.fromArray([headCell, headCell, headCell])),
			editorState.schema.nodes.table_row.create(null, Fragment.fromArray([cell, cell, cell])),
		])
	);

	dispatch?.(
		transaction
			.replaceSelectionWith(node)
			.scrollIntoView()
			.setSelection(TextSelection.near(transaction.doc.resolve(newSelectionPosition)))
	);
	return true;
}

/**
 * Toggles the list item into a checkbox
 */
export function toggleListItemCheckbox(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	const selectionFrom = editorState.selection.$from;
	const currentNodePosition = selectionFrom.before(selectionFrom.depth - 1);
	const currentNode = selectionFrom.node(selectionFrom.depth - 1);
	if (currentNode.type === (editorState.schema as typeof mdSchema).nodes.list_item) {
		const newCheckedValue = currentNode.attrs.checked === null ? false : null;
		dispatch?.(editorState.tr.setNodeAttribute(currentNodePosition, "checked", newCheckedValue));
		return true;
	}
	return false;
}

/**
 * Checks for text shortcuts that should have special handling for the `Enter`
 * key. See {@link textShortcuts}
 */
function checkForTextShortcuts(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	const selection = editorState.selection;

	if (selection.from !== selection.to) return false;

	const currentNode = selection.$from.node();
	const parentNode = selection.$from.node(selection.$from.depth - 1);

	if (
		currentNode.type !== (editorState.schema as typeof mdSchema).nodes.paragraph ||
		(parentNode.type !== (editorState.schema as typeof mdSchema).nodes.paragraph &&
			parentNode.type !== (editorState.schema as typeof mdSchema).nodes.list_item &&
			parentNode.type.name !== "doc")
	)
		return false;

	const textShortcutsValues = Object.values(textShortcuts);
	for (let i = 0; i < textShortcutsValues.length; i++) {
		const textShortcut = textShortcutsValues[i];
		if (textShortcut.ignoreCursor || !textShortcut.enterNode) {
			continue;
		}

		const match = currentNode.textContent.match(textShortcut.regex);

		if (match) {
			const selection = editorState.selection;
			const currentNode = selection.$from.node();
			const currentNodePosition = selection.$from.before();

			const newCodeNode = textShortcut.enterNode(match);

			const transaction = editorState.tr.replaceWith(
				currentNodePosition,
				currentNodePosition + currentNode.nodeSize,
				newCodeNode
			);

			dispatch?.(transaction);
			return true;
		}
	}

	return false;
}

function arrowHandler(dir: "up" | "down" | "right" | "left") {
	return (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
		// Provided by ProseMirror
		if (state.selection.empty && view!.endOfTextblock(dir)) {
			const side = dir == "left" || dir == "up" ? -1 : 1;
			const $head = state.selection.$head;
			const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
			if (nextPos.$head && nextPos.$head.parent.type.name === "code") {
				dispatch!(state.tr.setSelection(nextPos));
				return true;
			}
		}

		// Creates a new paragraph in the line before if the
		// current block is a table when pressing "Up" key
		const currentNode = state.selection.$from.parent;
		const parentNode = state.selection.$from.node(state.selection.$from.depth - 1);
		const selection = state.selection;
		if (dir === "up") {
			if (
				// A block that relies on CodeMirror
				((currentNode.type === mdSchema.nodes.code ||
					currentNode.type === mdSchema.nodes.html ||
					currentNode.type === mdSchema.nodes.math_block) &&
					parentNode?.type === mdSchema.nodes.doc &&
					selection.$from.index(selection.$from.depth - 1) === 0) ||
				// A blockquote
				(currentNode.type === mdSchema.nodes.paragraph &&
					parentNode?.type === mdSchema.nodes.blockquote &&
					selection.$from.node(selection.$from.depth - 2)?.type === mdSchema.nodes.doc &&
					selection.$from.index(selection.$from.depth - 2) === 0) ||
				// A table
				(currentNode.type === mdSchema.nodes.table_header &&
					selection.$from.node(selection.$from.depth - 3)?.type === mdSchema.nodes.doc &&
					selection.$from.index(selection.$from.depth - 3) === 0)
			) {
				let transaction = state.tr.insert(0, mdSchema.nodes.paragraph.create());
				transaction = transaction.setSelection(TextSelection.create(transaction.doc, 1));
				dispatch?.(transaction);
				return true;
			}
		}
		return false;
	};
}
