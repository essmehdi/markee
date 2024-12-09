import { Plugin, TextSelection } from "prosemirror-state";
import mdSchema from "@/lib/prosemirror/editor-schema";
import markdownDecorator from "./decorator";
import { Tokens } from "marked";
import { Fragment } from "prosemirror-model";

const transformer = new Plugin({
	view() {
		return {
			update(view) {
				const parsingResult = markdownDecorator.getState(view.state);
				if (parsingResult) {
					let transaction = view.state.tr;
					let transformsCount = 0;
					let restoreSelection = true;
					parsingResult.htmlTransforms.forEach((transform) => {
						const node = view.state.doc.nodeAt(transform.position);
						if (node && node.type !== transform.targetType) {
							if (
								transform.targetType === mdSchema.nodes.paragraph ||
								transform.targetType === mdSchema.nodes.html
							) {
								transaction = transaction.setNodeMarkup(
									transform.position,
									transform.targetType,
								);
								transformsCount++;
							} else if (transform.targetType === mdSchema.nodes.table) {
								const token = transform.token as Tokens.Table;

								// Table header
								const tableHeaderRow = mdSchema.nodes.table_row.create(
									null,
									token.header.map((tableHeaderCell) => {
										return mdSchema.nodes.table_header.create(
											null,
											mdSchema.text(tableHeaderCell.text),
										);
									}),
								);

								// Table rows
								const tableRows = token.rows.map((row) => {
									return mdSchema.nodes.table_row.create(
										null,
										row.map((cell) =>
											mdSchema.nodes.table_cell.create(
												null,
												mdSchema.text(cell.text),
											),
										),
									)!;
								});

								// Table node
								const table = mdSchema.nodes.table.create(null, [
									tableHeaderRow,
									...tableRows,
								]);

								console.log(
									"Replacing by table from",
									transform.position,
									"to",
									transform.position + token.raw.length,
								);
								// Replace the node with table block
								transaction = transaction.replaceRangeWith(
									transform.position,
									transform.position + token.raw.length,
									table,
								);
								transformsCount++;
								restoreSelection = false;
							}
						}
					});
					if (transformsCount > 0) {
						const currentSelection = view.state.selection;
						if (restoreSelection) {
							transaction = transaction.setSelection(
								TextSelection.create(
									transaction.doc,
									currentSelection.anchor,
									currentSelection.head,
								),
							);
						}
						view.dispatch(transaction);
					}
				}
			},
		};
	},
});

export default transformer;
