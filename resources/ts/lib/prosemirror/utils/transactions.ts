import { Command, EditorState, Transaction } from "prosemirror-state";

/**
 * Adds command steps to a transaction
 * @param state The state where the transaction if coming from
 * @param transaction The transaction to add steps to
 * @param command The command to add steps from
 */
export function addCommandToTransaction(
	state: EditorState,
	transaction: Transaction,
	command: Command
): void {
	command(state.apply(transaction), (tr) =>
		tr.steps.forEach((step) => transaction.step(step))
	);
}
