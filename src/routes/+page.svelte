<script lang="ts">
	import { onMount, tick } from 'svelte';
	import EditableResumePreview from '$lib/EditableResumePreview.svelte';

	let { data } = $props();

	let gsap: any;

	// ── Session state ────────────────────────────────────────────────────────
	let isLoggedIn = $derived(!!data.user);
	let sessionEmail = $derived(data.user?.email || '');
	
	let authMode = $state<'login' | 'register'>('login');
	let authEmailInput = $state('');
	let authPasswordInput = $state('');
	let authError = $state('');
	let isAuthenticating = $state(false);

	async function handleAuth() {
		isAuthenticating = true;
		authError = '';
		const endpoint = `/api/auth/${authMode}`;
		
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: authEmailInput, password: authPasswordInput })
			});
			const result = await res.json();
			if (res.ok) {
				window.location.reload(); 
			} else {
				authError = result.error || 'Authentication failed.';
			}
		} catch (e) {
			authError = 'Internal error. Please try again.';
		} finally {
			isAuthenticating = false;
		}
	}

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.reload();
	}

	// ── Resume generation state ──────────────────────────────────────────────
	let resumeMode = $state<'standard' | 'tech'>('standard');
	let jobDescription = $state('');
	let resumeContent = $state('');
	let structuredResume = $state<any>(null);
	let isGenerating = $state(false);
	let hasResume = $state(false);
	let generateError = $state('');
	let extractedSkills = $state<string[]>([]);
	let companyName = $state('');

	const STEPS = [
		{ id: 'ai', label: 'AI tailoring resume' },
		{ id: 'validate', label: 'Validating output' },
		{ id: 'format', label: 'Formatting for ATS' }
	] as const;
	let currentStepIdx = $state(-1);

	function setStep(idx: number) {
		currentStepIdx = idx;
	}

	function onModeChange(newMode: 'standard' | 'tech') {
		resumeMode = newMode;
		hasResume = false;
		structuredResume = null;
		resumeContent = '';
		extractedSkills = [];
		companyName = '';
		generateError = '';
	}

	async function generateResume() {
		if (!jobDescription.trim()) return;

		isGenerating = true;
		hasResume = false;
		generateError = '';
		currentStepIdx = 0;

		try {
			setStep(0);
			const res = await fetch('/api/generate-resume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jobText: jobDescription, mode: resumeMode })
			});

			setStep(1);
			const data = await res.json();

			if (!res.ok) {
				generateError = data.error ?? 'Generation failed.';
				return;
			}

			setStep(2);
			resumeContent = data.formatted;
			structuredResume = data.resume;
			extractedSkills = data.extractedSkills || [];
			companyName = data.companyName || '';
			hasResume = true;
			
			if (gsap) {
				gsap.from(".resume-card", { duration: 1, y: 50, opacity: 0, ease: "power4.out", delay: 0.2 });
			}
		} catch (e) {
			generateError = 'Network error — check your connection.';
		} finally {
			isGenerating = false;
			currentStepIdx = -1;
		}
	}

	function retry() {
		generateError = '';
		generateResume();
	}

	async function downloadPdf() {
		if (!structuredResume) return;
		try {
			const res = await fetch('/api/download-pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(structuredResume)
			});
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				const cleanName = companyName ? companyName.replace(/[^a-zA-Z0-9]/g, '_') : 'resume';
				a.download = `${cleanName}.pdf`;
				a.click();
				URL.revokeObjectURL(url);
			}
		} catch {
			alert('PDF failed.');
		}
	}

	onMount(async () => {
		// Dynamic import to avoid SSR 'self is not defined'
		const module = await import('gsap');
		gsap = module.gsap;

		await tick();

		// GSAP Entrance
		const tl = gsap.timeline();
		if (document.querySelector(".logo-area")) {
			tl.from(".logo-area", { duration: 1.2, y: -40, opacity: 0, ease: "expo.out" });
		}
		if (document.querySelector(".tagline")) {
			tl.from(".tagline", { duration: 0.8, opacity: 0, ease: "power2.out" }, "-=0.6");
		}
		if (document.querySelector(".hero-card")) {
			tl.from(".hero-card", { duration: 1, scale: 0.95, opacity: 0, ease: "back.out(1.2)" }, "-=0.4");
		}
		
		const appCards = document.querySelectorAll(".app-card");
		if (appCards.length > 0) {
			tl.from(appCards, { duration: 1, y: 30, opacity: 0, stagger: 0.2, ease: "power3.out" }, "-=0.6");
		}
	});
</script>

<main>
	<div class="bg-vignette"></div>
	<div class="bg-grid"></div>

	<div class="container">
		<header class="logo-area">
			{#if isLoggedIn}
				<div class="user-chip">
					<span class="status-pulse"></span>
					<span class="user-email">{sessionEmail}</span>
					<button class="btn-text" onclick={handleLogout}>Sign out</button>
				</div>
			{/if}
			<div class="logo-wrap">
				<span class="logo-symbol">◈</span>
				<h1 class="logo-text">GRAVITY</h1>
			</div>
			<p class="tagline">Precision Tailoring. Zero Hallucination.</p>
		</header>

		{#if !isLoggedIn}
			<section class="hero-card auth-gate">
				<div class="auth-box">
					<div class="auth-header">
						<h2>{authMode === 'login' ? 'Welcome Back' : 'Create Access'}</h2>
						<p>{authMode === 'login' ? 'Sign in to manage your precision resumes.' : 'Limited to 5 elite users. Secure your spot.'}</p>
					</div>

					<form class="form-stack" onsubmit={(e) => { e.preventDefault(); handleAuth(); }}>
						<div class="input-group">
							<label for="email">IDENTITY (EMAIL)</label>
							<input type="email" id="email" name="email" bind:value={authEmailInput} placeholder="name@domain.com" autocomplete="email" required />
						</div>
						<div class="input-group">
							<label for="password">ACCESS KEY (PASSWORD)</label>
							<input type="password" id="password" name="password" bind:value={authPasswordInput} placeholder="••••••••" autocomplete="current-password" required />
						</div>
						
						{#if authError}
							<p class="error-text"><span>⚠</span> {authError}</p>
						{/if}

						<button type="submit" class="btn-primary main-cta" disabled={isAuthenticating}>
							{isAuthenticating ? 'VERIFYING...' : (authMode === 'login' ? 'ENTER SYSTEM' : 'INITIATE ACCESS')}
						</button>

						<div class="auth-toggle">
							<span>{authMode === 'login' ? "No access?" : "Already have access?"}</span>
							<button type="button" class="btn-link" onclick={() => authMode = (authMode === 'login' ? 'register' : 'login')}>
								{authMode === 'login' ? 'Request Admission' : 'Existing Identity'}
							</button>
						</div>
					</form>
				</div>
			</section>
		{:else}
			<div class="app-layout">
				<!-- Input Card -->
				<section class="app-card highlight-card">
					<div class="card-top">
						<h3>TARGET ACQUISITION</h3>
						<div class="mode-switcher">
							<button class:active={resumeMode === 'standard'} onclick={() => onModeChange('standard')}>RESUME</button>
							<button class:active={resumeMode === 'tech'} onclick={() => onModeChange('tech')}>TECH RESUME</button>
						</div>
					</div>

					<div class="input-area">
						<textarea bind:value={jobDescription} placeholder="Paste job requirements here..." rows="5"></textarea>
						<button class="btn-accent full-width" onclick={generateResume} disabled={isGenerating || !jobDescription.trim()}>
							{isGenerating ? 'Processing...' : 'INITIALIZE TAILORING'}
						</button>
					</div>

					{#if isGenerating}
						<div class="pipeline-status">
							{#each STEPS as step, i}
								<div class="p-step" class:active={i === currentStepIdx} class:done={i < currentStepIdx}>
									<div class="p-dot"></div>
									<span class="p-label">{step.label}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if generateError}
						<div class="error-alert">
							<p>{generateError}</p>
							<button onclick={retry}>RETRY</button>
						</div>
					{/if}
				</section>

				<!-- Preview Card -->
				<section class="app-card preview-card">
					<div class="card-top">
						<h3>RESUME ARTIFACT</h3>
						{#if hasResume}
							<button class="btn-outline" onclick={downloadPdf}>EXPORT PDF</button>
						{/if}
					</div>

					<div class="preview-scroll">
						{#if !hasResume && !isGenerating}
							<div class="empty-placeholder">
								<span class="pulse-icon">◈</span>
								<p>Waiting for mission payload.</p>
							</div>
						{:else if isGenerating}
							<div class="generating-shim">
								<div class="line-loader"></div>
								<p>SYNTHESIZING...</p>
							</div>
						{:else if hasResume && structuredResume}
							<div class="resume-flow">
								<EditableResumePreview bind:structuredResume {extractedSkills} />
								
								<div class="resume-card-visual">
									<div class="v-header">
										<h4>{structuredResume.personal.name}</h4>
										<p>{structuredResume.personal.email} • {structuredResume.personal.location}</p>
									</div>
									<div class="v-section">
										<h5>SUMMARY</h5>
										<p>{structuredResume.summary}</p>
									</div>
									<div class="v-section">
										<h5>SKILLS</h5>
										<div class="v-chips">
											{#each structuredResume.skills as skill}
												<span>{skill}</span>
											{/each}
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</section>
			</div>
		{/if}

		<footer class="footer">
			<span class="line"></span>
			<p>&copy; 2026 GRAVITY. ALL RIGHTS RESERVED.</p>
			<span class="red-dot"></span>
		</footer>
	</div>
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

	:global(body) {
		margin: 0;
		background: #000; /* AMOLED Black */
		color: #fff;
		font-family: 'Inter', system-ui, sans-serif;
		overflow-x: hidden;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
		position: relative;
		z-index: 10;
	}

	.bg-vignette {
		position: fixed;
		inset: 0;
		background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.85) 100%);
		pointer-events: none;
		z-index: 1;
	}

	.bg-grid {
		position: fixed;
		inset: 0;
		background-image: linear-gradient(rgba(19, 228, 228, 0.03) 1px, transparent 1px), 
						  linear-gradient(90deg, rgba(19, 228, 228, 0.03) 1px, transparent 1px);
		background-size: 60px 60px;
		pointer-events: none;
		z-index: 0;
	}

	/* Typography & Logo */
	.logo-area { margin-bottom: 5rem; text-align: center; }
	.logo-wrap { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 0.5rem; }
	.logo-symbol { font-size: 2.2rem; color: #13E4E4; text-shadow: 0 0 20px rgba(19, 228, 228, 0.5); }
	.logo-text { 
		font-family: 'Press Start 2P', cursive;
		font-size: 1.8rem; 
		font-weight: 400; 
		letter-spacing: -0.05em; 
		margin: 0;
		color: #fff;
	}
	.tagline { 
		font-size: 0.65rem; 
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #13E4E4; 
		margin-top: 1rem;
		opacity: 0.6;
	}

	.user-chip { 
		display: inline-flex;
		align-items: center; 
		gap: 0.75rem;
		background: #0a0a0a; 
		border: 1px solid #1a1a1a;
		padding: 0.4rem 1rem; 
		border-radius: 99px; 
		font-size: 0.7rem;
		margin-bottom: 2rem;
		animation: fadeIn 0.8s ease-out both;
	}
	@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
	.status-pulse { width: 6px; height: 6px; border-radius: 50%; background: #13E4E4; animation: pulse 2s infinite; }
	@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

	/* Cards */
	.hero-card, .app-card {
		background: #111; /* Dark Grey */
		border: 1px solid #222;
		border-radius: 8px; /* Hint of border radius */
		padding: 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
		position: relative;
		overflow: hidden;
	}
	.hero-card::after {
		content: ''; position: absolute; top: 0; right: 0; width: 3px; height: 100%;
		background: linear-gradient(to bottom, transparent, #13E4E4, transparent);
	}

	.auth-gate { max-width: 450px; margin: 0 auto; }
	.auth-header h2 { font-size: 1.5rem; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
	.auth-header p { font-size: 0.85rem; color: #666; margin-bottom: 2rem; }

	.form-stack { display: flex; flex-direction: column; gap: 1.5rem; }
	.input-group label { display: block; font-size: 0.65rem; font-weight: 700; color: #555; margin-bottom: 0.6rem; letter-spacing: 0.1em; }
	.input-group input { 
		width: 100%; background: #000; border: 1px solid #333; 
		padding: 1rem; color: #fff; font-size: 0.9rem; transition: all 0.3s;
		box-sizing: border-box;
		border-radius: 6px;
	}
	.input-group input:focus { border-color: #13E4E4; outline: none; box-shadow: 0 0 0 1px #13E4E4; }

	.btn-primary { 
		background: #13E4E4; color: #000; border: none; padding: 1.2rem; 
		font-weight: 900; letter-spacing: 0.15em; cursor: pointer;
		border-radius: 6px;
		transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
	}
	.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(19, 228, 228, 0.2); opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: wait; }

	.auth-toggle { text-align: center; font-size: 0.8rem; color: #444; margin-top: 1rem; }
	.btn-link, .btn-text { background: none; border: none; color: #fff; text-decoration: underline; cursor: pointer; padding: 0.2rem; }
	.btn-text { font-size: 0.75rem; color: #13E4E4; text-decoration: none; font-weight: 700; margin-left: 0.5rem; }

	/* App Layout */
	.app-layout { display: flex; flex-direction: column; gap: 2rem; }
	.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
	.card-top h3 { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.2em; color: #444; margin: 0; }

	.mode-switcher { display: flex; background: #000; padding: 4px; border: 1px solid #222; gap: 4px; border-radius: 6px; }
	.mode-switcher button { 
		background: none; border: none; color: #666; padding: 0.4rem 1rem; 
		font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
		border-radius: 4px;
	}
	.mode-switcher button.active { background: #13E4E4; color: #000; }

	.btn-accent { 
		background: #13E4E4; color: #000; border: none; padding: 0 2rem; 
		font-weight: 800; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s;
		border-radius: 6px;
	}
	.btn-accent:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 0 20px rgba(19, 228, 228, 0.3); }

	textarea { width: 100%; background: #000; border: 1px solid #222; padding: 1rem; color: #fff; outline: none; resize: vertical; box-sizing: border-box; border-radius: 6px; }
	.full-width { width: 100%; padding: 1.2rem; margin-top: 1rem; }

	/* Pipeline */
	.pipeline-status { margin-top: 2rem; display: flex; gap: 1.5rem; border-top: 1px solid #222; padding-top: 1.5rem; }
	.p-step { display: flex; align-items: center; gap: 0.5rem; opacity: 0.25; transition: opacity 0.3s; }
	.p-step.active { opacity: 1; color: #13E4E4; }
	.p-step.done { opacity: 0.6; color: #fff; }
	.p-dot { width: 4px; height: 4px; background: currentColor; border-radius: 50%; }
	.p-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em; }

	/* Preview */
	.preview-card { min-height: 400px; display: flex; flex-direction: column; }
	.preview-scroll { flex: 1; }
	.empty-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #333; gap: 1rem; }
	.pulse-icon { font-size: 2.5rem; color: #13E4E4; opacity: 0.3; animation: float 3s ease-in-out infinite; }
	@keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }

	.btn-outline { background: transparent; border: 1px solid #13E4E4; color: #13E4E4; padding: 0.6rem 1.2rem; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: all 0.2s; border-radius: 6px; }
	.btn-outline:hover { background: #13E4E4; color: #000; }

	.resume-card-visual { background: #000; border: 1px solid #222; padding: 2.5rem; margin-top: 2rem; border-radius: 8px; }
	.v-header h4 { font-size: 1.4rem; margin: 0; letter-spacing: 0.05em; color: #13E4E4; }
	.v-header p { font-size: 0.8rem; color: #666; margin: 0.5rem 0 2rem 0; }
	.v-section h5 { font-size: 0.65rem; color: #444; letter-spacing: 0.25em; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.5rem; margin-bottom: 1rem; }
	.v-section p { font-size: 0.85rem; line-height: 1.7; color: #999; }
	.v-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.v-chips span { background: #0a0a0a; border: 1px solid #222; padding: 0.3rem 0.8rem; font-size: 0.7rem; color: #13E4E4; border-radius: 4px; }

	.error-alert { background: #1a0505; border: 1px solid #301010; padding: 1rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; }
	.error-alert p { color: #fecaca; font-size: 0.8rem; margin: 0; }
	.error-alert button { background: none; border: none; color: #fecaca; font-weight: 800; cursor: pointer; text-decoration: underline; }

	.footer { margin-top: 6rem; text-align: center; border-top: 1px solid #111; padding-top: 2rem; display: flex; align-items: center; justify-content: center; gap: 1rem; opacity: 0.4; }
	.footer p { font-size: 0.55rem; letter-spacing: 0.4em; color: #666; }
	.line { flex: 1; height: 1px; background: #111; }
	.red-dot { width: 5px; height: 5px; background: #13E4E4; border-radius: 50%; box-shadow: 0 0 10px #13E4E4; }

	@media (max-width: 768px) {
		.container { padding: 2rem 1rem; }
		.logo-text { font-size: 1.1rem; }
		.tagline { font-size: 1.6rem; }
		.hero-card, .app-card { padding: 1.5rem; }
		.pipeline-status { flex-direction: column; gap: 0.75rem; }
		.logo-wrap { gap: 0.75rem; }
		.logo-symbol { font-size: 1.6rem; }
	}

	/* iPhone & Small Mobile Optimizations */
	@media (max-width: 480px) {
		.logo-text { font-size: 0.85rem; letter-spacing: -0.02em; }
		.tagline { font-size: 1.4rem; }
		.user-email { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.app-card { padding: 1.25rem; }
		.btn-accent { padding: 0 1rem; font-size: 0.7rem; }
		.logo-wrap { flex-direction: column; gap: 0.5rem; }
	}
</style>