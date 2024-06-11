<script lang="ts">
	import Chart from '$lib/components/Chart.svelte';
	import type { PageData } from './$types';
	import type { ScatterData } from '$lib/components/data';
	// import { parse_condition, type Condition } from 'ldes-client/dist/lib/condition/condition';
	import { replicateLDES, type Condition, parse_condition } from 'ldes-client';

	import filter from '$lib/configs/filter.ttl?raw';
	import shape from '$lib/configs/shape.ttl?raw';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { onMount } from 'svelte';
	import { NamedNode, Parser } from 'n3';
	import { extractShapes } from 'rdf-lens';

	export let data: PageData;

	let chart: ChartJS<
		keyof ChartTypeRegistry,
		(number | Point | [number, number] | BubbleDataPoint)[],
		unknown
	>;

	const scatterData: { x: Date; y: number }[] = [];

	scatterData.sort((a, b) => a.x.getTime() - b.x.getTime());
	let graphData: ScatterData = {
		datasets: [
			{
				borderColor: 'red',
				type: 'scatter',
				label: 'Dataset 2',
				data: <Point[]>(<any>scatterData),
				borderWidth: 2
			}
		]
	};

	const lensCache = extractShapes(new Parser().parse(shape));

	const myFetch: typeof fetch = async (a, b) => {
		try {
			const resp = await fetch(a, b);
			return resp;
		} catch (ex: unknown) {
			console.log('fetch failed');
			return new Response('', {
				status: 200
			});
		}
	};

	onMount(async () => {
		console.log(filter);
    console.log(data)
		let shape_quads = new Parser().parse(shape);
		let condition: Condition | undefined;
		try {
			condition = parse_condition(filter, 'file://lib/configs/filter.ttl');
		} catch (ex) {
			console.error(ex);
			throw ex;
		}

		console.log(condition.toString());
		// await new Promise(res => setTimeout(res, 1000));
		const client = replicateLDES({
			url: 'https://mumo.ilabt.imec.be/ldes/sds/root',
			condition,
			shape: {
				quads: shape_quads,
				shapeId: new NamedNode('http://example.org/Measurement')
			},
			fetch: myFetch
		});

		const updateThing = setInterval(() => {
			scatterData.sort((a, b) => a.x.getTime() - b.x.getTime());
			chart.update();
		}, 1000);

		const reader = client.stream({ highWaterMark: 10 }).getReader();
		let el = await reader.read();
		let count = 0;
		while (el) {
			if (el.value) {
				count += 1;
				// console.log(count, 'member', el.value.quads.length);

				const output: {
					result: {
						numericValue: number;
						valueType: string;
					};
					date: Date;
				} = lensCache.lenses['http://example.org/Measurement'].execute(el.value);
				// console.log(output.result.valueType, output.date.toISOString());

				// if (output.result.valueType === 'http://qudt.org/1.1/vocab/unit#DegreeCelsius')
				scatterData.push({ x: output.date, y: output.result.numericValue });
			}

			// if (count > 10) {
			// 	await reader.cancel();
			// 	break;
			// }

			if (el.done) {
				break;
			}

			el = await reader.read();
		}

		scatterData.sort((a, b) => a.x.getTime() - b.x.getTime());
		chart.update();
		clearInterval(updateThing);
		console.log('DONE');
		console.log(Object.keys(lensCache.lenses));
	});
</script>

<main>
	<Chart bind:chart data={graphData} />
</main>
