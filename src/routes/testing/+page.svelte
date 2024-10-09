<script lang="ts">
	import { fetch_f, proxy_fetch } from '$lib/utils';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let text = '';
	let running = true;
	let code = 0;
	let body = 'no body';

	onMount(async () => {
		const a = 'https://mumo.ilabt.imec.be/nodes/default/mumo-v2-018/';
		const proxy = encodeURIComponent(a.toString());
		const resp = await fetch(base + '/api/proxy?proxy=' + proxy);
		code = resp.status;
		text = resp.statusText;

		body = await resp.text();
	});
</script>

<p>Testing Page</p>

<p>Code {code} {text}</p>

<p>{body}</p>
