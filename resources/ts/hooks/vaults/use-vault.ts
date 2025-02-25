import { Vault, VaultDirectory, VaultItem } from "@/lib/vaults/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UseVaultOptions {
	onSettled?: () => void;
}

export interface VaultOperationData {
	items: VaultItem[];
	destination: VaultDirectory;
}

export default function useVault(vault: Vault, options?: UseVaultOptions) {
	const queryClient = useQueryClient();

	const {
		data: items,
		isLoading: isFetching,
		error: fetchError,
	} = useQuery({
		queryKey: ["vault", vault.id],
		queryFn: () => vault.getRootContent(),
	});

	const {
		mutateAsync: copy,
		isPending: isCopying,
		error: copyError,
	} = useMutation({
		mutationFn: async ({ items, destination }: VaultOperationData) => {
			for (const item of items) {
				await vault.copy(item, destination);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vault", vault.id] });
		},
		onSettled: options?.onSettled,
	});

	const {
		mutateAsync: move,
		isPending: isMoving,
		error: moveError,
	} = useMutation({
		mutationFn: async ({ items, destination }: VaultOperationData) => {
			for (const item of items) {
				await vault.move(item, destination);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vault", vault.id] });
		},
		onSettled: options?.onSettled,
	});

	return {
		items,
		isFetching,
		fetchError,
		copy,
		isCopying,
		copyError,
		move,
		isMoving,
		moveError,
	};
}
