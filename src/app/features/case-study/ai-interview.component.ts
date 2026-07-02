import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-ai-interview-case-study',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="cs">
      <header class="cs__hero" appScrollReveal>
        <span class="cs__eyebrow">// case study · production · PSG Global Solutions</span>
        <h1 class="cs__title">AI Interview &amp; Fit-Scoring<span class="cs__accent">.</span></h1>
        <p class="cs__standfirst">
          How a recruiting platform used by 10,000+ people got an AI that <em>interviews</em> candidates —
          and why the interview, not the résumé, became the scoring signal. I designed how it interviews
          and how it scores; this is the architecture story at the level I can share publicly.
        </p>
      </header>

      <section class="cs__section" appScrollReveal>
        <h2>The problem</h2>
        <p>
          Recruiters on the platform work high-volume job orders. A single recruiter cannot meaningfully
          screen hundreds of candidates, so screening collapses into résumé keyword matching — and résumés
          are a weak, gameable signal. The platform needed screening that scales <em>without</em> losing
          the thing an actual conversation reveals: whether this person genuinely fits this role.
        </p>
      </section>

      <section class="cs__section" appScrollReveal>
        <h2>The design call: interview &gt; résumé</h2>
        <p>
          The core decision was about <strong>signal design</strong>, not model choice. An AI voice agent
          ("Anna") conducts a real, role-specific interview in the candidate's language. The transcript —
          not the résumé — becomes the primary scoring input, weighted across five dimensions:
        </p>
        <ul class="cs__dims">
          <li>Skills</li><li>Experience</li><li>Location</li><li>Availability</li><li>Tenure</li>
        </ul>
        <p>
          A résumé says what a candidate chose to write; an interview probes what they actually know and
          want. Weighting the interview over the résumé is the whole point of the system — it's also the
          design tradeoff I get asked to defend most, and the one I'm happiest to.
        </p>
      </section>

      <section class="cs__section" appScrollReveal>
        <h2>The system</h2>
        <ol class="cs__flow">
          <li><strong>Interview</strong> — the voice agent runs a role-specific interview over conversation pathways I designed (Bland AI for the voice layer).</li>
          <li><strong>Score</strong> — the transcript is scored into a fit score against the role's requirements (LLM scoring — Azure OpenAI / Claude — behind a Python/FastAPI service).</li>
          <li><strong>Surface</strong> — recruiters see scored, comparable candidates inside the Angular 19 product, where I also own the product layer.</li>
        </ol>
        <p>
          The split matters: the LLM does only what it's uniquely good for (conducting and judging a
          conversation); everything deterministic lives in ordinary code. That keeps behavior explainable
          to recruiters and keeps cost proportional to value.
        </p>
      </section>

      <section class="cs__section" appScrollReveal>
        <h2>What I'm building on top: the ranking engine</h2>
        <p>
          Fit scores make candidates <em>comparable</em>, which unlocks the next system — currently in
          architecture: a candidate-ranking engine that surfaces the strongest candidates for a job order
          from their résumé, screening, and history, with recruiter-tunable weights. I own the ranking
          approach (retrieval + ranking), the vector-database selection, and the
          <strong>model-cost strategy</strong>: which model runs at which step, what gets cached, and what
          never needs an LLM at all — the difference between a demo and something affordable at
          10,000-user scale.
        </p>
      </section>

      <section class="cs__section" appScrollReveal>
        <h2>Constraints &amp; honesty</h2>
        <p>
          This is client work, so internal metrics, prompts, and vendor terms stay private — the system
          was demoed live at a tradeshow in Austin, and everything above is the publicly shareable
          altitude. For AI work of mine you can run and measure yourself, see
          <a href="https://govai-contracts.nandanhegde1096.workers.dev/ask/" target="_blank" rel="noopener">Ask GovAI</a>
          — the same methodology (retrieval design, grounding, evals, cost strategy) with a reproducible
          eval and published numbers. I integrate and architect LLM systems; I don't train models — that
          division of labor is deliberate.
        </p>
      </section>

      <footer class="cs__cta" appScrollReveal>
        <a routerLink="/projects" class="cs__cta-link">← All projects</a>
        <a routerLink="/contact" class="cs__cta-btn">Let's talk about your AI product →</a>
      </footer>
    </article>
  `,
  styles: [`
    .cs { max-width: 720px; margin: 0 auto; padding: 96px 24px 80px; }
    .cs__eyebrow { font-family: var(--font-mono, monospace); font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-primary, #22d3ee); }
    .cs__title { font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1.08; margin: 14px 0 0; }
    .cs__accent { color: var(--accent-primary, #22d3ee); }
    .cs__standfirst { font-size: 1.12rem; line-height: 1.65; color: var(--text-secondary, #94a3b8); margin-top: 20px; max-width: 58ch; }
    .cs__section { margin-top: 52px; }
    .cs__section h2 { font-size: 1.35rem; margin-bottom: 14px; }
    .cs__section p { line-height: 1.7; color: var(--text-secondary, #94a3b8); margin: 0 0 14px; }
    .cs__section p strong, .cs__section p em { color: var(--text-primary, #e2e8f0); }
    .cs__section a { color: var(--accent-primary, #22d3ee); }
    .cs__dims { display: flex; flex-wrap: wrap; gap: 10px; list-style: none; padding: 0; margin: 6px 0 16px; }
    .cs__dims li { border: 1px solid var(--accent-primary, #22d3ee); border-radius: 999px; padding: 5px 14px; font-size: 0.85rem; color: var(--accent-primary, #22d3ee); }
    .cs__flow { padding-left: 20px; }
    .cs__flow li { line-height: 1.7; color: var(--text-secondary, #94a3b8); margin-bottom: 12px; }
    .cs__flow li strong { color: var(--text-primary, #e2e8f0); }
    .cs__cta { margin-top: 64px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .cs__cta-link { color: var(--text-secondary, #94a3b8); text-decoration: none; }
    .cs__cta-btn { color: var(--accent-primary, #22d3ee); text-decoration: none; font-weight: 600; }
    @media (max-width: 600px) { .cs { padding-top: 80px; } }
  `],
})
export class AiInterviewCaseStudyComponent {}
