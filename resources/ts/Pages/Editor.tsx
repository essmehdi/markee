import { useState } from "react";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import { NodeViewConstructor } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";
import editorKeymap from "@/lib/prosemirror/keymap";
import markdownParser from "@/lib/prosemirror/plugins/parser";
import floatingToolbar from "@/lib/prosemirror/plugins/floating-toolbar";
import footnoter from "@/lib/prosemirror/plugins/footnotes";
import listItemDecorator from "@/lib/prosemirror/plugins/list-checkbox";
import textShortcuts from "@/lib/prosemirror/plugins/text-shortcuts";
import transformer from "@/lib/prosemirror/plugins/transformer";
import CodeBlockView from "@/lib/prosemirror/views/code-view";
import HTMLView from "@/lib/prosemirror/views/html-view";
import ParagraphView from "@/lib/prosemirror/views/paragraph-view";
import "katex/dist/katex.min.css";
import MathBlockView from "@/lib/prosemirror/views/math-block-view";
import "~/css/editor.css";
import Toolbar from "@/components/editor/toolbar";
import { ProseMirror } from "@nytimes/react-prosemirror";
import BaseLayout from "@/components/layouts/base-layout";
import "prosemirror-view/style/prosemirror.css";

const nodeViews: { [key: string]: NodeViewConstructor } = {
	paragraph(node, view, getPos) {
		return new ParagraphView(node, view, getPos);
	},
	code(node, view, getPos) {
		return new CodeBlockView(node, view, getPos, mdSchema);
	},
	html(node, view, getPos) {
		return new HTMLView(node, view, getPos, mdSchema);
	},
	math_block(node, view, getPos) {
		return new MathBlockView(node, view, getPos, mdSchema);
	},
};

const editorInitialState = EditorState.create({
	schema: mdSchema,
	plugins: [
		history(),
		keymap(editorKeymap(mdSchema)),
		markdownParser,
		transformer,
		textShortcuts,
		listItemDecorator,
		footnoter,
		tableEditing(),
	],
});

export default function Editor() {
	const [mount, setMount] = useState<HTMLElement | null>(null);

	return (
		<BaseLayout>
			<div className="bg-neutral-50">
				<div className="max-w-7xl w-11/12 pt-10 mx-auto">
					<ProseMirror
						mount={mount}
						defaultState={editorInitialState}
						attributes={{
							// class: "md-editor",
							autofocus: "true",
						}}
						nodeViews={nodeViews}
					>
						<Toolbar />
						<div className="md-editor">
							<div ref={setMount} />
						</div>
					</ProseMirror>
				</div>
			</div>
		</BaseLayout>
	);
}
