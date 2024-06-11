import { type Writable, writable } from 'svelte/store';

export const Hovered: Writable<string | undefined> = writable("Nothing");
