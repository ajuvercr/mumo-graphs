<script lang="ts">
	import { settings, type Source } from '$lib/settings';
	import { Button, Input } from 'flowbite-svelte';
	import { onDestroy, onMount } from 'svelte';
	import type { Unsubscriber } from 'svelte/store';

	let name = '';
	let sensorLdes = '';
	let dataLdes = '';

	function addSource() {
		const source: Source = {
			name: name.trim(),
			sensorLdes: sensorLdes.trim(),
			dataLdes: dataLdes.trim()
		};

		if (!source.name || !source.sensorLdes || !source.dataLdes) return;

		settings.update((sources) => [...sources, source]);

		// reset form
		name = sensorLdes = dataLdes = '';
	}

	function deleteSource(source: string) {
		console.log('deleting', source);
		settings.update((sources) => sources.filter((s) => s.name !== source));
	}

	function prettyUrl(url: string, base: string) {
		const u = new URL(url);
		if (u.hostname === base) {
			return u.pathname;
		}
		return url;
	}

	let unsubscribe: Unsubscriber | undefined = undefined;
	onMount(() => {
		// persist settings
		unsubscribe = settings.subscribe((value) => {
			localStorage.setItem('settings', JSON.stringify(value));
		});
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<div class="centered space-y-6 p-4">
	<section class="overflow-x-auto">
		<table class="w-full border-collapse text-sm">
			<thead class="border-b text-left text-gray-600">
				<tr>
					<th class="py-2 pr-4 font-medium">Name</th>
					<th class="py-2 pr-4 font-medium">Sensor LDES</th>
					<th class="py-2 pr-4 font-medium">Data LDES</th>
					<th class="py-2 text-right font-medium"></th>
				</tr>
			</thead>

			<tbody>
				{#each $settings as source (source.name)}
					<tr class="border-b last:border-0">
						<td class="py-2 pr-4">
							{source.name}
						</td>

						<td class="max-w-[28rem] py-2 pr-4">
							<span class="block truncate font-mono text-gray-600" title={source.sensorLdes}>
								{prettyUrl(source.sensorLdes, source.name)}
							</span>
						</td>

						<td class="max-w-[28rem] py-2 pr-4">
							<span class="block truncate font-mono text-gray-600" title={source.dataLdes}>
								{prettyUrl(source.dataLdes, source.name)}
							</span>
						</td>

						<td class="py-2 text-right">
							<Button size="xs" color="red" on:click={() => deleteSource(source.name)}
								>Delete</Button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="space-y-3 rounded border p-4">
		<h2 class="font-semibold text-gray-700">Add data source</h2>

		<div class="grid grid-cols-[10rem_1fr] items-center gap-2">
			<label class="text-sm text-gray-600">Name:</label>
			<Input bind:value={name} placeholder="mumo.faro.be" />

			<label class="text-sm text-gray-600">Sensor LDES:</label>
			<Input
				bind:value={sensorLdes}
				placeholder="https://mumo.faro.be/sensors/by-location/index.trig"
			/>

			<label class="text-sm text-gray-600">Data LDES:</label>
			<Input
				bind:value={dataLdes}
				placeholder="https://mumo.faro.be/data/by-location/root/index.trig"
			/>
		</div>

		<div class="pt-2">
			<Button on:click={addSource}>Add source</Button>
		</div>
	</section>
</div>

<style>
	.centered {
		margin: auto;
		width: 80vw;
		max-width: 1200px;
	}
</style>
