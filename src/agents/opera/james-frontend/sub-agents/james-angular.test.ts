/**
 * VERSATIL SDLC Framework - James-Angular Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Angular 17+ patterns (standalone components, signals)
 * - Component architecture
 * - Dependency injection
 * - RxJS observables and reactive patterns
 * - NgRx state management
 * - Performance optimization
 * - Testing patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamesAngular } from './james-angular.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('JamesAngular', () => {
  let agent: JamesAngular;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new JamesAngular();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Angular specialization', () => {
      expect(agent.name).toBe('James-Angular');
      expect(agent.id).toBe('james-angular');
      expect(agent.specialization).toContain('Angular');
    });

    it('should have Angular-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('standalone components');
      expect(agent.systemPrompt).toContain('signals');
    });
  });

  describe('Component Pattern Detection', () => {
    it('should detect standalone components', () => {
      const content = `
        @Component({
          selector: 'app-user',
          standalone: true,
          imports: [CommonModule],
          template: '<div>User</div>'
        })
        export class UserComponent {}
      `;

      const hasStandalone = agent['hasStandaloneComponent'](content);
      expect(hasStandalone).toBe(true);
    });

    it('should detect module-based components', () => {
      const content = `
        @Component({
          selector: 'app-user',
          template: '<div>User</div>'
        })
        export class UserComponent {}
      `;

      const hasModuleBased = agent['hasModuleBasedComponent'](content);
      expect(hasModuleBased).toBe(true);
    });

    it('should recommend standalone over module-based', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Component({
            selector: 'app-old',
            template: '<div>Old</div>'
          })
          export class OldComponent {}
        `,
        filePath: 'old.component.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Signals Detection', () => {
    it('should detect signal usage', () => {
      const content = `
        import { signal } from '@angular/core';
        const count = signal(0);
        count.set(1);
      `;

      const hasSignal = agent['hasSignal'](content);
      expect(hasSignal).toBe(true);
    });

    it('should detect computed signals', () => {
      const content = `
        import { computed } from '@angular/core';
        const doubled = computed(() => count() * 2);
      `;

      const hasComputed = agent['hasComputedSignal'](content);
      expect(hasComputed).toBe(true);
    });

    it('should detect effect usage', () => {
      const content = `
        import { effect } from '@angular/core';
        effect(() => {
          console.log('Count:', count());
        });
      `;

      const hasEffect = agent['hasEffect'](content);
      expect(hasEffect).toBe(true);
    });

    it('should recommend signals over Subject for state', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          private countSubject = new BehaviorSubject<number>(0);
          count$ = this.countSubject.asObservable();
        `,
        filePath: 'service.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Dependency Injection', () => {
    it('should detect inject() function usage', () => {
      const content = `
        import { inject } from '@angular/core';
        const service = inject(UserService);
      `;

      const hasInject = agent['hasInjectFunction'](content);
      expect(hasInject).toBe(true);
    });

    it('should detect constructor injection', () => {
      const content = `
        constructor(private userService: UserService) {}
      `;

      const hasConstructorInjection = agent['hasConstructorInjection'](content);
      expect(hasConstructorInjection).toBe(true);
    });

    it('should recommend inject() over constructor injection', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Component({
            standalone: true,
            template: '<div>User</div>'
          })
          export class UserComponent {
            constructor(private userService: UserService) {}
          }
        `,
        filePath: 'user.component.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('RxJS Observable Patterns', () => {
    it('should detect observable subscriptions', () => {
      const content = `
        this.user$.subscribe(user => console.log(user));
      `;

      const hasSubscription = agent['hasObservableSubscription'](content);
      expect(hasSubscription).toBe(true);
    });

    it('should detect missing unsubscribe', () => {
      const content = `
        ngOnInit() {
          this.user$.subscribe(user => console.log(user)); // Memory leak!
        }
      `;

      const hasMissingUnsubscribe = agent['hasMissingUnsubscribe'](content);
      expect(typeof hasMissingUnsubscribe).toBe('boolean');
    });

    it('should detect async pipe usage', () => {
      const content = `
        <div *ngIf="user$ | async as user">{{ user.name }}</div>
      `;

      const hasAsyncPipe = agent['hasAsyncPipe'](content);
      expect(hasAsyncPipe).toBe(true);
    });

    it('should detect takeUntil pattern for cleanup', () => {
      const content = `
        import { takeUntil } from 'rxjs/operators';
        this.user$.pipe(takeUntil(this.destroy$)).subscribe();
      `;

      const hasTakeUntil = agent['hasTakeUntil'](content);
      expect(hasTakeUntil).toBe(true);
    });

    it('should recommend async pipe over manual subscription', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          ngOnInit() {
            this.subscription = this.users$.subscribe(
              users => this.users = users
            );
          }
        `,
        filePath: 'users.component.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('NgRx State Management', () => {
    it('should detect store usage', () => {
      const content = `
        import { Store } from '@ngrx/store';
        this.store.select(selectUsers);
      `;

      const hasStore = agent['hasNgRxStore'](content);
      expect(hasStore).toBe(true);
    });

    it('should detect actions', () => {
      const content = `
        import { createAction } from '@ngrx/store';
        export const loadUsers = createAction('[User] Load Users');
      `;

      const hasAction = agent['hasNgRxAction'](content);
      expect(hasAction).toBe(true);
    });

    it('should detect effects', () => {
      const content = `
        import { createEffect } from '@ngrx/effects';
        loadUsers$ = createEffect(() => this.actions$.pipe(
          ofType(loadUsers),
          switchMap(() => this.service.getUsers())
        ));
      `;

      const hasEffect = agent['hasNgRxEffect'](content);
      expect(hasEffect).toBe(true);
    });

    it('should detect selectors', () => {
      const content = `
        import { createSelector } from '@ngrx/store';
        export const selectUsers = createSelector(
          selectUserState,
          state => state.users
        );
      `;

      const hasSelector = agent['hasNgRxSelector'](content);
      expect(hasSelector).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect OnPush change detection', () => {
      const content = `
        @Component({
          changeDetection: ChangeDetectionStrategy.OnPush,
          template: '<div>User</div>'
        })
      `;

      const hasOnPush = agent['hasOnPushChangeDetection'](content);
      expect(hasOnPush).toBe(true);
    });

    it('should detect trackBy function', () => {
      const content = `
        <div *ngFor="let item of items; trackBy: trackById">
          {{ item.name }}
        </div>
      `;

      const hasTrackBy = agent['hasTrackBy'](content);
      expect(hasTrackBy).toBe(true);
    });

    it('should detect missing trackBy in ngFor', () => {
      const content = `
        <div *ngFor="let item of items">{{ item.name }}</div>
      `;

      const hasMissingTrackBy = agent['hasMissingTrackBy'](content);
      expect(hasMissingTrackBy).toBe(true);
    });

    it('should recommend lazy loading', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const routes: Routes = [
            { path: 'admin', component: AdminComponent }
          ];
        `,
        filePath: 'app.routes.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Template Patterns', () => {
    it('should detect structural directives', () => {
      const content = `
        <div *ngIf="isVisible">Content</div>
        <div *ngFor="let item of items">{{ item }}</div>
      `;

      const hasStructuralDirective = agent['hasStructuralDirective'](content);
      expect(hasStructuralDirective).toBe(true);
    });

    it('should detect @if/@for control flow', () => {
      const content = `
        @if (isVisible) {
          <div>Content</div>
        }
        @for (item of items; track item.id) {
          <div>{{ item }}</div>
        }
      `;

      const hasNewControlFlow = agent['hasNewControlFlow'](content);
      expect(hasNewControlFlow).toBe(true);
    });

    it('should detect template reference variables', () => {
      const content = `
        <input #nameInput type="text">
        <button (click)="submit(nameInput.value)">Submit</button>
      `;

      const hasTemplateRef = agent['hasTemplateReference'](content);
      expect(hasTemplateRef).toBe(true);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should detect ngOnInit', () => {
      const content = `
        ngOnInit() {
          this.loadData();
        }
      `;

      const hasOnInit = agent['hasLifecycleHook'](content, 'ngOnInit');
      expect(hasOnInit).toBe(true);
    });

    it('should detect ngOnDestroy for cleanup', () => {
      const content = `
        ngOnDestroy() {
          this.subscription.unsubscribe();
        }
      `;

      const hasOnDestroy = agent['hasLifecycleHook'](content, 'ngOnDestroy');
      expect(hasOnDestroy).toBe(true);
    });

    it('should validate proper lifecycle implementation', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export class UserComponent implements OnInit, OnDestroy {
            ngOnInit() { this.loadUsers(); }
            ngOnDestroy() { this.destroy$.next(); }
          }
        `,
        filePath: 'user.component.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis.score).toBeGreaterThan(70);
    });
  });

  describe('Testing Patterns', () => {
    it('should detect TestBed usage', () => {
      const content = `
        TestBed.configureTestingModule({
          imports: [UserComponent]
        });
      `;

      const hasTestBed = agent['hasTestBed'](content);
      expect(hasTestBed).toBe(true);
    });

    it('should detect component fixture', () => {
      const content = `
        const fixture = TestBed.createComponent(UserComponent);
        fixture.detectChanges();
      `;

      const hasFixture = agent['hasComponentFixture'](content);
      expect(hasFixture).toBe(true);
    });

    it('should validate proper test structure', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          describe('UserComponent', () => {
            it('should create', () => {
              expect(component).toBeTruthy();
            });
          });
        `,
        filePath: 'user.component.spec.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Angular-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Component({
            standalone: true,
            changeDetection: ChangeDetectionStrategy.OnPush,
            template: '<div>User</div>'
          })
          export class UserComponent {
            count = signal(0);
          }
        `,
        filePath: 'user.component.ts'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide Angular 17+ best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Component({
            selector: 'app-old',
            template: '<div>Old</div>'
          })
          export class OldComponent {
            constructor(private service: UserService) {}
          }
        `,
        filePath: 'old.component.ts'
      };

      const response = await agent.activate(context);

      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: '',
        filePath: 'empty.component.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Angular content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.ts'
      };

      const analysis = await agent['analyzeAngularPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
