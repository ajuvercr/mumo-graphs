import { writable } from 'svelte/store';

export const profile = writable<{ isLoggedIn: boolean; webId?: string }>({ isLoggedIn: false });
