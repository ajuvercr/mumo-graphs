<script lang="ts">
	import { Hovered } from '$lib/state/hovered';
	import type { Property, Value } from '$lib/types';

	export let item: Value & Property;
	export let key: string;

	console.log('key', key, 'item', item);

	function getValue(item: Value) {
		if (typeof item === 'string') return item;
		if ('display_title' in item) return item.display_title;
		if ('@id' in item) return item['@id'];

		return item['@value'];
	}

	function getKey(key: string, item: Property) {
		if (typeof item === 'string') return key;
		if ('property_label' in item) return item.property_label;

		return key;
	}

	function tooltipKey(key: string, item: Property): string | undefined {
		if (typeof item === 'string') return;
		if ('property_label' in item) return key;

		return;
	}
	function tooltipValue(item: Property): string | undefined {
		if (typeof item === 'string') return;
		if ('display_title' in item && '@id' in item) return <string>item['@id'];
		return;
	}

	$: value = getValue(item);
	$: key_value = getKey(key, item);
	$: key_tooltip = tooltipKey(key, item);
	$: value_tooltip = tooltipValue(item);
</script>

<span>
	{#if key_tooltip}
		<div class="tooltip">
			{key_value}
			<span class="tooltiptext">{key_tooltip}</span>
		</div>
	{:else}
		{key_value}
	{/if}
	:
	{#if value_tooltip}
		<div
			class="tooltip"
			on:mouseenter={() => {
				console.log('mouse enters', value_tooltip);
				Hovered.set(value_tooltip);
			}}
			on:mouseout={() => Hovered.set(undefined)}
		>
			{value}
			<span class="tooltiptext">{value_tooltip}</span>
		</div>
	{:else}
		{value}
	{/if}
</span>

<style>
	.tooltip {
		position: relative;
		display: inline-block;
		border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
	}

	/* Tooltip text */
	.tooltip .tooltiptext {
		visibility: hidden;
		background-color: black;
		color: #fff;
		text-align: center;
		padding: 4px 4px;
		margin-top: -2px;
		margin-left: 2px;
		border-radius: 6px;

		text-wrap: nowrap;

		/* Position the tooltip text - see examples below! */
		position: absolute;
		z-index: 1;
	}

	/* Show the tooltip text when you mouse over the tooltip container */
	.tooltip:hover .tooltiptext {
		visibility: visible;
	}
</style>
