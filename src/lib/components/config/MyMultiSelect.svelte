<script lang="ts">
	import { MultiSelect } from 'flowbite-svelte';

	type T = $$Generic;

	export let value: { value: T; name: string }[];
	export let items: { value: T; name: string }[];

	let strSelected = value.map((x) => JSON.stringify(x));
	$: strItems = items.map((x) => ({ name: x.name, value: JSON.stringify(x) }));

	function change() {
		value = strSelected.map((x) => JSON.parse(x));
		console.log('mms change', strSelected, value);
	}
</script>

<MultiSelect {...$$restProps} items={strItems} bind:value={strSelected} on:change={change} />
