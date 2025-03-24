import { ItemFilter } from "~/lib/vaults/base-local-vault";
import { Vault, VaultDirectory, VaultItem } from "~/lib/vaults/types";
import { QueryKey, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
