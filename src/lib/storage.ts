export class LocalStorage {
	constructor(private storage: Storage) {
		this.storage = storage;
	}

	set(key: string, value: any) {
		this.storage.setItem(key, JSON.stringify(value));
	}

	get<T>(key: string): T | null {
		const item = this.storage.getItem(key);
		return item ? (JSON.parse(item) as T) : null;
	}

	remove(key: string) {
		this.storage.removeItem(key);
	}

	clear() {
		this.storage.clear();
	}
}

export const storage = new LocalStorage(localStorage);
