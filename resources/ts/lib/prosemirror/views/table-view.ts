import rowsPlusBottom from "@phosphor-icons/core/assets/bold/rows-plus-bottom-bold.svg?raw";
import rowsPlusTop from "@phosphor-icons/core/assets/bold/rows-plus-top-bold.svg?raw";
import columnsPlusLeft from "@phosphor-icons/core/assets/bold/columns-plus-left-bold.svg?raw";
import columnsPlusRight from "@phosphor-icons/core/assets/bold/columns-plus-right-bold.svg?raw";
import textAlignLeft from "@phosphor-icons/core/assets/bold/text-align-left-bold.svg?raw";
import textAlignCenter from "@phosphor-icons/core/assets/bold/text-align-center-bold.svg?raw";
import textAlignRight from "@phosphor-icons/core/assets/bold/text-align-right-bold.svg?raw";
import { Node } from "prosemirror-model";
import { addColumnAfter, addColumnBefore } from "prosemirror-tables";
import { EditorView, NodeView } from "prosemirror-view";
import { checkedAddRowBefore, changeColumnAlignment, addRowAfter } from "../commands/tables";
import { EditorState } from "prosemirror-state";

/**
 * Table block view
 * Displays the table and its toolbar actions
 */
export default class TableView implements NodeView {
	private static readonly TOOLBAR_CLASS_NAME = "md-table-toolbar" as const;
	private static readonly ACTION_BUTTON_CLASS_NAME = "md-table-action-button" as const;
	private static readonly ACTION_BUTTON_ICON_CLASS_NAME = "md-table-action-button-icon" as const;

	private node: Node;
	public dom: HTMLDivElement;
	public contentDOM: HTMLTableElement;
	private editorView: EditorView;
	private getPos: () => number | undefined;

	/**
	 * Toolbar container element
	 */
	private toolbar!: HTMLDivElement;

	/**
	 * List of the stateless buttons to display on the toolbar
	 */
	private readonly statelessButtons = [
		{
			id: "add_row_after",
			label: "Add row after",
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				addRowAfter(state, dispatch);
			},
			icon: rowsPlusBottom,
		},
		{
			id: "add_row_before",
			label: "Add row before",
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				checkedAddRowBefore(state, dispatch);
			},
			icon: rowsPlusTop,
		},
		{
			id: "add_col_after",
			label: "Add column after",
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				addColumnAfter(state, dispatch);
			},
			icon: columnsPlusRight,
		},
		{
			id: "add_col_before",
			label: "Add column before",
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				addColumnBefore(state, dispatch);
			},
			icon: columnsPlusLeft,
		},
	] as const;

	/**
	 * List of stateful buttons to display in the toolbar
	 */
	private readonly statefulButtons = [
		{
			id: "align_col_start",
			label: "Align column start",
			getEnabled: (state: EditorState) => {
				const currentNode = state.selection.$from.parent;
				return currentNode.type.spec.isCell && currentNode.attrs.align === "start";
			},
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				changeColumnAlignment("start")(state, dispatch);
			},
			icon: textAlignLeft,
		},
		{
			id: "align_col_center",
			label: "Align column center",
			getEnabled: (state: EditorState) => {
				const currentNode = state.selection.$from.parent;
				return currentNode.type.spec.isCell && currentNode.attrs.align === "center";
			},
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				changeColumnAlignment("center")(state, dispatch);
			},
			icon: textAlignCenter,
		},
		{
			id: "align_col_end",
			label: "Align column end",
			getEnabled: (state: EditorState) => {
				const currentNode = state.selection.$from.parent;
				return currentNode.type.spec.isCell && currentNode.attrs.align === "end";
			},
			onClick: (state: EditorState, dispatch?: EditorView["dispatch"]) => {
				changeColumnAlignment("end")(state, dispatch);
			},
			icon: textAlignRight,
		},
	] as const;

	constructor(node: Node, editorView: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.editorView = editorView;
		this.getPos = getPos;

		const nodeRoot = document.createElement("div");
		const tableElement = document.createElement("table");
		nodeRoot.append(tableElement);
		this.dom = nodeRoot;
		this.contentDOM = tableElement;
		this.dom.classList.add("md-block", "relative");

		this.initTableToolbar();
		this.updateTableToolbarVisibility();
	}

	/**
	 * Creates the toolbar container and adds it to the view
	 */
	private initTableToolbar(): void {
		this.toolbar = document.createElement("div");
		this.toolbar.classList.add(TableView.TOOLBAR_CLASS_NAME);
		this.toolbar.style.display = "hidden";
		this.toolbar.contentEditable = "false";

		this.addStatelessActionButtons();
		this.toolbar.append(document.createElement("div")); // Separator
		this.addStatefulActionButtons();

		this.dom.prepend(this.toolbar);
	}

	/**
	 * Creates all the stateless actions buttons (e.g. add row) and appends them to the toolbar
	 */
	private addStatelessActionButtons(): void {
		for (let i = 0; i < this.statelessButtons.length; i++) {
			const statelessButton = this.statelessButtons[i];
			const button = this.createActionButton(
				statelessButton.label,
				() => {
					statelessButton.onClick(this.editorView.state, this.editorView.dispatch);
				},
				statelessButton.icon
			);
			this.toolbar.append(button);
		}
	}

	/**
	 * Creates and adds stateful buttons (e.g. column alignment) to the toolbar
	 */
	private addStatefulActionButtons(): void {
		console.trace();
		for (let i = 0; i < this.statefulButtons.length; i++) {
			const statefulButton = this.statefulButtons[i];
			const button = this.createActionButton(
				statefulButton.label,
				() => {
					statefulButton.onClick(this.editorView.state, this.editorView.dispatch);
				},
				statefulButton.icon
			);
			button.id = statefulButton.id;
			button.setAttribute("data-enabled", statefulButton.getEnabled(this.editorView.state) ? "true" : "false");
			this.toolbar.append(button);
		}
	}

	update(node: Node): boolean {
		if (node.type !== this.node.type) return false;
		this.updateTableToolbarVisibility();
		this.updateStatefulButtons();
		return false;
	}

	selectNode() {
		this.updateTableToolbarVisibility();
	}

	deselectNode() {
		this.updateTableToolbarVisibility();
	}

	/**
	 * Updates the stateful buttons by recalling their respective `getEnabled` function
	 */
	updateStatefulButtons(): void {
		for (let i = 0; i < this.statefulButtons.length; i++) {
			const statefulButton = this.statefulButtons[i];
			const button = this.dom.querySelector("#" + statefulButton.id);
			button?.setAttribute("data-enabled", statefulButton.getEnabled(this.editorView.state) ? "true" : "false");
		}
	}

	/**
	 * Toggles the toolbar display style value depending on the editor current selection
	 */
	updateTableToolbarVisibility(): void {
		const selectionFrom = this.editorView.state.selection.$from;
		if (selectionFrom.node(selectionFrom.depth - 2)?.eq(this.node)) {
			this.showActions();
		} else {
			this.hideActions();
		}
	}

	/**
	 * Shows the toolbar cointainer
	 */
	showActions(): void {
		this.toolbar.style.display = "flex";
	}

	/**
	 * Hides the toolbar container
	 */
	hideActions(): void {
		this.toolbar.style.display = "none";
	}

	ignoreMutation(): true {
		return true;
	}

	/**
	 * Creates an action button
	 * @param label Button label text
	 * @param onClick Button onClick action
	 * @param icon Icon SVG string
	 */
	private createActionButton(label: string, onClick: () => void, icon: string): HTMLButtonElement {
		const button = document.createElement("button");
		button.classList.add(TableView.ACTION_BUTTON_CLASS_NAME);
		button.addEventListener("mousedown", (event) => {
			event.preventDefault();
			event.stopPropagation();
			onClick();
		});

		button.innerHTML = icon;
		button.title = label;

		return button;
	}
}
