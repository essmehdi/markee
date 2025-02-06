import { ConflictError } from "@/lib/vaults/errors";
import BaseLocalVault from "./base-local-vault";

export default class BrowserVault extends BaseLocalVault {
	private static readonly VAULTS_FOLDER_NAME = "vaults";
	public readonly type = "browser";

	/**
	 * Gets the vaults directory from OPFS
	 */
	private static async getVaultsDir() {
		const storageRoot = await navigator.storage.getDirectory();
		const vaultsDirHandle = await storageRoot.getDirectoryHandle(BrowserVault.VAULTS_FOLDER_NAME, { create: true });
		return vaultsDirHandle;
	}

	/**
	 * Gets stored vault in OPFS
	 * @param id Vault id
	 * @returns The saved local vault
	 */
	static async getBrowserVault(name: string) {
		const vaultsDir = await BrowserVault.getVaultsDir();
		return vaultsDir.getDirectoryHandle(name);
	}

	/**
	 * Gets all the local vaults stored in OPFS after initializing them
	 * @returns All initialized local vaults from OPFS
	 */
	static async getAllBrowserVaults(): Promise<BrowserVault[]> {
		const vaultsDir = await BrowserVault.getVaultsDir();
		const vaults: BrowserVault[] = [];
		for await (const vault of vaultsDir.values()) {
			vaults.push(new BrowserVault(vault.name, vault.name, vault as FileSystemDirectoryHandle))
		}
		return vaults;
	}

	/**
	 * Stores a new vault in OPFS
	 * @param vault The vault to save
	 * @returns The id of the stored vault
	 */
	static async saveNewVault(name: string): Promise<FileSystemDirectoryHandle> {
		const storageRoot = await navigator.storage.getDirectory();
		const vaultsDirHandle = await storageRoot.getDirectoryHandle(BrowserVault.VAULTS_FOLDER_NAME, { create: true });
		try {
			await vaultsDirHandle.getDirectoryHandle(name);
			throw new ConflictError();
		} catch {
			// Ignore
		}
		const rootHandle = await vaultsDirHandle.getDirectoryHandle(name, { create: true });
		return rootHandle;
	}

	/**
	 * Deletes a vault from OPFS by name
	 * @param vaultId The id of the vault to delete
	 */
	static async deleteVault(name: string): Promise<void> {
		const vaultsDir = await BrowserVault.getVaultsDir();
		vaultsDir.removeEntry(name);
	}

	/**
	 * Deletes the vault from OPFS
	 */
	public delete() {
		BrowserVault.deleteVault(this.name);
	}
}
