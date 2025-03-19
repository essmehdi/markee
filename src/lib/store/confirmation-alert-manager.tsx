import { create } from "zustand";

type ConfirmationAlertManagerStore = {
	open: boolean;
	action: (() => void | Promise<void>) | null;
	title: string | null;
	description: string | null;

	showConfirmationAlert: (
		action: () => void | Promise<void>,
		title?: string,
		description?: string,
	) => void;
	closeConfirmationAlert: () => void;

	_onChangeOpen: (open: boolean) => void;
};

const useConfirmationAlert = create<ConfirmationAlertManagerStore>()(
	(set, get) => ({
		open: false,
		action: null,
		title: null,
		description: null,

		showConfirmationAlert: (action, title?: string, description?: string) => {
			set((state) => ({
				...state,
				open: true,
				action,
				title: title ?? null,
				description: description ?? null,
			}));
		},
		closeConfirmationAlert: () => {
			set((state) => ({
				...state,
				open: false,
				action: null,
				title: null,
				description: null,
			}));
		},

		_onChangeOpen: () => {
			if (!open) {
				get().closeDialog();
			}
		},
	}),
);

export default useConfirmationAlert;
