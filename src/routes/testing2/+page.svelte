<script lang="ts">
	import RelValue from '$lib/components/constraints/RelValue.svelte';
	import { defaultProperties, defaultRelations, type RelationConstraint } from '$lib/constraints';

	let constraintData: RelationConstraint = {
		kind: 'rel',
		property: {
			name: 'Time',
			value: 'http://def.isotc211.org/iso19156/2011/Observation#OM_Observation.resultTime'
		},
		type: {
			name: 'Less Than',
			value: 'https://w3id.org/tree#LessThanRelation'
		},
		value: '2025-07-30T20:30:00.000Z',
		choice: 'date'
	};

	let rel = {
		relations: defaultRelations,
		properties: defaultProperties
	};

	$: st = JSON.stringify(constraintData, undefined, 2);
</script>

<pre>
	{st}
</pre>
<RelValue {rel} bind:constraintData />
