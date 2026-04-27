import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SectionHeaderComponent } from '../../shared/components';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [SectionHeaderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section contact">
      <div class="container">
        <app-section-header tag="// contact" title="Get in Touch" subtitle="Have a project idea, question, or just want to say hi?" />

        <div class="contact__grid">
          <div class="contact__info">
            <div class="contact__info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 4l-10 8L2 4"/>
              </svg>
              <div>
                <h4>Email</h4>
                <a href="mailto:nandanhegde1096@gmail.com">nandanhegde1096&#64;gmail.com</a>
              </div>
            </div>
            <div class="contact__info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div>
                <h4>Location</h4>
                <p>Bangalore, India</p>
              </div>
            </div>
            <div class="contact__social">
              <a href="https://github.com/nandanhegde" target="_blank" rel="noopener" class="btn btn--outline">GitHub</a>
              <a href="https://linkedin.com/in/nandan-hegde-195020168" target="_blank" rel="noopener" class="btn btn--outline">LinkedIn</a>
            </div>
          </div>

          <form class="contact__form card" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="contact__field">
              <label for="name">Name</label>
              <input id="name" type="text" formControlName="name" placeholder="Your name" />
            </div>
            <div class="contact__field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="you@example.com" />
            </div>
            <div class="contact__field">
              <label for="subject">Subject</label>
              <input id="subject" type="text" formControlName="subject" placeholder="What's this about?" />
            </div>
            <div class="contact__field">
              <label for="message">Message</label>
              <textarea id="message" formControlName="message" rows="5" placeholder="Your message..."></textarea>
            </div>

            @if (submitted()) {
              <div class="contact__toast contact__toast--success">
                <svg class="contact__toast-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Message sent! I usually respond within 24 hours.
              </div>
            }

            <button type="submit" class="btn btn--primary" [disabled]="form.invalid">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  `,
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.valid) {
      // Will integrate with EmailJS or backend endpoint
      console.log('Contact form:', this.form.getRawValue());
      this.submitted.set(true);
      this.form.reset();
      setTimeout(() => this.submitted.set(false), 3000);
    }
  }
}
