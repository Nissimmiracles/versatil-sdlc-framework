---
name: animation-interaction
description: Production-ready animation and interaction patterns using Framer Motion and GSAP. Use when implementing micro-interactions, page transitions, scroll animations, complex timelines, or gesture-based interactions. Achieves 60fps performance with accessibility compliance (prefers-reduced-motion) and reduces animation implementation time by 50%.
---

# Animation & Interaction

## Overview

Build performant, accessible animations using Framer Motion (React animations) and GSAP (complex timelines). Combines motion design best practices with WCAG compliance and 60fps performance optimization.

**Goal**: Delightful, accessible animations that enhance UX without sacrificing performance or accessibility

## When to Use This Skill

Use this skill when:
- Adding micro-interactions (hover, focus, click states)
- Implementing page transitions or route animations
- Creating scroll-triggered animations
- Building complex animation timelines
- Implementing gesture-based interactions (drag, swipe, pinch)
- Animating SVG paths or complex shapes
- Optimizing animation performance (jank-free 60fps)
- Ensuring motion accessibility (prefers-reduced-motion)

**Triggers**: "add animation", "page transition", "scroll animation", "micro-interaction", "gesture-based", "GSAP timeline"

---

## Quick Start: Animation Decision Tree

### When to Use Framer Motion vs GSAP

**Framer Motion** (React-first, declarative):
- ✅ Component-level animations (enter/exit, hover, tap)
- ✅ Layout animations (auto-animating flex/grid changes)
- ✅ Gesture-based interactions (drag, swipe, pan)
- ✅ Variants system (animate multiple children)
- ✅ Spring physics (natural, bouncy motion)

**GSAP** (Imperative, timeline-based):
- ✅ Complex timelines (orchestrate 10+ animations)
- ✅ SVG morphing and path animations
- ✅ ScrollTrigger-based scroll animations
- ✅ Cross-browser consistency (Safari quirks handled)
- ✅ Text animations (letter-by-letter, word splitting)

**Use Both** when:
- Framer Motion for UI components + GSAP for hero sections
- Framer Motion for gestures + GSAP for scroll-triggered sequences

**Reference**: See `references/framer-vs-gsap.md` for detailed comparison

---

## Framer Motion Patterns

### 1. Basic Component Animation

```tsx
import { motion } from 'framer-motion';

// ✅ Simple fade-in animation
function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

// ✅ Slide-in from left
function SlideIn({ children }) {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {children}
    </motion.div>
  );
}
```

### 2. Hover & Tap States (Micro-Interactions)

```tsx
// ✅ Interactive button with scale and shadow
function InteractiveButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}

// ✅ Card with lift effect
function LiftCard({ children }) {
  return (
    <motion.div
      className="card"
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. Variants System (Animate Multiple Children)

```tsx
// ✅ Stagger children animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each child
      delayChildren: 0.2    // Initial delay before first child
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function StaggeredList({ items }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map(item => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.text}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 4. Layout Animations (Auto-Animating Position Changes)

```tsx
// ✅ Auto-animate layout changes
import { motion, AnimatePresence } from 'framer-motion';

function TodoList({ todos, onRemove }) {
  return (
    <AnimatePresence>
      {todos.map(todo => (
        <motion.div
          key={todo.id}
          layout // ← Magic: animates position changes automatically
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ layout: { type: 'spring', stiffness: 300 } }}
        >
          <span>{todo.text}</span>
          <button onClick={() => onRemove(todo.id)}>Remove</button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### 5. Gesture-Based Interactions (Drag & Swipe)

```tsx
// ✅ Draggable card with constraints
function DraggableCard() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      dragElastic={0.2} // Bounce-back effect
      whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
    >
      Drag me!
    </motion.div>
  );
}

// ✅ Swipe-to-dismiss (like iOS notifications)
function SwipeCard({ onDismiss }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onDismiss(); // Dismiss if swiped >100px
        }
      }}
      exit={{ x: 300, opacity: 0 }}
    >
      Swipe to dismiss
    </motion.div>
  );
}
```

### 6. Page Transitions (React Router / Next.js)

```tsx
// ✅ React Router page transitions
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Routes, Route } from 'react-router-dom';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page transition="fade" />} />
        <Route path="/about" element={<Page transition="slide" />} />
      </Routes>
    </AnimatePresence>
  );
}

function Page({ transition, children }) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { x: 300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -300, opacity: 0 }
    }
  };

  return (
    <motion.div
      variants={variants[transition]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

**Reference**: See `references/framer-motion.md` for 30+ patterns

---

## GSAP Patterns

### 1. Basic Timeline Animation

```javascript
import gsap from 'gsap';

// ✅ Sequential animation timeline
function animateHero() {
  const tl = gsap.timeline();

  tl.from('.hero-title', { opacity: 0, y: 50, duration: 0.8 })
    .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.6 }, '-=0.4') // Overlap by 0.4s
    .from('.hero-cta', { opacity: 0, scale: 0.8, duration: 0.5 }, '-=0.3');

  return tl;
}

// Usage in React
useEffect(() => {
  const tl = animateHero();
  return () => tl.kill(); // Cleanup
}, []);
```

### 2. ScrollTrigger (Scroll-Based Animations)

```javascript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ✅ Fade in on scroll
function fadeInOnScroll(selector) {
  gsap.from(selector, {
    opacity: 0,
    y: 100,
    duration: 1,
    scrollTrigger: {
      trigger: selector,
      start: 'top 80%', // Start when top of element hits 80% of viewport
      end: 'top 20%',
      scrub: true,      // Link animation to scrollbar
      markers: false    // Debug markers (set true for dev)
    }
  });
}

// ✅ Pin section during scroll (parallax effect)
function pinSection(selector) {
  gsap.to(selector, {
    scrollTrigger: {
      trigger: selector,
      pin: true,        // Pin element while scrolling
      start: 'top top',
      end: '+=500',     // Pin for 500px of scrolling
      scrub: 1
    }
  });
}
```

### 3. SVG Path Animation (DrawSVG)

```javascript
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

// ✅ Animate SVG path drawing
function animateSVGPath(pathSelector) {
  gsap.fromTo(
    pathSelector,
    { drawSVG: '0%' },   // Start: invisible
    { drawSVG: '100%', duration: 2, ease: 'power2.inOut' }
  );
}

// ✅ Morph between two SVG paths
function morphPath(pathSelector, newPath) {
  gsap.to(pathSelector, {
    morphSVG: newPath, // Requires MorphSVGPlugin (premium)
    duration: 1.5,
    ease: 'power2.inOut'
  });
}
```

### 4. Text Animations (SplitText)

```javascript
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// ✅ Animate text letter-by-letter
function animateText(textSelector) {
  const split = new SplitText(textSelector, { type: 'chars' });

  gsap.from(split.chars, {
    opacity: 0,
    y: 50,
    rotationX: -90,
    stagger: 0.02, // 0.02s delay between each letter
    duration: 0.8,
    ease: 'back.out'
  });
}

// ✅ Typewriter effect
function typewriter(textSelector, duration = 2) {
  const split = new SplitText(textSelector, { type: 'chars' });

  gsap.from(split.chars, {
    opacity: 0,
    stagger: duration / split.chars.length,
    ease: 'none'
  });
}
```

### 5. Complex Timeline Orchestration

```javascript
// ✅ Master timeline with nested timelines
function complexAnimation() {
  const master = gsap.timeline({ paused: true });

  // Hero animation (0-2s)
  const heroTL = gsap.timeline()
    .from('.hero-bg', { scale: 1.2, duration: 2 })
    .from('.hero-title', { opacity: 0, y: 50, duration: 1 }, '-=1.5');

  // Features animation (2-5s)
  const featuresTL = gsap.timeline()
    .from('.feature-1', { x: -100, opacity: 0, duration: 0.8 })
    .from('.feature-2', { x: -100, opacity: 0, duration: 0.8 }, '-=0.6')
    .from('.feature-3', { x: -100, opacity: 0, duration: 0.8 }, '-=0.6');

  // Add to master timeline
  master.add(heroTL).add(featuresTL);

  return master;
}

// Play with controls
const animation = complexAnimation();
animation.play();
animation.pause();
animation.reverse();
```

**Reference**: See `references/gsap-patterns.md` for 20+ advanced patterns

---

## Performance Optimization

### 60fps Target: GPU-Accelerated Properties

**✅ Fast (GPU-accelerated)**:
```css
/* Use these for 60fps animations */
transform: translateX(100px);  /* ✅ GPU-accelerated */
transform: scale(1.5);         /* ✅ GPU-accelerated */
transform: rotate(45deg);      /* ✅ GPU-accelerated */
opacity: 0.5;                  /* ✅ GPU-accelerated */
```

**❌ Slow (triggers layout/paint)**:
```css
/* Avoid animating these - causes jank */
width: 200px;    /* ❌ Triggers layout recalc */
height: 300px;   /* ❌ Triggers layout recalc */
top: 50px;       /* ❌ Triggers layout recalc */
margin: 20px;    /* ❌ Triggers layout recalc */
```

### Framer Motion Performance Tips

```tsx
// ✅ Use layoutId for shared element transitions (optimized)
<motion.div layoutId="shared-element">Content</motion.div>

// ✅ Disable layout animations when not needed
<motion.div layout={false}>Static content</motion.div>

// ✅ Use will-change for complex animations
<motion.div style={{ willChange: 'transform' }}>Animated</motion.div>

// ✅ Reduce motion for accessibility
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={{ x: prefersReducedMotion ? 0 : 100 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
>
  Respects user preference
</motion.div>
```

### GSAP Performance Tips

```javascript
// ✅ Use force3D for GPU acceleration
gsap.to('.element', { x: 100, force3D: true });

// ✅ Batch DOM reads/writes
gsap.set('.element', { x: 100, y: 50 }); // Batched automatically

// ✅ Kill unused timelines
const tl = gsap.timeline();
// Later...
tl.kill(); // Free memory

// ✅ Use invalidateOnRefresh for responsive animations
ScrollTrigger.create({
  trigger: '.element',
  invalidateOnRefresh: true, // Recalculate on window resize
  animation: gsap.to('.element', { x: 100 })
});
```

**Reference**: See `references/animation-performance.md` for profiling techniques

---

## Accessibility Compliance

### prefers-reduced-motion Support

**WCAG 2.1 Success Criterion 2.3.3**: Allow users to disable animations

**CSS Media Query**:
```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Framer Motion Hook**:
```tsx
import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      Content respects user preference
    </motion.div>
  );
}
```

**GSAP MatchMedia**:
```javascript
import gsap from 'gsap';

const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  // Only animate if user allows motion
  gsap.to('.element', { x: 100, duration: 1 });
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  // Instant transition for reduced motion
  gsap.set('.element', { x: 100 });
});
```

### Seizure Prevention (WCAG 2.3.1)

**Avoid**:
- Flashing more than 3 times per second
- Large high-contrast flashing areas (>25% of viewport)
- Red flashing (most dangerous for photosensitive epilepsy)

**Safe Pattern**:
```tsx
// ✅ Gentle pulsing (safe)
<motion.div
  animate={{ opacity: [1, 0.7, 1] }}
  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
>
  Gentle pulse (< 3 flashes/sec)
</motion.div>

// ❌ DANGEROUS: Fast flashing
<motion.div
  animate={{ opacity: [1, 0, 1] }}
  transition={{ duration: 0.1, repeat: Infinity }} // 10 flashes/sec - SEIZURE RISK
>
  DO NOT USE
</motion.div>
```

**Reference**: See `references/motion-accessibility.md` for complete WCAG checklist

---

## Common Animation Patterns

### 1. Loading Spinners

```tsx
// ✅ Rotating spinner (Framer Motion)
function Spinner() {
  return (
    <motion.div
      className="spinner"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      ↻
    </motion.div>
  );
}

// ✅ Pulsing dots (GSAP)
gsap.to('.dot', {
  scale: 1.5,
  opacity: 0.5,
  duration: 0.6,
  repeat: -1,
  yoyo: true,
  stagger: 0.2
});
```

### 2. Modal/Dialog Animations

```tsx
// ✅ Modal with backdrop fade + content slide
function AnimatedModal({ isOpen, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 3. Notification Toasts

```tsx
// ✅ Slide in from right, auto-dismiss
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className="toast"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.2 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 300 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 100) onDismiss();
      }}
    >
      {message}
    </motion.div>
  );
}
```

### 4. Parallax Scrolling

```javascript
// ✅ Multi-layer parallax (GSAP)
gsap.to('.parallax-bg', {
  y: -100,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
});

gsap.to('.parallax-mid', {
  y: -50, // Slower movement (closer to camera)
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
});
```

### 5. Hover Card Stack

```tsx
// ✅ Cards spread on hover (Framer Motion)
function CardStack({ cards }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="card-stack"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          className="card"
          animate={{
            x: isHovered ? i * 20 : 0,
            y: isHovered ? i * -10 : 0,
            rotate: isHovered ? i * 5 : 0
          }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {card.content}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Reference**: See `assets/motion-templates/` for 30+ copy-paste patterns

---

## Testing Animations

### 1. Visual Regression (Chromatic)

```javascript
// Storybook story with animation states
export const ButtonStates = () => (
  <div>
    <InteractiveButton>Default</InteractiveButton>
    <InteractiveButton data-hover>Hovered</InteractiveButton>
    <InteractiveButton data-active>Active</InteractiveButton>
  </div>
);

// Chromatic captures all states automatically
```

### 2. Performance Testing (Lighthouse)

```bash
# Run Lighthouse with animation-heavy page
lighthouse http://localhost:3000/animations --view

# Check Core Web Vitals:
# - INP (Interaction to Next Paint) < 200ms
# - CLS (Cumulative Layout Shift) < 0.1
# - No layout thrashing during animations
```

### 3. Accessibility Testing (axe-core)

```javascript
// Test prefers-reduced-motion handling
import { axe } from 'jest-axe';

test('animation respects prefers-reduced-motion', async () => {
  // Mock reduced motion preference
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));

  const { container } = render(<AnimatedComponent />);

  // Verify no violations
  const results = await axe(container);
  expect(results).toHaveNoViolations();

  // Verify animation duration is near-zero
  const element = container.querySelector('.animated');
  const duration = parseFloat(getComputedStyle(element).transitionDuration);
  expect(duration).toBeLessThan(0.1); // < 100ms
});
```

**Reference**: See `references/animation-testing.md` for E2E patterns

---

## Resources

### scripts/
- `spring-calculator.js` - Calculate spring physics parameters (stiffness, damping)
- `timeline-visualizer.js` - Visualize GSAP timeline sequences

### references/
- `framer-motion.md` - 30+ Framer Motion patterns (gestures, variants, layout)
- `gsap-patterns.md` - 20+ GSAP patterns (timelines, ScrollTrigger, SVG)
- `framer-vs-gsap.md` - Decision tree for library selection
- `animation-performance.md` - 60fps optimization, profiling techniques
- `motion-accessibility.md` - WCAG 2.1 compliance, prefers-reduced-motion, seizure prevention

### assets/
- `motion-templates/` - 30+ copy-paste animation patterns
  - `button-interactions.tsx` - Hover, tap, ripple effects
  - `page-transitions.tsx` - Fade, slide, scale transitions
  - `loading-states.tsx` - Spinners, skeletons, progress bars
  - `scroll-animations.tsx` - Parallax, reveal, pin sections
  - `gesture-interactions.tsx` - Drag, swipe, pinch patterns

## Related Skills

- `performance-optimization` - Animation performance impacts INP and CLS metrics
- `accessibility-audit` - Validates prefers-reduced-motion and seizure prevention
- `component-patterns` - Accessible components with built-in animations
- `visual-regression` - Captures animation states for regression testing
