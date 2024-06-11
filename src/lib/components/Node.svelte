<script lang="ts">
	import { Flex, Badge, Button, Card, Group, Image, Text, Title } from '@svelteuidev/core';
	import Sensor from './Sensor.svelte';
	import type { SensorProp } from '$lib/consts';

	export let title: string;
	export let description: string;
	export let sensors: SensorProp[];
</script>

<div class="card">
	<header>
		{title}
	</header>

	<section>
		{description}
	</section>

	<footer>
		<header>Sensors:</header>
		<section>
			{#each sensors as sensor}
				<Sensor {...sensor} />
			{/each}
		</section>
	</footer>
</div>

<style>
	.card {
		flex-direction: column;
		display: flex;
		gap: 4px;
		padding: 10px 20px;
		justify-content: space-between;
		/* background-color: lightgray; */
		box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
	}

	header {
		margin: 20px 0;
	}

	footer {
		padding: 10px;
	}
	footer header {
		font-weight: bolder;
	}

	footer section {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: 5px;
	}
</style>
