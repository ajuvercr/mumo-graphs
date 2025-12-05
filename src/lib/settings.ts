import { writable } from 'svelte/store';

export type Settings = {
	sensorLdes: string;
	dataLdes: string;
	dataOptions: string[];
};

const localHost = 'http://localhost:8004/data/by-sensor/index.trig';

export const DEFAULT_SETTINGS: Settings = {
	sensorLdes: 'http://localhost:8004/sensors/by-name/index.trig',
	dataLdes: localHost,
	dataOptions: [localHost]
};

// --- Load from localStorage ---
function loadSettings(): Settings {
	try {
		const json = localStorage.getItem('settings');
		if (!json) return DEFAULT_SETTINGS;
		return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export const settings = writable<Settings>(loadSettings());
