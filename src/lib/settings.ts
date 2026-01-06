import { writable } from 'svelte/store';

export type Settings = {
	sensorLdes: string;
	dataLdes: string;
	dataOptions: string[];
};

const localHost = 'https://another.mumodashboard.be/data/by-location/root/index.trig';

export const DEFAULT_SETTINGS: Settings = {
	sensorLdes: 'https://another.mumodashboard.be/sensors/by-location/index.trig',
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

export function setState(state: { sensors: string; data: string }) {
	settings.update((x) => {
		x.dataLdes = state.data;
		x.sensorLdes = state.sensors;
		const present = x.dataOptions.find((x) => x == state.data);
		if (!present) {
			x.dataOptions.push(state.data);
		}
		return x;
	});
}
