import { EditorView } from "prosemirror-view";
import { Markup } from "../../../types";
import { toggleBasicMarkup } from "../../commands/markup";
import { selectionMarkupPosition } from "../decorator";

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

type ToolbarAction = Toggle | Dropdown;

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
				const toggleCommand = toggleBasicMarkup("codespan", "`");
				toggleCommand(view.state, view.dispatch);
			},
			getActiveMarkup(view) {
				return selectionMarkupPosition(view.state, "codespan");
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
		MenuView.ACTIONS.forEach((action) => {
			let actionDom: HTMLElement | null = null;
			switch (action.type) {
				case "toggle": {
					const button = document.createElement("button");
					button.id = action.id;
					button.setAttribute("data-type", action.type);
					button.title = action.name;
					const active = action.getActiveMarkup(this.editorView);
					if (active) {
						button.classList.add("active");
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
					break;
				}
				case "dropdown":
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
				case "dropdown":
			}
		}
		return false;
	}

	destroy() {
		this.dom.remove();
	}
}
