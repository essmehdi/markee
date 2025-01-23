import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { changeColumnAlignment } from "@/lib/prosemirror/commands/tables";
import { useEditorEventCallback, useEditorState } from "@nytimes/react-prosemirror";
import { TextAlignCenter, TextAlignLeft, TextAlignRight } from "@phosphor-icons/react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

type ToolbarStatefulAction = {
	id: string;
	label: string;
	onClick: (view: EditorView) => void;
	getEnabled: (state: EditorState) => boolean;
	icon: JSX.Element;
};

const TOOLBAR_STATEFUL_ACTIONS: ToolbarStatefulAction[] = [
	{
		id: "align_col_start",
		label: "Align column start",
		getEnabled: (state: EditorState) => {
			const currentNode = state.selection.$from.parent;
			return currentNode.type.spec.isCell && currentNode.attrs.align === "start";
		},
		onClick: (view: EditorView) => {
			changeColumnAlignment("start")(view.state, view.dispatch);
		},
		icon: <TextAlignLeft />,
	},
	{
		id: "align_col_center",
		label: "Align column center",
		getEnabled: (state: EditorState) => {
			const currentNode = state.selection.$from.parent;
			return currentNode.type.spec.isCell && currentNode.attrs.align === "center";
		},
		onClick: (view: EditorView) => {
			changeColumnAlignment("center")(view.state, view.dispatch);
		},
		icon: <TextAlignCenter />,
	},
	{
		id: "align_col_end",
		label: "Align column end",
		getEnabled: (state: EditorState) => {
			const currentNode = state.selection.$from.parent;
			return currentNode.type.spec.isCell && currentNode.attrs.align === "end";
		},
		onClick: (view: EditorView) => {
			changeColumnAlignment("end")(view.state, view.dispatch);
		},
		icon: <TextAlignRight />,
	},
];

export default function StatefulTableActions() {
	const editorState = useEditorState();
	const callActionWithView = useEditorEventCallback(
		(view, action: ToolbarStatefulAction["onClick"], event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			action(view);
		}
	);

	return (
		<>
			{TOOLBAR_STATEFUL_ACTIONS.map((action) => (
				<Tooltip key={action.id}>
					<TooltipTrigger asChild>
						<div>
							<Toggle
								id={action.id}
								className="bg-background data-[state=on]:border-none data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-0 min-w-[unset] size-8"
								variant="outline"
								pressed={action.getEnabled(editorState)}
								onMouseDown={(e) => callActionWithView(action.onClick, e)}
							>
								{action.icon}
							</Toggle>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{action.label}</p>
					</TooltipContent>
				</Tooltip>
			))}
		</>
	);
}
