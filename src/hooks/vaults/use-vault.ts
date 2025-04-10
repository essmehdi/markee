import BaseLocalVault, { ItemFilter } from "~/lib/vaults/base-local-vault";
import { Vault, VaultDirectory, VaultItem } from "~/lib/vaults/types";
import {
	QueryKey,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useSourceManager } from "~/lib/store/source-manager";

const SUPPORTED_FILE_EXTENSIONS_REGEX = /\.(txt|md)$/i;

interface UseVaultOptions {
	queryKey?: QueryKey;
	onSettled?: () => void;
	filter?: ItemFilter;
}

export interface VaultOperationData {
	items: VaultItem[];
	destination: VaultDirectory;
}

export default function useVault(vault: Vault, options?: UseVaultOptions) {
	const queryClient = useQueryClient();
	const currentSource = useSourceManager((state) => state.currentSource);
	const changeCurrentSource = useSourceManager(
		(state) => state.changeCurrentSource,
	);

	const {
		data: items,
		isLoading: isFetching,
		error: fetchError,
	} = useQuery({
		queryKey: options?.queryKey ? options.queryKey : ["vault", vault.id],
		queryFn: () =>
			vault.getRootContent({
				fileNameRegex:
					options?.filter?.fileNameRegex ?? SUPPORTED_FILE_EXTENSIONS_REGEX,
				type: options?.filter?.type,
			}),
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
			return await Promise.all(
				items.map((item) => vault.move(item, destination)),
			);
		},
		onError: (error) => {
			console.error(error);
		},
		onSuccess: (data, variables) => {
			// If currentSource file was moved, update the currentSource state.
			const oldCurrentFileIndex =
				currentSource !== null && currentSource.vault.id === vault.id
					? variables.items.findIndex((item) =>
						item.type === "file"
							? item.absolutePath === currentSource?.file.absolutePath
							: currentSource?.file.absolutePath.startsWith(
								item.absolutePath,
							),
					)
					: -1;
			if (oldCurrentFileIndex !== -1) {
				const movedItem = data[oldCurrentFileIndex];
				let newFile;
				if (movedItem.type === "file") {
					newFile = movedItem;
				} else {
					newFile = {
						...currentSource!.file,
						absolutePath: BaseLocalVault.joinPaths(
							movedItem.absolutePath,
							currentSource!.file.name,
						),
					};
				}
				changeCurrentSource({
					...currentSource!,
					file: newFile,
				});
			}
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
