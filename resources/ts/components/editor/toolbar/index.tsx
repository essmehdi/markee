import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { toggleBasicMarkup } from "@/lib/prosemirror/commands/markup";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { toggleListItemCheckbox, wrapInTable } from "@/lib/prosemirror/keymap";
import { selectionMarkupPosition } from "@/lib/prosemirror/plugins/decorator";
import { Markup } from "@/lib/types";
import {
	useEditorEventCallback,
	useEditorState,
} from "@nytimes/react-prosemirror";
import {
	Code,
	CodeBlock,
	Function,
	LineVertical,
	ListBullets,
	ListNumbers,
	Pi,
	Quotes,
	Table,
	TextBolder,
	TextItalic,
	TextStrikethrough,
} from "@phosphor-icons/react";
import { ListCheck } from "lucide-react";
import { setBlockType } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import Menu from "./menu";

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
	icon: JSX.Element;
	name: string;
	description: string;
	onClick: (view: EditorView) => void;
	getActiveMarkup: (view: EditorState) => Markup | null;
}

interface Dropdown extends BaseToolbarAction {
	type: "dropdown";
	options: OptionWithId[];
	onSelect: (view: EditorView, selected: OptionWithId) => void;
	selected: (view: EditorView) => OptionWithId;
}

interface Action extends BaseToolbarAction {
	type: "action";
	icon: JSX.Element;
	name: string;
	description: string;
	onClick: (view: EditorView) => void;
}

type ToolbarAction = Toggle | Dropdown | Action;

const ACTIONS: ToolbarAction[] = [
	{
		id: "toggle_bold",
		type: "toggle",
		icon: <TextBolder />,
		name: "Bold",
		description: "Makes the selection bold",
		onClick: (view) => {
			const toggleCommand = toggleBasicMarkup("strong", "**");
			toggleCommand(view.state, view.dispatch);
		},
		getActiveMarkup(state) {
			const result = selectionMarkupPosition(state, "strong");
			console.log("Bold", result);
			return result;
		},
	},
	{
		id: "toggle_italic",
		type: "toggle",
		icon: <TextItalic />,
		name: "Italic",
		description: "Makes the selection italic",
		onClick: (view) => {
			const toggleCommand = toggleBasicMarkup("em", "*");
			toggleCommand(view.state, view.dispatch);
		},
		getActiveMarkup(state) {
			return selectionMarkupPosition(state, "em");
		},
	},
	{
		id: "toggle_strike",
		type: "toggle",
		icon: <TextStrikethrough />,
		name: "Strikethrough",
		description: "Makes the selection strikethrough",
		onClick: (view) => {
			const toggleCommand = toggleBasicMarkup("del", "~~");
			toggleCommand(view.state, view.dispatch);
		},
		getActiveMarkup(state) {
			return selectionMarkupPosition(state, "del");
		},
	},
	{
		id: "toggle_inline_code",
		type: "toggle",
		icon: <Code />,
		name: "Inline code",
		description: "Makes the selection inline code",
		onClick: (view) => {
			const toggleCommand = toggleBasicMarkup("codespan", "`");
			toggleCommand(view.state, view.dispatch);
		},
		getActiveMarkup(state) {
			return selectionMarkupPosition(state, "codespan");
		},
	},
	{
		id: "toggle_inline_math",
		type: "toggle",
		icon: <Pi />,
		name: "Inline math",
		description: "Makes the selection inline math",
		onClick: (view) => {
			const toggleCommand = toggleBasicMarkup("inlinemath", "$");
			toggleCommand(view.state, view.dispatch);
		},
		getActiveMarkup(state) {
			return selectionMarkupPosition(state, "inlinemath");
		},
	},
	{
		id: "action_insert_unordered_list",
		type: "action",
		icon: <ListBullets />,
		name: "Unordered list",
		description: "Makes the selected block an unordered list",
		onClick: (view) => {
			wrapInList(mdSchema.nodes.bullet_list)(view.state, view.dispatch);
		},
	},
	{
		id: "action_insert_ordered_list",
		type: "action",
		icon: <ListNumbers />,
		name: "Ordered list",
		description: "Makes the selected block an ordered list",
		onClick: (view) => {
			wrapInList(mdSchema.nodes.ordered_list)(view.state, view.dispatch);
		},
	},
	{
		id: "action_insert_check_list",
		type: "action",
		icon: <ListCheck />,
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
		icon: <CodeBlock />,
		name: "Code block",
		description: "Makes the selected block a code block",
		onClick: (view) => {
			setBlockType(mdSchema.nodes.code, { language: "" })(
				view.state,
				view.dispatch
			);
		},
	},
	{
		id: "action_insert_blockquote",
		type: "action",
		icon: <Quotes />,
		name: "Blockquote",
		description: "Makes the selected block a blockuote",
		onClick: (view) => {
			setBlockType(mdSchema.nodes.blockquote)(view.state, view.dispatch);
		},
	},
	{
		id: "action_insert_math_block",
		type: "action",
		icon: <Function />,
		name: "Math block",
		description: "Makes the selected block a math block",
		onClick: (view) => {
			setBlockType(mdSchema.nodes.math_block)(view.state, view.dispatch);
		},
	},
	{
		id: "action_insert_table",
		type: "action",
		icon: <Table />,
		name: "Table",
		description: "Makes the selected block a table",
		onClick: (view) => {
			wrapInTable(view.state, view.dispatch);
		},
	},
];

export default function Toolbar() {
	const editorState = useEditorState();

	const applyAction = useEditorEventCallback(
		(
			view,
			actionCallback: (view: EditorView) => void,
			event: React.MouseEvent
		) => {
			event.preventDefault();
			event.stopPropagation();
			actionCallback(view);
		}
	);

	const getToolbarActions = () => {
		const toggleGroup: JSX.Element[] = [];
		const actionGroup: JSX.Element[] = [];

		ACTIONS.map((action) => {
			if (action.type === "toggle") {
				toggleGroup.push(
					<Toggle
						key={action.id}
						pressed={action.getActiveMarkup(editorState) !== null}
						onMouseDown={(event) => applyAction(action.onClick, event)}
					>
						{action.icon}
					</Toggle>
				);
			} else if (action.type === "action") {
				actionGroup.push(
					<Button
						key={action.id}
						variant="ghost"
						size="icon"
						onMouseDown={(event) => applyAction(action.onClick, event)}
					>
						{action.icon}
					</Button>
				);
			}
		});

		return {
			toggles: toggleGroup,
			actions: actionGroup,
		};
	};

	const toolbarActions = getToolbarActions();
	return (
		<div className="flex justify-between sticky top-5 w-full max-w-6xl items-center gap-1 text-neutral-700 mb-5 bg-white border border-neutral-100 rounded-[calc(theme(borderRadius.lg)+0.25rem)] p-1 shadow-md shadow-gray-100 mx-auto">
			<Menu />
			<div id="editor-toolbar" className="flex items-center gap-1">
				{toolbarActions.toggles}
				<LineVertical className="text-neutral-200" size={10} />
				{toolbarActions.actions}
			</div>
		</div>
	);
}
