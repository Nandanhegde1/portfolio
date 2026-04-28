import {
  Component,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  NgZone,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="three-canvas"></canvas>`,
  styles: [`
    :host { display: block; position: absolute; inset: 0; z-index: 0; }
    .three-canvas { width: 100%; height: 100%; display: block; }
  `],
})
export class ThreeSceneComponent implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private particles!: THREE.Points;
  private animationId = 0;
  private mouse = { x: 0, y: 0 };
  private resizeListener?: () => void;
  private mouseMoveListener?: (e: MouseEvent) => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Respect prefers-reduced-motion: skip Three.js entirely; SCSS shows a static gradient.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.canvasRef().nativeElement.style.display = 'none';
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      this.createParticles();
      this.setupListeners();
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    if (this.mouseMoveListener) window.removeEventListener('mousemove', this.mouseMoveListener);
    this.renderer?.dispose();
    this.particles?.geometry.dispose();
    (this.particles?.material as THREE.Material)?.dispose();
  }

  private initScene(): void {
    const canvas = this.canvasRef().nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 768,
      powerPreference: 'low-power',
    });
    this.renderer.setSize(width, height);
    // Cap pixel ratio at 1.5 (2 doubles GPU load for negligible gain on dense particle scenes)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }

  private createParticles(): void {
    // Halve particles on mobile / low-end devices for smoother frames.
    const isMobile = window.innerWidth < 768;
    const lowEnd = (navigator as any).deviceMemory != null && (navigator as any).deviceMemory <= 4;
    const count = isMobile || lowEnd ? 600 : 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Accent color from CSS custom property or fallback
    const root = getComputedStyle(document.documentElement);
    const accentHex = root.getPropertyValue('--accent').trim() || '#22d3ee';
    const accent = new THREE.Color(accentHex);
    const accent2 = new THREE.Color(root.getPropertyValue('--accent-hover').trim() || '#818cf8');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread particles in a sphere
      const radius = 4 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Random color blend between two accent colors
      const mix = Math.random();
      const color = accent.clone().lerp(accent2, mix);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private setupListeners(): void {
    this.resizeListener = () => {
      const canvas = this.canvasRef().nativeElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.resizeListener);

    this.mouseMoveListener = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', this.mouseMoveListener);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Pause animation while tab is hidden to save battery / CPU.
    if (document.hidden) return;

    // Slow rotation
    this.particles.rotation.y += 0.0005;
    this.particles.rotation.x += 0.0002;

    // Mouse parallax
    this.particles.rotation.y += this.mouse.x * 0.0003;
    this.particles.rotation.x += this.mouse.y * 0.0003;

    // Subtle float
    const time = Date.now() * 0.0005;
    this.particles.position.y = Math.sin(time) * 0.15;

    this.renderer.render(this.scene, this.camera);
  }
}
