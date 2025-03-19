import { useEditorEffect, useEditorEventCallback } from "@nytimes/react-prosemirror";
import { LineVertical } from "@phosphor-icons/react";
import { useRef } from "react";
import StatefulTableActions from "./stateful-actions";
import StatelessTableActions from "./stateless-actions";

/**
 * Toolbar for tables
 */
export default function TableToolbar() {
	const toolbarContainerRef = useRef<HTMLDivElement>(null);

	const updateToolbarPosition = useEditorEventCallback((view) => {
		if (!toolbarContainerRef.current) {
			return;
		}

		const { $from, $to } = view.state.selection;
		const hidden = !$from.parent.type.spec.isCell || !$from.sameParent($to);

		if (hidden) {
			toolbarContainerRef.current.style.display = "none";
		} else {
			toolbarContainerRef.current.style.display = "flex";
		}
	});

	useEditorEffect(() => {
		updateToolbarPosition();
	});

	return (
		<div
			ref={toolbarContainerRef}
			className="absolute left-1/2 z-[1] mx-auto mb-2 flex -translate-x-1/2 items-center gap-1 rounded-b-lg bg-accent p-1"
		>
			<StatelessTableActions />
			<LineVertical className="text-secondary-foreground" size={10} />
			<StatefulTableActions />
		</div>
	);
}
