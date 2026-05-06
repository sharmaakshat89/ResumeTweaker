<script lang="ts">
  let {
    structuredResume = $bindable(),
    extractedSkills = []
  } = $props<{
    structuredResume: any;
    extractedSkills?: string[];
  }>();

  let selectedSkills: string[] = $state([]);

  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      selectedSkills = selectedSkills.filter(s => s !== skill);
      // Remove from resume skills if we want it fully synced, or just leave it
      structuredResume.skills = structuredResume.skills.filter((s: string) => s !== skill);
    } else {
      selectedSkills.push(skill);
      // Inject into resume
      if (!structuredResume.skills.includes(skill)) {
        structuredResume.skills = [skill, ...structuredResume.skills];
      }
    }
  }
</script>

<div class="editor-container">
  <!-- Skill Selector UI -->
  {#if extractedSkills.length > 0}
    <div class="skill-selector">
      <h3 class="section-title">Detected Skills & Tools (Click to add)</h3>
      <div class="chip-container">
        {#each extractedSkills as skill}
          <button 
            class="skill-chip {selectedSkills.includes(skill) ? 'active' : ''}"
            onclick={() => toggleSkill(skill)}
          >
            {skill}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Editable Resume -->
  <div class="editable-resume">
    <h3 class="section-title">Edit Resume (Updates PDF directly)</h3>
    
    <div class="field-group">
      <label for="edit-summary" class="field-label">Summary</label>
      <textarea id="edit-summary" bind:value={structuredResume.summary} rows="4"></textarea>
    </div>

    <!-- Skills display - editable as text but sync automatically from chips -->
    <div class="field-group">
      <label for="edit-skills" class="field-label">Skills (Comma separated)</label>
      <textarea 
        id="edit-skills" 
        value={structuredResume.skills.join(', ')} 
        oninput={(e) => structuredResume.skills = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s.length > 0)}
        rows="2"
      ></textarea>
    </div>

    {#if structuredResume.projects && structuredResume.projects.length > 0}
      <div class="field-group">
        <div class="field-label">Projects</div>
        {#each structuredResume.projects as project, pjIndex}
          <div class="exp-edit-block">
            <div class="point-input-row">
              <input type="text" bind:value={structuredResume.projects[pjIndex].title} placeholder="Project title" />
            </div>
            <div class="point-input-row">
              <input type="text" value={structuredResume.projects[pjIndex].tech.join(', ')} oninput={(e) => structuredResume.projects[pjIndex].tech = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s.length > 0)} placeholder="Tech stack (comma separated)" />
            </div>
            {#each project.points as point, ppIndex}
              <div class="point-input-row">
                <span class="bullet">•</span>
                <input type="text" bind:value={structuredResume.projects[pjIndex].points[ppIndex]} />
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}

    <div class="field-group">
      <div class="field-label">Experience Points</div>
      {#each structuredResume.experience as exp, eIndex}
        <div class="exp-edit-block">
          <strong>{exp.role} @ {exp.company}</strong>
          {#each exp.points as point, pIndex}
            <div class="point-input-row">
              <span class="bullet">•</span>
              <input type="text" bind:value={structuredResume.experience[eIndex].points[pIndex]} />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .editor-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 1rem;
  }
  
  .section-title {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #a0a0a0;
    margin: 0 0 0.8rem 0;
    border-bottom: 1px solid #222;
    padding-bottom: 0.3rem;
  }

  .skill-selector {
    background: #080808;
    border: 1px solid #1c1c1c;
    border-radius: 8px;
    padding: 1rem;
  }

  .chip-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .skill-chip {
    background: #111;
    border: 1px solid #333;
    border-radius: 99px;
    padding: 0.3rem 0.8rem;
    font-size: 0.75rem;
    color: #bbb;
    cursor: pointer;
    transition: all 0.2s;
  }
  .skill-chip:hover {
    border-color: #555;
    color: #fff;
  }
  .skill-chip.active {
    background: #fff;
    color: #000;
    border-color: #fff;
    font-weight: 600;
  }

  .editable-resume {
    background: #0a0a0a;
    border: 1px dashed #333;
    border-radius: 8px;
    padding: 1.2rem;
  }

  .field-group {
    margin-bottom: 1.2rem;
  }

  .field-label {
    display: block;
    font-size: 0.65rem;
    color: #777;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.4rem;
  }

  textarea, input {
    width: 100%;
    background: #000;
    border: 1px solid #222;
    border-radius: 6px;
    color: #e8e8e8;
    font-family: inherit;
    font-size: 0.8rem;
    padding: 0.6rem;
    outline: none;
  }
  textarea:focus, input:focus {
    border-color: #555;
  }

  .exp-edit-block {
    margin-bottom: 1rem;
    background: #050505;
    padding: 0.8rem;
    border-radius: 6px;
    border: 1px solid #111;
  }
  .exp-edit-block strong {
    display: block;
    font-size: 0.75rem;
    color: #ccc;
    margin-bottom: 0.5rem;
  }

  .point-input-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    margin-bottom: 0.4rem;
  }
  .bullet {
    color: #555;
    margin-top: 0.5rem;
  }
</style>
