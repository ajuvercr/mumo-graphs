import { writable } from 'svelte/store';

export type Settings = Source[];

export type Source = {
	sensorLdes: string;
	dataLdes: string;
	name: string;
};

export const DEFAULT_SETTINGS: Settings = [];
// --- Load from localStorage ---
function loadSettings(): Settings {
	if (typeof window === 'undefined') {
		return DEFAULT_SETTINGS;
	}

	try {
		const json = localStorage.getItem('settings');
		if (!json) return DEFAULT_SETTINGS;

		const o = JSON.parse(json);
		if (Array.isArray(o)) {
			return o;
		}
	} catch {}
	return DEFAULT_SETTINGS;
}

export const settings = writable<Settings>(loadSettings());

export function setState(state: { sensorLdes: string; dataLdes: string; name: string }) {
	settings.update((x) => {
		const present = x.find((x) => x.name == state.name);
		if (!present) {
			return [...x, state];
		}
		return x;
	});
}
