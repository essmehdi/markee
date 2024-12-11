import { setBlockType } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { EditorView } from "prosemirror-view";
import { Markup } from "@/lib/types";
import { toggleBasicMarkup } from "@/lib/prosemirror/commands/markup";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { toggleListItemCheckbox, wrapInTable } from "@/lib/prosemirror/keymap";
import { selectionMarkupPosition } from "@/lib/prosemirror/plugins/parser";

type OptionWithId = {
	id: string;
	name: string;
	description: string;
};

type BaseToolbarAction = {
	id: string;
	type: string;
};

interface Toggle extends BaseToolbarAction {
	type: "toggle";
	icon: string;
	name: string;
	description: string;
	onClick: (view: EditorView, event: MouseEvent) => void;
	getActiveMarkup: (view: EditorView) => Markup | null;
}

interface Dropdown extends BaseToolbarAction {
	type: "dropdown";
	options: OptionWithId[];
	onSelect: (view: EditorView, selected: OptionWithId) => void;
	selected: (view: EditorView) => OptionWithId;
}

interface Action extends BaseToolbarAction {
	type: "action";
	icon: string;
	name: string;
	description: string;
	onClick: (view: EditorView, event: MouseEvent) => void;
}

type ToolbarAction = Toggle | Dropdown | Action;

export default class MenuView {
	private static readonly ACTIONS: ToolbarAction[] = [
		{
			id: "toggle_bold",
			type: "toggle",
			icon: "ph-text-b",
			name: "Bold",
			description: "Makes the selection bold",
			onClick: (view) => {
				const toggleCommand = toggleBasicMarkup("strong", "**");
				toggleCommand(view.state, view.dispatch);
			},
			getActiveMarkup(view) {
				return selectionMarkupPosition(view.state, "strong");
			},
		},
		{
			id: "toggle_italic",
			type: "toggle",
			icon: "ph-text-italic",
			name: "Italic",
			description: "Makes the selection italic",
			onClick: (view) => {
				const toggleCommand = toggleBasicMarkup("em", "*");
				toggleCommand(view.state, view.dispatch);
			},
			getActiveMarkup(view) {
				return selectionMarkupPosition(view.state, "em");
			},
		},
		{
			id: "toggle_strike",
			type: "toggle",
			icon: "ph-text-strikethrough",
			name: "Strikethrough",
			description: "Makes the selection strikethrough",
			onClick: (view) => {
				const toggleCommand = toggleBasicMarkup("del", "~~");
				toggleCommand(view.state, view.dispatch);
			},
			getActiveMarkup(view) {
				return selectionMarkupPosition(view.state, "del");
			},
		},
		{
			id: "toggle_inline_code",
			type: "toggle",
			icon: "ph-code",
			name: "Inline code",
			description: "Makes the selection inline code",
			onClick: (view) => {
				const toggleCommand = toggleBasicMarkup("codespan", "`");
				toggleCommand(view.state, view.dispatch);
			},
			getActiveMarkup(view) {
				return selectionMarkupPosition(view.state, "codespan");
			},
		},
		{
			id: "toggle_inline_math",
			type: "toggle",
			icon: "ph-pi",
			name: "Inline math",
			description: "Makes the selection inline math",
			onClick: (view) => {
				const toggleCommand = toggleBasicMarkup("inlinemath", "$");
				toggleCommand(view.state, view.dispatch);
			},
			getActiveMarkup(view) {
				return selectionMarkupPosition(view.state, "inlinemath");
			},
		},
		{
			id: "action_insert_unordered_list",
			type: "action",
			icon: "ph-list-bullets",
			name: "Unordered list",
			description: "Makes the selected block an unordered list",
			onClick: (view) => {
				wrapInList(mdSchema.nodes.bullet_list)(view.state, view.dispatch);
			},
		},
		{
			id: "action_insert_ordered_list",
			type: "action",
			icon: "ph-list-numbers",
			name: "Ordered list",
			description: "Makes the selected block an ordered list",
			onClick: (view) => {
				wrapInList(mdSchema.nodes.ordered_list)(view.state, view.dispatch);
			},
		},
		{
			id: "action_insert_check_list",
			type: "action",
			icon: "ph-list-checks",
			name: "Check list",
			description: "Makes the selected block an check list",
			onClick: (view) => {
				wrapInList(mdSchema.nodes.bullet_list)(view.state, view.dispatch);
				toggleListItemCheckbox(view.state, view.dispatch);
			},
		},
		{
			id: "action_insert_code_block",
			type: "action",
			icon: "ph-code-block",
			name: "Code block",
			description: "Makes the selected block a code block",
			onClick: (view) => {
				setBlockType(mdSchema.nodes.code, { language: "" })(
					view.state,
					view.dispatch,
				);
			},
		},
		{
			id: "action_insert_blockquote",
			type: "action",
			icon: "ph-quotes",
			name: "Blockquote",
			description: "Makes the selected block a blockuote",
			onClick: (view) => {
				setBlockType(mdSchema.nodes.blockquote)(view.state, view.dispatch);
			},
		},
		{
			id: "action_insert_math_block",
			type: "action",
			icon: "ph-function",
			name: "Math block",
			description: "Makes the selected block a math block",
			onClick: (view) => {
				setBlockType(mdSchema.nodes.math_block)(view.state, view.dispatch);
			},
		},
		{
			id: "action_insert_table",
			type: "action",
			icon: "ph-table",
			name: "Table",
			description: "Makes the selected block a table",
			onClick: (view) => {
				wrapInTable(view.state, view.dispatch);
			},
		},
	];
	private editorView: EditorView;
	public dom: HTMLDivElement;

	constructor(editorView: EditorView) {
		this.editorView = editorView;

		this.dom = document.createElement("div");
		this.dom.classList.add("md-toolbar");
		this.populateToolbar();
	}

	populateToolbar() {
		let lastActionType: ToolbarAction["type"] | null = null;
		MenuView.ACTIONS.forEach((action) => {
			// Add a seperator for different action types
			if (lastActionType && lastActionType !== action.type) {
				const separatorDom = document.createElement("div");
				separatorDom.classList.add("md-toolbar-separator");
				const separatorIcon = document.createElement("i");
				separatorIcon.classList.add("ph-bold", "ph-line-vertical");

				separatorDom.append(separatorIcon);
				this.dom.append(separatorDom);
			}
			lastActionType = action.type;

			let actionDom: HTMLElement | null = null;
			if (action.type === "toggle" || action.type === "action") {
				const button = document.createElement("button");
				button.id = action.id;
				button.setAttribute("data-type", action.type);
				button.title = action.name;
				if (action.type === "toggle") {
					const active = action.getActiveMarkup(this.editorView);
					if (active) {
						button.classList.add("active");
					}
				}
				button.addEventListener("mousedown", (event) => {
					event.preventDefault();
					event.stopPropagation();
					action.onClick(this.editorView, event);
				});

				const buttonIcon = document.createElement("i");
				buttonIcon.className = `ph-bold ${action.icon}`;
				button.append(buttonIcon);
				actionDom = button;
			}

			if (actionDom) {
				actionDom.classList.add("md-toolbar-action", action.type);
				this.dom.append(actionDom);
			}
		});
	}

	update(view: EditorView): boolean {
		const actions = this.dom.getElementsByClassName("md-toolbar-action");
		for (let i = 0; i < actions.length; i++) {
			const actionDom = actions[i];
			const action = MenuView.ACTIONS[i];
			switch (action.type) {
				case "toggle":
					const active = action.getActiveMarkup(view);
					if (active) {
						actionDom.classList.add("active");
					} else {
						actionDom.classList.remove("active");
					}
					break;
			}
		}
		return false;
	}

	destroy() {
		this.dom.remove();
	}
}
