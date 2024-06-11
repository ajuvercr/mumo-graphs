<script lang="ts">
	import type { JsonObject, JsonObjectValue, Property, Value } from '$lib/types';
	import Field from './Field.svelte';
	import { Hovered } from '$lib/state/hovered';
	import { derived } from 'svelte/store';
	export let object: JsonObject;

	function saveValue(value: (Value & Property) | string | number | undefined): boolean {
		if (!value) return false;
		if (typeof value === 'string') return true;
		if (typeof value === 'object') {
			if ('@value' in value || '@id' in value) return true;
			return false;
		}
		return false;
	}

	function saveKey(key: string): boolean {
		if (key.startsWith('@')) return false;
		if (key.startsWith('o:')) return false;
		return true;
	}

	const KeysOrder: { [label: string]: number } = {
		'dcterms:title': 5,
		'dcterms:identifier': 4,
		'dcterms:description': 3.5,
		'dcterms:isPartOf': 3,
		'sosa:hosts': 3,
		'sosa:isHostedBy': 3,
		'sosa:observes': 2
	};

	function cmp(alpha: string, beta: string): number {
		return (KeysOrder[beta] || 0) - (KeysOrder[alpha] || 0);
	}

	$: idValue = <string>object['@id'];
	$: orderedKeys = Object.keys(object).sort(cmp);

	const selected = derived(
		Hovered,
		(id) => {
			console.log('Check if selected', id, idValue);
			return id == idValue;
		},
		false
	);
</script>

<div class:selected={$selected} class:default={true}>
	<header>
		<Field key={'@id'} item={idValue} />
	</header>
	<div class="properties">
		{#each orderedKeys as key}
			{@const value = object[key]}
			{#if !!value}
				{#if Array.isArray(value)}
					{#each value as v}
						{#if saveValue(v) && saveKey(key)}
							<Field {key} item={v} />
						{/if}{/each}
				{:else if saveValue(value) && saveKey(key)}
					<Field {key} item={value} />
				{/if}
			{/if}
		{/each}
	</div>
</div>

<style>
  header {
    margin-bottom: 8px;

  }
	.default {
		border: dotted transparent 4px;
    padding: 8px;
	}
	.selected {
		border: solid gray 4px;
	}

	.properties {
		display: flex;
		flex-direction: column;
	}
</style>
