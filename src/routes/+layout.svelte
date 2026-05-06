<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
	<title>Tailored Resume</title>
</svelte:head>

<!-- Global Noise Filter -->
<svg style="position: fixed; width: 0; height: 0; pointer-events: none;">
	<filter id="grainy">
		<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
		<feColorMatrix type="saturate" values="0" />
	</filter>
</svg>

<div class="blob-background">
	<div class="blob-container">
		<div class="blob blob-1"></div>
		<div class="blob blob-2"></div>
		<div class="blob blob-3"></div>
	</div>
	<div class="noise-overlay"></div>
</div>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background-color: #000000;
		color: #fff;
		line-height: 1.6;
		overflow-x: hidden;
	}

	:global(button) {
		cursor: pointer;
		font-family: inherit;
	}

	:global(input), :global(textarea) {
		font-family: inherit;
	}

	.blob-background {
		position: fixed;
		inset: 0;
		z-index: -1;
		background: #000;
		overflow: hidden;
	}

	.blob-container {
		position: absolute;
		inset: 0;
		filter: blur(140px); /* Increased blur for smoother blending */
		opacity: 0.75; /* Brighter visibility */
	}

	.noise-overlay {
		position: absolute;
		inset: 0;
		filter: url(#grainy);
		opacity: 0.15; /* Slightly more apparent grain */
		pointer-events: none;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		animation: float 20s ease-in-out infinite; /* Slightly faster */
	}

	.blob-1 {
		width: 900px;
		height: 900px;
		background: radial-gradient(circle, rgba(19, 228, 228, 0.5) 0%, rgba(19, 228, 228, 0.1) 70%, transparent 100%);
		top: -300px;
		left: -300px;
		animation-duration: 25s;
	}

	.blob-2 {
		width: 800px;
		height: 800px;
		background: radial-gradient(circle, rgba(8, 126, 139, 0.45) 0%, rgba(8, 126, 139, 0.1) 70%, transparent 100%);
		bottom: -200px;
		right: -150px;
		animation-delay: -5s;
		animation-duration: 30s;
	}

	.blob-3 {
		width: 700px;
		height: 700px;
		background: radial-gradient(circle, rgba(19, 228, 228, 0.35) 0%, rgba(19, 228, 228, 0.1) 70%, transparent 100%);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		animation-delay: -10s;
		animation-duration: 35s;
	}

	@keyframes float {
		0%, 100% {
			transform: translate(0, 0) scale(1) rotate(0deg);
		}
		33% {
			transform: translate(250px, -150px) scale(1.2) rotate(10deg);
		}
		66% {
			transform: translate(-150px, 200px) scale(0.8) rotate(-10deg);
		}
	}

	.blob-3 {
		animation-name: float-center;
	}

	@keyframes float-center {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1) rotate(0deg);
		}
		33% {
			transform: translate(-30%, -70%) scale(1.15) rotate(5deg);
		}
		66% {
			transform: translate(-70%, -30%) scale(0.9) rotate(-5deg);
		}
	}
</style>