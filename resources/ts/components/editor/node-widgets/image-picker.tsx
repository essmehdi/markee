import { useSidebar } from "@/components/ui/sidebar";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { selectionMarkupPosition } from "@/lib/prosemirror/plugins/parser";
import { useEditorEffect, useEditorEventCallback } from "@nytimes/react-prosemirror";
import { EditorState } from "prosemirror-state";
import { encode } from "punycode";
import { useEffect, useRef, useState } from "react";

function isCursorInsideEmptyImageUrl(editorState: EditorState) {
	const { $from, anchor, head } = editorState.selection;
	const imageMarkup = selectionMarkupPosition(editorState, "image");

	return (
		imageMarkup && // Check if we are inside image markup
		imageMarkup.punctuation[1][1] === imageMarkup.punctuation[2][0] && // Check if the url is empty
		anchor >= imageMarkup.punctuation[1][1] && // Check if the cursor is inside the url part
		anchor <= imageMarkup.punctuation[2][0] &&
		$from.parent.type === mdSchema.nodes.paragraph && // Check if we are inside a paragraph
		anchor === head // Check if the selection is empty
	);
}

export default function ImagePicker() {
	const toolbarContainerRef = useRef<HTMLDivElement>(null);
	const { open } = useSidebar();

	const insertEncodedImage = useEditorEventCallback((view, encodedImage: string) => {
		if (isCursorInsideEmptyImageUrl(view.state)) {
			view.dispatch(view.state.tr.insertText(encodedImage));
		}
	});

	const updateToolbarPosition = useEditorEventCallback((view) => {
		if (!toolbarContainerRef.current) {
			return;
		}

		const hidden = !isCursorInsideEmptyImageUrl(view.state);

		if (hidden) {
			toolbarContainerRef.current.style.display = "none";
		} else {
			toolbarContainerRef.current.style.display = "block";

			const editorContainerClientRect = view.dom.parentElement!.getBoundingClientRect();
			const cursorCoords = view.coordsAtPos(view.state.selection.anchor);

			toolbarContainerRef.current.style.top = `${cursorCoords.top - editorContainerClientRect.top}px`;
			toolbarContainerRef.current.style.left = `${cursorCoords.left - editorContainerClientRect.left}px`;
		}
	});

	useEffect(() => {
		// TODO: Fix this horrendous workaround
		setTimeout(() => {
			updateToolbarPosition();
		}, 200);
	}, [open]);

	useEditorEffect(() => {
		updateToolbarPosition();
	});

	const onImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
		const imageFile = event.target.files?.[0];
		if (imageFile) {
			const fileReader = new FileReader();
			fileReader.onloadend = () => {
				insertEncodedImage(fileReader.result as string);
			}
 			fileReader.readAsDataURL(imageFile);
		}
	};

	return (
		<div
			ref={toolbarContainerRef}
			className="absolute z-[1] mb-2 -translate-x-1/2 -translate-y-[calc(100%+1rem)] rounded-lg border border-dashed border-primary bg-card"
		>
			<label htmlFor="editor-image-picker" className="block cursor-pointer px-10 py-7">
				<p>Drop an image here or click to choose</p>
				<input
					id="editor-image-picker"
					className="hidden"
					name="image-picker"
					type="file"
					accept="image/*"
					onChange={onImagePicked}
				/>
			</label>
		</div>
	);
}
