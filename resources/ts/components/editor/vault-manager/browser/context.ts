import { Clipboard } from "@/components/editor/vault-manager/browser";
import { VaultOperationData } from "@/hooks/vaults/use-vault";
import { VaultItem } from "@/lib/vaults/types";
import { createContext } from "react";

type BrowserContext = {
	selection: VaultItem[];
	clipboard: Clipboard;
	setClipboard: (newClipboard: Clipboard) => void;
	copy: (operationData: VaultOperationData) => void;
	move: (operationData: VaultOperationData) => void;
};

const BrowserContext = createContext<BrowserContext>({
	selection: [],
	clipboard: {
		items: [],
		move: false,
	},
	setClipboard: () => {},
	copy: () => {},
	move: () => {},
});

export default BrowserContext;
