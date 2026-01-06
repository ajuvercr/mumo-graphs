<script lang="ts">
	import { settings, DEFAULT_SETTINGS } from '$lib/settings';
	import { Button, Input } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	const data = settings;

	// Local bindings to store values
	let dataLdes = '';
	let dataOptions: string[] = [];
	let newOption = '';
	let sensorLdes = '';

	// Subscribe once — initialize values

	settings.subscribe((s) => {
		dataLdes = s.dataLdes;
		dataOptions = s.dataOptions;
		sensorLdes = s.sensorLdes;

		console.log(s);
	});

	// Update the store anytime the selected value changes

	function selectOption(opt: string) {
		settings.update((s) => ({
			...s,
			dataLdes: opt
		}));
	}

	function addOption() {
		if (!newOption.trim()) return;

		const value = newOption.trim();

		settings.update((s) => ({
			...s,
			dataOptions: [...s.dataOptions, value]
		}));

		newOption = '';
	}

	function deleteOption(option: string) {
		settings.update((s) => {
			const newOptions = s.dataOptions.filter((x) => x !== option);

			// Fix selection if the selected value was deleted
			const newSelected = s.dataLdes === option ? (newOptions[0] ?? '') : s.dataLdes;

			return {
				...s,
				dataOptions: newOptions,
				dataLdes: newSelected
			};
		});
	}

	onMount(() => {
		// --- Save to localStorage on every change ---
		settings.subscribe((value) => {
			localStorage.setItem('settings', JSON.stringify(value));
		});
	});

	function reset() {
		settings.update(() => DEFAULT_SETTINGS);
	}
</script>

<div class="centered space-y-4 p-4">
	<fieldset class="space-y-2 rounded border p-3">
		<legend class="mb-2 font-medium text-gray-700"> Sensor LDES location </legend>

		<Input bind:value={$data.sensorLdes} placeholder="https://example.com/sensor" />
	</fieldset>

	<!-- Radio group -->
	<fieldset class="space-y-2 rounded border p-3">
		<legend class="mb-2 font-medium text-gray-700"> Add and choose a data LDES location </legend>
		<div class="flex items-end gap-2">
			<Input
				bind:value={newOption}
				label="Add data option"
				placeholder="https://example.com/ldes"
			/>
			<Button on:click={addOption}>Add</Button>
		</div>

		{#each dataOptions as opt}
			<div class="flex items-center justify-between">
				<!-- Radio + label -->
				<label class="flex flex-1 cursor-pointer items-center gap-2">
					<input
						type="radio"
						name="data-option"
						value={opt}
						checked={dataLdes === opt}
						on:change={() => selectOption(opt)}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500"
					/>
					<span>
						{opt}
					</span>
				</label>

				<!-- Delete button -->
				<Button size="xs" color="red" class="ml-2" on:click={() => deleteOption(opt)}>
					Delete
				</Button>
			</div>
		{/each}
	</fieldset>

	<Button>Save Settings</Button>
	<Button color="alternative" on:click={reset}>Reset Settings</Button>
</div>

<style>
	.centered {
		margin: auto;
		width: 80vw;
		max-width: 1200px;
	}
</style>
