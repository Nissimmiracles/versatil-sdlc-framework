# WCAG 2.2 Complete Success Criteria Checklist

**Reference**: W3C Web Content Accessibility Guidelines 2.2 (October 2023)
**EAA Enforcement**: June 28, 2025

## Quick Reference: 9 NEW Success Criteria in WCAG 2.2

| Criterion | Level | Category | Requirement |
|-----------|-------|----------|-------------|
| **2.4.11** Focus Not Obscured (Minimum) | AA | Navigation | Focused element not fully hidden by content |
| **2.4.12** Focus Not Obscured (Enhanced) | AAA | Navigation | Focused element not obscured at all |
| **2.4.13** Focus Appearance | AAA | Navigation | **2px minimum** focus indicator with sufficient contrast |
| **2.5.7** Dragging Movements | AA | Input | Alternative to dragging (e.g., single tap/click) |
| **2.5.8** Target Size (Minimum) | AA | Input | **24x24 CSS pixels** for all tap/click targets |
| **3.2.6** Consistent Help | A | Understandable | Help mechanism in same location across pages |
| **3.3.7** Redundant Entry | A | Input Assistance | Don't require re-entering previously entered data |
| **3.3.8** Accessible Authentication (Minimum) | AA | Input Assistance | No cognitive function test for authentication |
| **3.3.9** Accessible Authentication (Enhanced) | AAA | Input Assistance | No cognitive tests; object recognition allowed |

---

## Level A (Minimum) - 30 Success Criteria

### Perceivable

**1.1 Text Alternatives**
- ✅ 1.1.1 Non-text Content - All images, icons, buttons have alt text

**1.2 Time-based Media**
- ✅ 1.2.1 Audio-only and Video-only (Prerecorded) - Transcript or audio description
- ✅ 1.2.2 Captions (Prerecorded) - Captions for all prerecorded video
- ✅ 1.2.3 Audio Description or Media Alternative (Prerecorded) - Audio description or transcript

**1.3 Adaptable**
- ✅ 1.3.1 Info and Relationships - Semantic HTML (headings, lists, tables)
- ✅ 1.3.2 Meaningful Sequence - Reading order makes sense
- ✅ 1.3.3 Sensory Characteristics - Don't rely only on shape/color/position

**1.4 Distinguishable**
- ✅ 1.4.1 Use of Color - Color not the only visual means
- ✅ 1.4.2 Audio Control - Pause/stop/mute for auto-playing audio

### Operable

**2.1 Keyboard Accessible**
- ✅ 2.1.1 Keyboard - All functionality available via keyboard
- ✅ 2.1.2 No Keyboard Trap - Can navigate away with keyboard
- ✅ 2.1.4 Character Key Shortcuts - Remappable or disable-able shortcuts

**2.2 Enough Time**
- ✅ 2.2.1 Timing Adjustable - Extend, disable, or adjust time limits
- ✅ 2.2.2 Pause, Stop, Hide - Control moving, blinking, scrolling content

**2.3 Seizures and Physical Reactions**
- ✅ 2.3.1 Three Flashes or Below Threshold - No more than 3 flashes per second

**2.4 Navigable**
- ✅ 2.4.1 Bypass Blocks - Skip navigation links
- ✅ 2.4.2 Page Titled - Descriptive `<title>` for each page
- ✅ 2.4.3 Focus Order - Logical tab order
- ✅ 2.4.4 Link Purpose (In Context) - Link text describes destination

**2.5 Input Modalities**
- ✅ 2.5.1 Pointer Gestures - Single-pointer alternative for multipoint gestures
- ✅ 2.5.2 Pointer Cancellation - Cancel accidental activations
- ✅ 2.5.3 Label in Name - Visible label text matches programmatic name
- ✅ 2.5.4 Motion Actuation - Disable motion-triggered functionality

### Understandable

**3.1 Readable**
- ✅ 3.1.1 Language of Page - `<html lang="en">` attribute

**3.2 Predictable**
- ✅ 3.2.1 On Focus - No context change on focus
- ✅ 3.2.2 On Input - No context change on input (unless warned)
- ✅ **3.2.6 Consistent Help** ⭐ NEW - Help in consistent location

**3.3 Input Assistance**
- ✅ 3.3.1 Error Identification - Describe input errors
- ✅ 3.3.2 Labels or Instructions - Forms have labels/instructions
- ✅ **3.3.7 Redundant Entry** ⭐ NEW - Auto-fill or reference previously entered data

### Robust

**4.1 Compatible**
- ✅ 4.1.2 Name, Role, Value - Custom controls have accessible name/role
- ✅ 4.1.3 Status Messages - Use ARIA live regions for status updates

---

## Level AA (Conformance) - 20 Success Criteria

### Perceivable

**1.2 Time-based Media**
- ✅ 1.2.4 Captions (Live) - Captions for live audio
- ✅ 1.2.5 Audio Description (Prerecorded) - Audio description for video

**1.3 Adaptable**
- ✅ 1.3.4 Orientation - No portrait/landscape restrictions
- ✅ 1.3.5 Identify Input Purpose - Autocomplete for personal data fields

**1.4 Distinguishable**
- ✅ 1.4.3 Contrast (Minimum) - **4.5:1 for text, 3:1 for large text**
- ✅ 1.4.4 Resize Text - Text resizable to 200% without loss
- ✅ 1.4.5 Images of Text - Use text, not images of text
- ✅ 1.4.10 Reflow - No horizontal scrolling at 320px width
- ✅ 1.4.11 Non-text Contrast - **3:1 for UI components and graphics**
- ✅ 1.4.12 Text Spacing - Adjust spacing without loss of content
- ✅ 1.4.13 Content on Hover or Focus - Dismissible, hoverable, persistent

### Operable

**2.4 Navigable**
- ✅ 2.4.5 Multiple Ways - Multiple navigation methods
- ✅ 2.4.6 Headings and Labels - Descriptive headings/labels
- ✅ 2.4.7 Focus Visible - Visible keyboard focus indicator
- ✅ **2.4.11 Focus Not Obscured (Minimum)** ⭐ NEW - Focus not fully hidden

**2.5 Input Modalities**
- ✅ **2.5.7 Dragging Movements** ⭐ NEW - Single-pointer alternative to drag
- ✅ **2.5.8 Target Size (Minimum)** ⭐ NEW - **24x24px minimum tap targets**

### Understandable

**3.1 Readable**
- ✅ 3.1.2 Language of Parts - `lang` attribute for language changes

**3.2 Predictable**
- ✅ 3.2.3 Consistent Navigation - Navigation in same order
- ✅ 3.2.4 Consistent Identification - Same components have same labels

**3.3 Input Assistance**
- ✅ 3.3.3 Error Suggestion - Suggest corrections for errors
- ✅ 3.3.4 Error Prevention (Legal, Financial, Data) - Confirm or reversible
- ✅ **3.3.8 Accessible Authentication (Minimum)** ⭐ NEW - No cognitive tests

---

## Level AAA (Enhanced) - 28 Success Criteria

### Perceivable

**1.2 Time-based Media**
- ✅ 1.2.6 Sign Language (Prerecorded) - Sign language interpretation
- ✅ 1.2.7 Extended Audio Description (Prerecorded) - Extended audio description
- ✅ 1.2.8 Media Alternative (Prerecorded) - Full transcript for video
- ✅ 1.2.9 Audio-only (Live) - Live captions for audio

**1.3 Adaptable**
- ✅ 1.3.6 Identify Purpose - Programmatically determine purpose

**1.4 Distinguishable**
- ✅ 1.4.6 Contrast (Enhanced) - **7:1 for text, 4.5:1 for large text**
- ✅ 1.4.7 Low or No Background Audio - Speech with minimal background
- ✅ 1.4.8 Visual Presentation - Line length, spacing, alignment controls
- ✅ 1.4.9 Images of Text (No Exception) - No images of text

### Operable

**2.1 Keyboard Accessible**
- ✅ 2.1.3 Keyboard (No Exception) - All functions keyboard accessible

**2.2 Enough Time**
- ✅ 2.2.3 No Timing - No time limits
- ✅ 2.2.4 Interruptions - Postpone or suppress interruptions
- ✅ 2.2.5 Re-authenticating - No data loss on re-authentication
- ✅ 2.2.6 Timeouts - Warn about session timeouts

**2.3 Seizures and Physical Reactions**
- ✅ 2.3.2 Three Flashes - No flashing at all
- ✅ 2.3.3 Animation from Interactions - Disable motion animations

**2.4 Navigable**
- ✅ 2.4.8 Location - Show current location in navigation
- ✅ 2.4.9 Link Purpose (Link Only) - Link text alone describes purpose
- ✅ 2.4.10 Section Headings - Organize content with headings
- ✅ **2.4.12 Focus Not Obscured (Enhanced)** ⭐ NEW - Focus not obscured at all
- ✅ **2.4.13 Focus Appearance** ⭐ NEW - **2px minimum focus indicator**

**2.5 Input Modalities**
- ✅ 2.5.5 Target Size (Enhanced) - 44x44px minimum targets
- ✅ 2.5.6 Concurrent Input Mechanisms - Support multiple input types

### Understandable

**3.1 Readable**
- ✅ 3.1.3 Unusual Words - Explain jargon and technical terms
- ✅ 3.1.4 Abbreviations - Expand abbreviations
- ✅ 3.1.5 Reading Level - Lower secondary education level (or supplement)
- ✅ 3.1.6 Pronunciation - Provide pronunciation for ambiguous words

**3.2 Predictable**
- ✅ 3.2.5 Change on Request - Context changes only on user request

**3.3 Input Assistance**
- ✅ 3.3.5 Help - Context-sensitive help available
- ✅ 3.3.6 Error Prevention (All) - Confirm or reversible for all submissions
- ✅ **3.3.9 Accessible Authentication (Enhanced)** ⭐ NEW - No cognitive tests (object recognition OK)

---

## Critical 2025 Requirements (EAA Enforcement)

These criteria have the biggest impact on most websites:

1. **2.5.8 Target Size (Minimum)** - 24x24px tap targets (AA)
   - Affects: Buttons, links, icons, form controls
   - Exception: Inline links in text
   - Impact: ~60% of mobile interfaces need adjustment

2. **2.4.11 Focus Not Obscured (Minimum)** - Focused element not fully hidden (AA)
   - Affects: Modal dialogs, sticky headers, overlays
   - Impact: ~30% of sites with modals/overlays

3. **3.3.8 Accessible Authentication (Minimum)** - No cognitive tests for login (AA)
   - Affects: CAPTCHAs, math problems, memory tests
   - Impact: ~40% of login systems

4. **1.4.3 Contrast (Minimum)** - 4.5:1 text, 3:1 UI (AA)
   - Affects: All text and UI components
   - Impact: Most common WCAG failure (50%+ of sites)

5. **2.1.1 Keyboard** - All functionality keyboard accessible (A)
   - Affects: All interactive elements
   - Impact: ~35% of custom widgets

---

## Testing Priority Order

1. **Automated** (axe-core catches ~40%):
   - Color contrast
   - Missing alt text
   - Form labels
   - ARIA attributes
   - Target size

2. **Manual Keyboard** (critical for AA):
   - Tab order
   - Focus visibility
   - No keyboard traps
   - Skip links

3. **Screen Reader** (real user testing):
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)
   - TalkBack (Android)

4. **Visual Regression** (prevent regressions):
   - Chromatic with Storybook
   - axe addon in CI/CD

---

## Compliance Levels Explained

**Level A** - Minimum (legal baseline in most jurisdictions)
**Level AA** - Conformance (standard for most organizations + EAA requirement)
**Level AAA** - Enhanced (aspirational; difficult to achieve for all content)

**Typical Target**: WCAG 2.2 Level AA (includes all A + AA criteria)
