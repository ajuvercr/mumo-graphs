<script lang="ts">
	export let name: string;
	export let placeholder: string | undefined;
	export let value: string;
</script>

<div>
	<span>{name}</span>
	<input {placeholder} bind:value />
</div>

<style>
	div {
		display: flex;
		justify-content: space-between;
	}
</style>
