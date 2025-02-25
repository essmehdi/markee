import { ConflictError } from "@/lib/vaults/errors";
import BaseLocalVault from "./base-local-vault";
import { VaultDirectory, VaultItem } from "@/lib/vaults/types";

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
			vaults.push(new BrowserVault(vault.name, vault.name, vault as FileSystemDirectoryHandle));
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
			return Promise.reject(new ConflictError());
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

	/**
	 * Copies a file or directory to the destination
	 * @param source Source item to copy
	 * @param destinationDir Destination directory
	 */
	public async copy(source: VaultItem, destinationDir: VaultDirectory): Promise<void> {
		// Check potential conflict
		try {
			await this.getHandle({
				absolutePath: `${destinationDir.absolutePath}/${source.name}`,
				createdAt: "",
				type: source.type,
				content: null,
				name: "",
			});
			return Promise.reject(new ConflictError());
		} catch { }

		const sourceHandle = await this.getHandle(source);
		const destHandle = await this.getDirectoryHandle(destinationDir.absolutePath);

		if (source.type === "file") {
			const file = await (sourceHandle as FileSystemFileHandle).getFile();
			const newFileHandle = await destHandle.getFileHandle(source.name, { create: true });
			const writable = await newFileHandle.createWritable();
			await writable.write(await file.text());
			await writable.close();
		} else {
			// For directories, recursively copy all contents
			const newDirHandle = await destHandle.getDirectoryHandle(source.name, { create: true });
			const sourceDir = source as VaultDirectory;
			if (sourceDir.content) {
				for (const item of sourceDir.content) {
					await this.copy(item, {
						name: newDirHandle.name,
						type: "directory",
						absolutePath: `${destinationDir.absolutePath}/${source.name}`,
						content: null,
						createdAt: "",
					});
				}
			}
		}
	}

	/**
	 * Moves a file or directory to the destination
	 * @param source Source item to move
	 * @param destinationDir Destination directory
	 */
	public async move(source: VaultItem, destinationDir: VaultDirectory): Promise<void> {
		await this.copy(source, destinationDir);
		await this.remove(source);
	}
}
