import { useEditorEffect, useEditorEventCallback } from "@nytimes/react-prosemirror";
import { LineVertical } from "@phosphor-icons/react";
import { useRef } from "react";
import StatefulTableActions from "./stateful-actions";
import StatelessTableActions from "./stateless-actions";

let tableToolbarHideTimeout: ReturnType<typeof setTimeout> | null = null;

const TOOLBAR_HIDE_TIMEOUT = 5000; // ms

/**
 * Toolbar for tables
 */
export default function TableToolbar() {
	const toolbarContainerRef = useRef<HTMLDivElement>(null);

	const updateToolbarPosition = useEditorEventCallback((view, setHideTimeout: boolean) => {
		if (!toolbarContainerRef.current) {
			return;
		}
		if (tableToolbarHideTimeout) {
			clearTimeout(tableToolbarHideTimeout);
		}

		const { $from, $to } = view.state.selection;
		const hidden = !$from.parent.type.spec.isCell || !$from.sameParent($to);

		if (hidden) {
			toolbarContainerRef.current.style.display = "none";
		} else {
			if (setHideTimeout) {
				tableToolbarHideTimeout = setTimeout(() => {
					if (toolbarContainerRef.current) {
						toolbarContainerRef.current.style.display = "none";
					}
				}, TOOLBAR_HIDE_TIMEOUT);
			}
			toolbarContainerRef.current.style.display = "flex";
			const tablePosition = $from.before($from.depth - 1);
			const tableCoords = view.coordsAtPos(tablePosition);
			toolbarContainerRef.current.style.top = `${tableCoords.top + window.scrollY}px`;
		}
	});

	useEditorEffect(() => {
		updateToolbarPosition(true);
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
