import { VaultItem } from "@/lib/vaults/types";
import { ClipboardText, Scissors } from "@phosphor-icons/react";

type BrowserClipboardIndicatorProps = {
	items: VaultItem[];
	isCopying?: boolean;
	isMoving?: boolean;
};

export default function BrowserClipboardIndicator({
	items,
	isCopying = false,
	isMoving = false,
}: BrowserClipboardIndicatorProps) {
	if (!items.length) return null;

	const itemsMessage = `${items.length} item${items.length !== 1 ? "s" : ""}`;

	return (
		<div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-secondary-foreground">
			<ClipboardText weight="bold" size={16} />
			{isMoving ? (
				<span className="text-secondary-foreground text-sm">Moving {itemsMessage}</span>
			) : isCopying ? (
				<span className="text-secondary-foreground text-sm">Copying {itemsMessage}</span>
			) : (
				<span className="text-secondary-foreground text-sm">{itemsMessage} in clipboard</span>
			)}
		</div>
	);
}
