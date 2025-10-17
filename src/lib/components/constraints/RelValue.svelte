<script lang="ts">
	import 'flatpickr/dist/flatpickr.css';
	import type { RelationParameters, RelationConstraint, RelationTypes } from '$lib/constraints';
	import { tooltip } from '$lib/utils';
	import RadioType from '../parts/RadioType.svelte';
	import flatpickr from 'flatpickr';

	export let constraintData: RelationConstraint;
	export let rel: RelationParameters;

	let properties = rel.properties;
	let relations = rel.relations;

	let choice: 'text' | 'number' | 'date' = 'text';
	let tooltipText: string | undefined = undefined;
	let kind: 'normal' | 'error' = 'normal';
	let value: string = constraintData.value;
	let startInput: HTMLInputElement | null = null;
	let startFp: flatpickr.Instance | null = null;

	function validate(value: any, type: string) {
		if (type === 'date') return;
		tooltipText = undefined;
		let out = value;

		if (!value) {
			kind = 'error';
			tooltipText = 'Value is required';
			return false;
		}

		switch (type) {
			case 'number': {
				out = Number(value);
				if (isNaN(out)) {
					kind = 'error';
					tooltipText = 'Must be a valid number';
					return false;
				}
				break;
			}
		}

		constraintData = { ...constraintData, value: out };
		kind = 'normal';
		return true;
	}

	function validateDate(out: Date) {
		tooltipText = undefined;
		if (isNaN(out.getTime())) {
			kind = 'error';
			tooltipText = 'Must be a valid date (e.g. 2024-10-10)';
			return false;
		}

		constraintData = { ...constraintData, value: out.toISOString() };
		kind = 'normal';
	}

	function setupDateInput(el: HTMLInputElement | null, c: typeof choice) {
		startFp?.destroy();

		if (el && c == 'date') {
			return flatpickr(el, {
				enableTime: true,
				dateFormat: 'd-m-Y H:i',
				time_24hr: true,
				onReady: ([out]) => {
					validateDate(out);
				},
				onChange: ([out]) => {
					validateDate(out);
				}
			});
		}
		return null;
	}

	function findPropertyIndex(properties: RelationTypes) {
		return properties.findIndex((x) => x.name === constraintData.property?.name);
	}

	$: properties = rel.properties;
	$: relations = rel.relations;

	$: validate(value, constraintData.choice);
	$: startFp = setupDateInput(startInput, constraintData.choice);

	$: propertyIdx = findPropertyIndex(properties);
	$: typeIdx = relations.findIndex((x) => x.name === constraintData.type?.name);
</script>

<div>
	<select
		bind:value={propertyIdx}
		on:change={() => (constraintData.property = properties[propertyIdx])}
	>
		{#each properties as opt, i}
			<option value={i}>{opt.name}</option>
		{/each}
	</select>
	<select bind:value={typeIdx} on:change={() => (constraintData.type = relations[typeIdx])}>
		{#each relations as opt, i}
			<option value={i}>{opt.name}</option>
		{/each}
	</select>
	<input
		bind:this={startInput}
		use:tooltip={{ text: tooltipText, kind }}
		class:error={kind == 'error'}
		type="text"
		bind:value
	/>
	<RadioType
		bind:value={constraintData.choice}
		on:change={(e) => console.log('changed', e.detail.value)}
	/>
</div>

<style>
	:global(.tooltip) {
		background: #333;
		color: white;
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		font-size: 0.8rem;
		pointer-events: none;
		white-space: nowrap;
		z-index: 1000;
	}
	:global(.tooltip.error) {
		background: #ffdddd;
		color: #b00000;
		border: 1px solid #b00000;
	}
	input.error {
		border-color: #c00;
		background: #fff6f6;
	}

	input.error:focus {
		border-color: #c00;
		box-shadow: 0 0 0 2px rgba(200, 0, 0, 0.15);
	}
	div {
		align-items: center;
		display: flex;
		gap: 0.5em;
	}
</style>
