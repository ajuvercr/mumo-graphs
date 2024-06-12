<script context="module" lang="ts">
	export type Config = {
		name: string;
		url: string;

		location: { value: string; label: string }[];
		node?: string[];
		type?: string[];
	};
</script>

<script lang="ts">
	import {
		Input,
		Label,
		Helper,
		Button,
		Card,
		CloseButton,
		ButtonGroup,
		Dropdown,
		DropdownItem
	} from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { createEventDispatcher } from 'svelte';

	export let locations = [
		{ label: 'Casino Kursaal', value: 'https://heron.libis.be/momu-test/api/items/20337' },
		{ label: 'LZ.UNIT.78', value: 'https://heron.libis.be/momu-test/api/items/16773' }
	];

	export const config: Config = {
		name: '',
		url: 'https://mumo.ilabt.imec.be/ldes/sds/root',
		location: [locations[0]]
	};

	const dispatch = createEventDispatcher<{ change: Config }>();

	console.log('locations', locations);
	function validate() {
		console.log('Validating', config);
		dispatch('change', config);
	}

	let emptyLocation = locations[0];
	function addLocation() {
		config.location = [emptyLocation, ...config.location];
		emptyLocation = locations[0];
	}

	function removeLocation(id: number) {
		console.log('removing id', id);
		config.location.splice(id, 1);
		config.location = [...config.location];
		console.log(config.location);
	}
</script>

<div class="mb-6 grid gap-6">
	<div>
		<Label for="name" class="mb-2">Graph Name</Label>
		<Input type="text" id="name" placeholder="EpicName" bind:value={config.name} />
	</div>
	<div>
		<Label for="url" class="mb-2">LDES Url</Label>
		<Input type="text" id="url" placeholder="Url" bind:value={config.url} />
	</div>

	<div>
		Location:
		<ButtonGroup>
			<Button color="alternative"
				>{emptyLocation.label}<ChevronDownOutline
					class="ms-2 h-6 w-6 text-white dark:text-white"
				/></Button
			>
			<Button on:click={addLocation} color="primary">Add</Button>
		</ButtonGroup>

		<Dropdown classContainer="w-40">
			{#each locations as thing, i}
				<DropdownItem
					active={i == 0}
					on:click={() => {
						emptyLocation = thing;
					}}
					class={emptyLocation.value === thing.value ? 'underline' : ''}
				>
					{thing.label}
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>

	{#each config.location as _, i}
		<div>
			<ButtonGroup>
				<Input type="text" bind:value={config.location[i].label} />
				<CloseButton on:click={() => removeLocation(i)} />
			</ButtonGroup>
		</div>
	{/each}
</div>

<Button on:click={validate} class="w-fit">Validate!</Button>
