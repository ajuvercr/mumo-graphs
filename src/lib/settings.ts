import { writable } from 'svelte/store';

export type Settings = {
	sensorLdes: string;
	dataLdes: string;
	dataOptions: string[];
};

const localHost = 'https://another.mumodashboard.be/data/by-sensor/root/index.trig';

export const DEFAULT_SETTINGS: Settings = {
	sensorLdes: 'https://another.mumodashboard.be/sensors/by-name/index.trig',
	dataLdes: localHost,
	dataOptions: [localHost]
};

// --- Load from localStorage ---
function loadSettings(): Settings {
	if (typeof window === 'undefined') {
		return DEFAULT_SETTINGS;
	}
	try {
		const json = localStorage.getItem('settings');
		if (!json) return DEFAULT_SETTINGS;
		return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export const settings = writable<Settings>(loadSettings());
