import { baseKeymap, chainCommands, setBlockType } from "prosemirror-commands";
import { redo, undo } from "prosemirror-history";
import { Fragment } from "prosemirror-model";
import {
	liftListItem,
	splitListItem,
	wrapInList,
} from "prosemirror-schema-list";
import { Command, EditorState, Selection, TextSelection, Transaction } from "prosemirror-state";
import {
	addColumnAfter,
	addColumnBefore,
	addRowAfter,
	addRowBefore,
	deleteColumn,
	deleteRow,
} from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import mdSchema from "./editor-schema";
import { CODE_BLOCK_STARTER } from "./plugins/text-shortcuts";
import { punctuationWrapperCommand, toggleBasicMarkup } from "./commands/markup";

/**
 * The default editor shortcuts
 */
export default function editorKeymap(schema: typeof mdSchema) {
	const keys: { [key: string]: Command } = { ...baseKeymap };

	keys["Mod-Shift-k"] = setBlockType(schema.nodes.code, { language: "" });
	keys["Enter"] = chainCommands(
		checkForCodeBlockPunc,
		splitListItem(schema.nodes.list_item),
		liftListItem(schema.nodes.list_item),
		baseKeymap["Enter"],
	);
	// keys["Shift-Enter"] = keys["Enter"];
	keys["Shift-Enter"] = insertSoftBreak;
	keys["Mod-Shift-l"] = chainCommands(wrapInList(schema.nodes.bullet_list));
	keys["Mod-Shift-o"] = chainCommands(wrapInList(schema.nodes.ordered_list));
	keys["Mod-Shift-c"] = toggleListItemCheckbox;
	keys["Mod-t"] = liftListItem(schema.nodes.list_item);
	keys["Mod-Shift-h"] = wrapInTable;
	keys["Mod-]"] = addColumnAfter;
	keys["Mod-["] = addColumnBefore;
	keys["Mod-{"] = addRowBefore;
	keys["Mod-}"] = addRowAfter;
	keys["Mod-d"] = deleteRow;
	keys["Mod-Shift-d"] = deleteColumn;
	keys["Mod-z"] = undo;
	keys["Mod-y"] = redo;

	// Markup shortcuts
	keys["Mod-b"] = toggleBasicMarkup("strong", "**");
	keys["Mod-i"] = toggleBasicMarkup("em","*");
	keys["Mod-Shift-x"] = toggleBasicMarkup("del", "~");
	keys["Mod-`"] = toggleBasicMarkup("codespan", "`");
	keys["Mod-m"] = toggleBasicMarkup("inlinemath", "$");

	keys["ArrowLeft"] = arrowHandler("left");
	keys["ArrowRight"] = arrowHandler("right");
	keys["ArrowUp"] = arrowHandler("up");
	keys["ArrowDown"] = arrowHandler("down");

	return keys;
}

function insertSoftBreak(
	editorState: EditorState,
	dispatch?: EditorView["dispatch"],
): boolean {
	dispatch?.(
		editorState.tr.replaceWith(
			editorState.selection.from,
			editorState.selection.to,
			mdSchema.nodes.soft_break.create(),
		),
	);
	return true;
}

/**
 * Create a table with the cursor content as the first cell
 */
function wrapInTable(
	editorState: EditorState,
	dispatch?: EditorView["dispatch"],
): boolean {
	const offset = editorState.tr.selection.anchor + 1;
	const transaction = editorState.tr;
	const cell = editorState.schema.nodes.table_cell.createAndFill()!;
	const headCell = editorState.schema.nodes.table_header.createAndFill()!;
	const node = editorState.schema.nodes.table.create(
		null,
		Fragment.fromArray([
			editorState.schema.nodes.table_row.create(
				null,
				Fragment.fromArray([headCell, headCell, headCell]),
			),
			editorState.schema.nodes.table_row.create(
				null,
				Fragment.fromArray([cell, cell, cell]),
			),
		]),
	);

	dispatch?.(
		transaction
			.replaceSelectionWith(node)
			.scrollIntoView()
			.setSelection(TextSelection.near(transaction.doc.resolve(offset))),
	);
	return true;
}

/**
 * Toggles the list item into a checkbox
 */
function toggleListItemCheckbox(
	editorState: EditorState,
	dispatch?: EditorView["dispatch"],
): boolean {
	const selectionFrom = editorState.selection.$from;
	const currentNodePosition = selectionFrom.before(selectionFrom.depth - 1);
	const currentNode = selectionFrom.node(selectionFrom.depth - 1);
	if (
		currentNode.type === (editorState.schema as typeof mdSchema).nodes.list_item
	) {
		const newCheckedValue = currentNode.attrs.checked === null ? false : null;
		dispatch?.(
			editorState.tr.setNodeAttribute(
				currentNodePosition,
				"checked",
				newCheckedValue,
			),
		);
		return true;
	}
	return false;
}

/**
 * Checks for the code block markdown start punctuation (\`\`\`) to be
 * to automatically start code block on Enter
 */
function checkForCodeBlockPunc(
	editorState: EditorState,
	_dispatch?: EditorView["dispatch"],
	editorView?: EditorView,
): boolean {
	const selection = editorState.selection;

	if (selection.from !== selection.to) return false;

	const currentNode = selection.$from.node();
	const parentNode = selection.$from.node(selection.$from.depth - 1);

	if (
		currentNode.type !==
		(editorState.schema as typeof mdSchema).nodes.paragraph ||
		(parentNode.type !==
			(editorState.schema as typeof mdSchema).nodes.paragraph &&
			parentNode.type !==
			(editorState.schema as typeof mdSchema).nodes.list_item &&
			parentNode.type.name !== "doc")
	)
		return false;

	const codeBlockMatch = currentNode.textContent.match(CODE_BLOCK_STARTER);

	if (codeBlockMatch && editorView) {
		const selection = editorView.state.selection;
		const currentNode = selection.$from.node();
		const currentNodePosition = selection.$from.before();

		const newCodeNode = (
			editorState.schema as typeof mdSchema
		).nodes.code.create({
			language: codeBlockMatch[1],
		});

		const transaction = editorView.state.tr.replaceWith(
			currentNodePosition,
			currentNodePosition + currentNode.nodeSize,
			newCodeNode,
		);

		editorView.dispatch(transaction);
		return true;
	}

	return false;
}

function arrowHandler(dir: "up" | "down" | "right" | "left") {
	return (
		state: EditorState,
		dispatch?: (tr: Transaction) => void,
		view?: EditorView,
	) => {
		if (state.selection.empty && view!.endOfTextblock(dir)) {
			const side = dir == "left" || dir == "up" ? -1 : 1;
			const $head = state.selection.$head;
			const nextPos = Selection.near(
				state.doc.resolve(side > 0 ? $head.after() : $head.before()),
				side,
			);
			if (nextPos.$head && nextPos.$head.parent.type.name === "code") {
				dispatch!(state.tr.setSelection(nextPos));
				return true;
			}
		}
		return false;
	};
}
