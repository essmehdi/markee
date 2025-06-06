import { PromiseExtended } from "dexie";
import { db, SavedVault } from "../db";
import BaseLocalVault from "./base-local-vault";

/**
 * Local vault that represents a directory in the local file system
 */
export default class LocalVault extends BaseLocalVault {
  public readonly type = "local";
  private static readonly ID_PREFIX = "local-";
  private dbId: string;

  constructor(
    id: string,
    dbId: string,
    name: string,
    rootHandle: FileSystemDirectoryHandle
  ) {
    super(id, name, rootHandle);
    this.dbId = dbId;
  }

  /**
   * Gets stored vault in IndexedDB
   * @param id Vault id
   * @returns The saved local vault
   */
  static async getLocalVaultFromIndexedDB(id: string) {
    const savedVault = (await db.vaults.get(id))! as SavedVault;
    return new LocalVault(
      LocalVault.ID_PREFIX + savedVault.id,
      savedVault.id,
      savedVault.name,
      savedVault.rootHandle
    );
  }

  /**
   * Gets all the local vaults stored in IndexedDB after initializing them
   * @returns All initialized local vaults from IndexedDB
   */
  static async getAllLocalVaultsFromIndexedDB(): Promise<LocalVault[]> {
    const vaults: LocalVault[] = [];
    await db.vaults.each((savedVault) =>
      vaults.push(
        new LocalVault(
          LocalVault.ID_PREFIX + savedVault.id,
          savedVault.id,
          savedVault.name,
          savedVault.rootHandle
        )
      )
    );
    return vaults;
  }

  /**
   * Stores a new vault in IndexedDB
   * @param vault The vault to save
   * @returns The id of the stored vault
   */
  static saveNewVault(
    name: string,
    rootHandle: FileSystemDirectoryHandle
  ): PromiseExtended<string> {
    const newVault: Omit<SavedVault, "id"> = {
      name,
      rootHandle,
    };
    return db.vaults.add(newVault);
  }

  /**
   * Deletes a vault from IndexedDB by id
   * @param vaultId The id of the vault to delete
   */
  static deleteVaultById(vaultId: string): PromiseExtended<void> {
    return db.vaults.delete(vaultId);
  }

  /**
   * Deletes the vault from IndexedDB
   */
  public delete() {
    LocalVault.deleteVaultById(this.id);
  }

  /**
   * Renames the vault in IndexedDB
   */
  public async rename(name: string): Promise<void> {
    await db.vaults.update(this.dbId, { name });
    this.name = name;
  }
}
