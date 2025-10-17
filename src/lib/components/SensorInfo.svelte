<script lang="ts">
	import type { Sensor } from '$lib/configs';
	export let sensor: Sensor;
</script>

<div>
	{sensor.title} observes {sensor.observes}
</div>
