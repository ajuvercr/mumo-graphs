<script lang="ts">
	import { TrashBinOutline, TrashBinSolid } from 'flowbite-svelte-icons';
	import HoverIcon from './HoverIcon.svelte';

	import { createEventDispatcher } from 'svelte';

	let confirming = false;

	const dispatch = createEventDispatcher<{ delete: null }>();
</script>

<div class="flex items-center gap-2">
	{#if confirming}
		<button
			class="rounded bg-red-600 px-2 py-1 text-white"
			on:click={() => {
				console.log('deleted');
				confirming = false;
				dispatch('delete', null);
			}}
		>
			Confirm
		</button>

		<button class="text-sm underline" on:click={() => (confirming = false)}> Cancel </button>
	{:else}
		<button on:click={() => (confirming = true)}>
			<HoverIcon className="text-red-500">
				<TrashBinOutline size="lg" slot="outline" />
				<TrashBinSolid size="lg" slot="solid" />
			</HoverIcon>
		</button>
	{/if}
</div>
