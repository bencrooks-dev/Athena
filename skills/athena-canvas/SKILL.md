---
name: athena-canvas
description: Use during brainstorming when visual content would help — mockups, wireframes, layout comparisons, architecture diagrams. Zero-dependency, no server required.
---

# Athena Canvas — Visualizer

You create browser-viewable visual content during brainstorming — mockups, wireframes, diagrams, comparisons. Zero dependencies, no server needed. Just HTML files the user opens directly.

## When To Use vs Terminal

Decide **per question**, not per session:

**Use Canvas (browser):**
- UI mockups, wireframes, layout comparisons
- Architecture diagrams, data flow visualizations
- Side-by-side visual comparisons
- Design polish questions (spacing, color, hierarchy)

**Use Terminal (text):**
- Requirements/scope questions
- Conceptual A/B/C choices described in words
- Tradeoff tables, pro/con lists
- Technical decisions (API design, data models)
- Clarifying questions

A question *about* UI is not automatically visual. "What kind of dashboard?" = terminal. "Which of these dashboard layouts?" = canvas.

## Offering Canvas

When you anticipate visual questions during `/athena-brainstorm`, offer it once:

> "Some of this would be easier to show than describe. I can create mockups you view in your browser — just open the HTML file I generate. Want me to use visuals when they'd help?"

**This offer is its own message.** Don't combine it with other questions. If they decline, use text-only brainstorming.

## Process

### Step 1: Setup

Create the canvas directory in the project:

```bash
mkdir -p .athena/canvas
```

Add to `.gitignore` if not already there:

```bash
git check-ignore -q .athena 2>/dev/null || echo ".athena/" >> .gitignore
```

### Step 2: Write HTML Files

Write self-contained HTML files to `.athena/canvas/`. Each file is a complete, standalone page — no server, no dependencies, no build step.

**File naming:** Semantic names with step numbers — `01-layout.html`, `02-color-scheme.html`, `01-layout-v2.html` for iterations.

**Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Question Title]</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
         background: #0a0a0a; color: #e0e0e0; padding: 2rem; line-height: 1.6; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff; }
  .subtitle { color: #888; margin-bottom: 2rem; }
  .options { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
  .option { border: 2px solid #333; border-radius: 12px; padding: 1.5rem; cursor: pointer;
            transition: all 0.2s; position: relative; }
  .option:hover { border-color: #666; background: #1a1a1a; }
  .option.selected { border-color: #4a9eff; background: #0d1b2a; }
  .option .letter { font-size: 0.875rem; font-weight: 700; color: #4a9eff;
                    text-transform: uppercase; margin-bottom: 0.75rem; }
  .option h3 { font-size: 1.125rem; margin-bottom: 0.5rem; color: #fff; }
  .option p { color: #aaa; font-size: 0.925rem; }
  .mockup { border: 1px solid #333; border-radius: 8px; overflow: hidden; background: #111; }
  .mockup-header { padding: 0.5rem 1rem; background: #1a1a1a; border-bottom: 1px solid #333;
                   font-size: 0.8rem; color: #888; }
  .mockup-body { padding: 1rem; }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .mock-nav { padding: 0.75rem 1rem; background: #1a1a1a; border-bottom: 1px solid #333; }
  .mock-sidebar { width: 200px; min-height: 300px; background: #1a1a1a; padding: 1rem;
                  border-right: 1px solid #333; }
  .mock-content { flex: 1; padding: 1rem; }
  .mock-button { padding: 0.5rem 1rem; background: #4a9eff; color: #fff; border: none;
                 border-radius: 6px; cursor: pointer; }
  .tag { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px;
         font-size: 0.75rem; font-weight: 600; }
  .tag-pro { background: #0a2a1a; color: #4ade80; }
  .tag-con { background: #2a0a0a; color: #f87171; }
  .selected-indicator { position: fixed; bottom: 1rem; right: 1rem; background: #4a9eff;
                        color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px;
                        display: none; font-weight: 600; }
</style>
</head>
<body>
  <h1>[Question]</h1>
  <p class="subtitle">[Context for the choice]</p>

  <div class="options">
    <div class="option" onclick="select(this)" data-choice="a">
      <div class="letter">A</div>
      <h3>[Option Name]</h3>
      <p>[Description]</p>
    </div>
    <div class="option" onclick="select(this)" data-choice="b">
      <div class="letter">B</div>
      <h3>[Option Name]</h3>
      <p>[Description]</p>
    </div>
  </div>

  <div class="selected-indicator" id="indicator">Selected: <span id="choice"></span></div>

  <script>
    function select(el) {
      document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      const indicator = document.getElementById('indicator');
      const choice = document.getElementById('choice');
      indicator.style.display = 'block';
      choice.textContent = el.dataset.choice.toUpperCase() + ' — ' + el.querySelector('h3').textContent;
    }
  </script>
</body>
</html>
```

### Step 3: Tell the User

After writing each HTML file:

```
Canvas ready: .athena/canvas/01-layout.html
Open it in your browser and let me know which option you prefer.
[Brief text summary of what's on the page]
```

**Always provide a text summary** — the user should understand the question even without opening the file.

### Step 4: Get Feedback

The user reports their choice in the terminal. No server events needed — the terminal is the feedback channel.

If the user wants changes to the current screen, write a new version (`01-layout-v2.html`). Only advance to the next question when the current one is settled.

## CSS Components Available

The template above includes these ready-to-use patterns:

| Component | Class | Use For |
|-----------|-------|---------|
| Option cards | `.options > .option` | A/B/C choices with click selection |
| Mockup frame | `.mockup > .mockup-header + .mockup-body` | Wireframe containers |
| Split view | `.split` | Side-by-side comparisons |
| Nav bar | `.mock-nav` | Navigation wireframes |
| Sidebar | `.mock-sidebar` | Sidebar layout wireframes |
| Content area | `.mock-content` | Main content wireframes |
| Buttons | `.mock-button` | Interactive element mockups |
| Tags | `.tag.tag-pro` / `.tag.tag-con` | Pros/cons labels |

## Integration

**Called by:** `/athena-brainstorm` — when visual questions arise during design exploration.

**Not a standalone workflow** — always used within a brainstorm session, never invoked directly.

## Rules

- **Per-question decision** — not every question in a brainstorm needs a canvas
- **Always provide text summary** — the HTML is supplementary, not primary
- **New file per screen** — never overwrite, always create new (or versioned)
- **Dark theme always** — consistent aesthetic, easy on eyes
- **Self-contained files** — no external dependencies, no CDN links, no server

## Anti-Patterns (NEVER)

- Requiring a server or live-reload setup — the whole point is zero-dependency
- Sending every brainstorm question to the browser — most questions are text
- Skipping the text summary — user shouldn't NEED to open the file to understand the question
- Using external CSS/JS CDN links — files must work offline, no network required
- Reusing filenames — each screen is a new file
