<script lang="ts">
	export let className: string = '';
</script>

<div class="group relative inline-block">
	<!-- Outline (default slot) -->
	<div class={`duration-50 inset-0 transition-opacity group-hover:opacity-0 ${className}`}>
		<slot name="outline" />
	</div>

	<!-- Solid (hover slot) -->
	<div
		class={`duration-50 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${className}`}
	>
		<slot name="solid" />
	</div>
</div>
