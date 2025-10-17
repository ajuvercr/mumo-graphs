<script lang="ts">
	import type { Device, Node, Sensor, Location } from '$lib/configs';
	import { Accordion, AccordionItem, Card, Listgroup } from 'flowbite-svelte';
	export let linked: boolean = true;
	export let node: Node;

	let devices: {
		[id: string]: {
			sensors: Sensor[];
			title: string;
		};
	} = {};

	function setupDevices(sensors: Sensor[], parts: Device[]) {
		const newDevices: typeof devices = {};

		for (let part of parts) {
			if (!newDevices[part.id]) {
				newDevices[part.id] = { sensors: [], title: part.title };
			}
		}

		for (let sensor of sensors) {
			newDevices[sensor.isPartOf].sensors.push(sensor);
		}

		devices = newDevices;
	}

	function useFulInfo(title: string): string {
		const parts = title.split('-');
		return parts[parts.length - 1].trim();
	}

	function getLocationString(location?: Location): Location[] {
		let loc = location;
		const out = [];

		while (loc) {
			console.log('lcation', location);
			out.push(loc);
			loc = loc.partOf;
		}

		return out;
	}

	function getLocationId(location?: Location): string {
		if (!location) return '';
		const parts = location.id.value.split('/');
		return parts[parts.length - 1];
	}

	let locationString = '';
	let locationId = '';
	$: setupDevices(node.hosts, node.parts);
	$: locationString = getLocationString(node.location)
		.map((x) => x.title)
		.join(' / ');
	$: locationId = getLocationId(node.location);
</script>

<Card padding="xl" size="md">
	<div class="mb-4 flex items-center justify-between">
		{#if linked}
			<a href={'nodes/' + node.title}>
				<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
					Node {node.title}
				</h5>
			</a>
		{:else}
			<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
				Node {node.title}
			</h5>
		{/if}
		{#if locationString.length > 0}
			<span>
				at
				<a
					href={'https://heron.libis.be/momu-test/admin/item/' + locationId}
					target="_blank"
					class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
				>
					{locationString}
				</a>
			</span>
		{/if}
	</div>
	<Accordion flush>
		<AccordionItem paddingFlush="p-2">
			<span slot="header">With {node.hosts.length} sensors</span>
			<ul
				class="divide-y divide-gray-200 bg-white text-gray-500 dark:divide-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
			>
				{#each Object.values(devices) as item}
					<li
						class="w-full list-none px-4 py-2 text-sm font-medium first:rounded-t-lg last:rounded-b-lg"
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium font-semibold text-gray-900 dark:text-white">
								{useFulInfo(item.title)}
							</p>
							<div class="ml-5 flex flex-col text-base text-gray-900 dark:text-white">
								{#each item.sensors as sensor}
									<span>
										{useFulInfo(sensor.title)}
									</span>
								{/each}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</AccordionItem>
	</Accordion>
</Card>
