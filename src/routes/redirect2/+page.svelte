<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		setTimeout(() => {
			window.location.href = '/';
		}, 200);
	});
</script>

<h3>Redirecting</h3>
