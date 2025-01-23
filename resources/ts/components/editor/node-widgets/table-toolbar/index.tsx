import { useEditorEffect } from "@nytimes/react-prosemirror";
import { useRef } from "react";
import StatelessTableActions from "./stateless-actions";
import StatefulTableActions from "./stateful-actions";
import { LineVertical } from "@phosphor-icons/react";

/**
 * Toolbar for tables
 */
export default function TableToolbar() {
	const toolbarContainerRef = useRef<HTMLDivElement>(null);

	useEditorEffect((view) => {
		if (!toolbarContainerRef.current) {
			return;
		}
		const { $from, $to } = view.state.selection;
		const hidden = !$from.parent.type.spec.isCell || !$from.sameParent($to);

		if (hidden) {
			toolbarContainerRef.current.style.display = "none";
		} else {
			toolbarContainerRef.current.style.display = "flex";
			const tableCoords = view.coordsAtPos($from.before($from.depth - 1));
			toolbarContainerRef.current.style.top = `${tableCoords.top + window.scrollY}px`;
		}
	});

	return (
		<div
			ref={toolbarContainerRef}
			className="absolute left-1/2 z-[1] mx-auto mb-2 flex -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] items-center gap-1 rounded-lg bg-accent p-1"
		>
			<StatelessTableActions />
			<LineVertical className="text-secondary-foreground" size={10} />
			<StatefulTableActions />
		</div>
	);
}
