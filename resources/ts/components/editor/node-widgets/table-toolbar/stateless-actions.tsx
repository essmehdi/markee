import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { addRowAfter, checkedAddRowBefore } from "@/lib/prosemirror/commands/tables";
import { useEditorEventCallback } from "@nytimes/react-prosemirror";
import { ColumnsPlusLeft, ColumnsPlusRight, RowsPlusBottom, RowsPlusTop } from "@phosphor-icons/react";
import { addColumnAfter, addColumnBefore } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";

type ToolbarStatelessAction = {
	id: string;
	label: string;
	onClick: (view: EditorView) => void;
	icon: JSX.Element;
};

const TOOLBAR_STATELESS_ACTIONS: ToolbarStatelessAction[] = [
	{
		id: "add_row_after",
		label: "Add row after",
		onClick: (view) => {
			addRowAfter(view.state, view.dispatch);
		},
		icon: <RowsPlusBottom />,
	},
	{
		id: "add_row_before",
		label: "Add row before",
		onClick: (view) => {
			checkedAddRowBefore(view.state, view.dispatch);
		},
		icon: <RowsPlusTop />,
	},
	{
		id: "add_col_after",
		label: "Add column after",
		onClick: (view) => {
			addColumnAfter(view.state, view.dispatch);
		},
		icon: <ColumnsPlusRight />,
	},
	{
		id: "add_col_before",
		label: "Add column before",
		onClick: (view) => {
			addColumnBefore(view.state, view.dispatch);
		},
		icon: <ColumnsPlusLeft />,
	},
];

export default function StatelessTableActions() {
	const callActionWithView = useEditorEventCallback(
		(view, action: ToolbarStatelessAction["onClick"], event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			action(view);
		}
	);

	return (
		<>
			{TOOLBAR_STATELESS_ACTIONS.map((action) => (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							id={action.id}
							key={action.id}
							className="size-8"
							size="icon"
							variant="outline"
							onMouseDown={(e) => callActionWithView(action.onClick, e)}
						>
							{action.icon}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{action.label}</p>
					</TooltipContent>
				</Tooltip>
			))}
		</>
	);
}
