<script lang="ts">
	import { consumePlatforms, type Platform } from '$lib/utils';
	import { onMount } from 'svelte';

	import BaseConstraint from '$lib/components/constraints/Base.svelte';
	import {
		constraintToCondition,
		defaultProperties,
		defaultRelations,
		type Constraint
	} from '$lib/constraints';
	import { Location, NodePath, TypePath } from '$lib/paths';
	import LdesGraph from '$lib/components/LdesGraph.svelte';

	const allLocations: { [id: string]: { name: string; value: string } } = {};
	const allNodes: { [id: string]: { name: string; value: string } } = {};
	const allSensors: { [id: string]: { name: string; value: string } } = {};
	const allTypes: { [id: string]: { name: string; value: string } } = {};

	let locations: { name: string; value: string }[] = [];
	let nodes: { name: string; value: string }[] = [];
	let types: { name: string; value: string }[] = [];

	function updateFound(plat: Platform) {
		if (plat.location && allLocations[plat.location] === undefined) {
			allLocations[plat.location] = { name: plat.location, value: plat.location };
		}
		if (allNodes[plat.id.value] === undefined) {
			allNodes[plat.id.value] = { name: plat.label, value: plat.id.value };
		}
		for (const sensor of plat.sensors) {
			// TODO: this should be isPartOf
			if (allSensors[sensor.id.value] === undefined) {
				allSensors[plat.id.value] = { name: sensor.label, value: sensor.id.value };
			}

			if (allTypes[sensor.observes.id.value] === undefined) {
				allTypes[sensor.observes.id.value] = {
					name: sensor.observes.label,
					value: sensor.observes.id.value
				};
			}
		}

		locations = Object.values(allLocations);
		types = Object.values(allTypes);
		nodes = Object.values(allNodes);
	}

	onMount(() => consumePlatforms(updateFound, fetch, 'http://localhost:8000/by-name/index.trig'));

	const lookup = {
		types: TypePath,
		locations: Location,
		nodes: NodePath
	};
	let configStr = '';

	let constraint = <Constraint>{
		kind: 'and',
		children: [
			{
				kind: 'multi',
				name: 'types',
				values: [
					{
						name: 'temperature',
						value: 'http://mumo.be/data/kind/temperature'
					}
				]
			},
			{
				kind: 'multi',
				name: 'nodes',
				values: [
					{
						name: 'sensor-3',
						value: 'http://mumo.be/data/sensor/0080E11505474BAD'
					},
					{
						name: 'sensor-2',
						value: 'http://mumo.be/data/sensor/0080E1150547BCA5'
					}
				]
			},
			{
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
			},
			{
				kind: 'rel',
				property: {
					name: 'Time',
					value: 'http://def.isotc211.org/iso19156/2011/Observation#OM_Observation.resultTime'
				},
				type: {
					name: 'Greater Than',
					value: 'https://w3id.org/tree#GreaterThanRelation'
				},
				value: '2025-07-30T20:20:00.000Z',
				choice: 'date'
			}
		]
	};

	$: condition = constraintToCondition(constraint, lookup);
	$: configStr = JSON.stringify(constraint, undefined, 2);
</script>

<BaseConstraint
	bind:constraintData={constraint}
	multiOptions={{ types, locations, nodes }}
	relationParameters={{ relations: defaultRelations, properties: defaultProperties }}
/>
<br />
<LdesGraph {condition} />
<br />
<pre>{configStr}</pre>

<style>
	.mem + .mem {
		margin-top: 20px;
	}
</style>
