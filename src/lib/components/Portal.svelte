<script context="module">
	import { tick } from 'svelte';

	export function portal(node, { element, bodyClass }) {
		let target;

		async function update({ element, bodyClass }) {
			// await potentially pending tasks first
			await tick();

			if (typeof element === 'string') {
				target = document.querySelector(element);
			} else if (element instanceof HTMLElement) {
				target = element;
			}

			if (!target) {
				const message =
					'Argument `element` must be an instance of HTMLElement or a valid CSS selector.';
				throw new TypeError(message);
			}

			if (bodyClass) {
				// Adds the bodyClass, if set, in order to be able to
				// style the rest of the app according to the portal.
				// `:global(body .style-name)` is not very useful here,
				// because of a bug in Svelte that prevents CSS set via
				// `:global()` to be automatically unset when components
				// are unmounted.
				document.body.classList.add(bodyClass);
			}

			// Append the portal node to the target element
			target.appendChild(node);

			// The Portal component is set to `hidden` by default in order to
			// avoid potential flashes of unstyled content. If you're setting
			// the `portal` function as a use action (`use:portal={options}`),
			// remember setting the `hidden` attribute on the same element.
			node.hidden = false;
		}

		update({ element, bodyClass });

		return {
			update,
			destroy() {
				// Remove the bodyClass after unmounting the portal.
				if (bodyClass) {
					document.body.classList.remove(bodyClass);
				}
			}
		};
	}
</script>

<script>
	export let target = 'body';
	export let bodyClass = '';
</script>

<div hidden class="portal" use:portal={{ element: target, bodyClass }}>
	<slot></slot>
</div>

