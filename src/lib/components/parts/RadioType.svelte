<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let options: string[] = ['text', 'number', 'date'];
	export let value: string = 'text';
	export let name = 'type-' + Math.random().toString(36).slice(2);

	export let small = false;

	const dispatch = createEventDispatcher();

	function handleChange() {
		dispatch('change', { value });
	}
</script>

<!-- accessible radiogroup -->
<div class="radios" role="radiogroup" aria-label="Value type">
	{#each options as option}
		<label class="option" class:small>
			<input type="radio" {name} bind:group={value} value={option} on:change={handleChange} />
			<span>{option}</span>
		</label>
	{/each}
</div>

<style>
	.radios {
		display: flex;
		gap: 0.1rem;
		align-items: center;
	}

	/* label acts as clickable button */
	.option {
		display: inline-flex;
		align-items: center;
		/* make the label shrink/expand naturally */
		flex: 0 0 auto;
		cursor: pointer;
		user-select: none;
		position: relative;
	}

	/* hide the native radio but keep it accessible */
	.option input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
	}

	/* the visible button */
	.option span {
		display: inline-block;
		padding: 0.35rem 0.75rem;
		border: 1px solid #cfcfcf;
		border-radius: 8px;
		background: white;
		font-size: 0.95rem;
		transition:
			background 0.12s ease,
			color 0.12s ease,
			border-color 0.12s ease,
			transform 0.08s ease;
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}

	.small span {
		font-size: 0.7rem;
		padding: 0.15rem 0.3rem;
		display: flex;
		justify-content: center; /* horizontal */
		align-items: center; /* vertical */
	}

	/* checked state */
	.option input:checked + span {
		background: #222;
		color: white;
		border-color: #222;
	}

	/* hover/active affordances */
	.option:hover span {
		transform: translateY(-1px);
	}
	.option:active span {
		transform: translateY(0);
	}

	/* focus ring for keyboard users */
	.option input:focus + span {
		box-shadow: 0 0 0 3px rgba(34, 34, 34, 0.12);
		outline: none;
	}
</style>
