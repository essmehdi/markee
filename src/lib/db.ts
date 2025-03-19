import Dexie, { EntityTable } from "dexie";

export interface SavedVault {
	id: string;
	name: string;
	rootHandle: FileSystemDirectoryHandle;
}

const db = new Dexie("VaultsDB") as Dexie & {
	vaults: EntityTable<SavedVault, 'id'>
}

db.version(1).stores({
	vaults: '++id, name, rootHandle'
});

export { db };