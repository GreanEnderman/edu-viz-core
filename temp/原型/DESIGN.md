# Design System Document: The Architecture of Insight

## 1. Overview & Creative North Star
**Creative North Star: "The Illuminated Mind"**

This design system is not a utility; it is a sanctuary for thought. To facilitate "Aha!" moments, the UI must disappear, leaving only the clarity of wisdom. We reject the cluttered "dashboard" aesthetic of traditional EdTech in favor of a **High-End Editorial** experience. 

We break the template-driven mold through **intentional asymmetry** and **breathable compositions**. By utilizing expansive white space (the "breathing" room) and overlapping glassmorphic layers, we create a sense of intellectual depth. This system mimics the feeling of a sun-drenched library—modern, quiet, and profoundly focused.

---

## 2. Color & Tonal Architecture
The palette is rooted in organic, tactile materials. We move away from digital "pure whites" to a sophisticated cream base that reduces eye strain and evokes the quality of archival paper.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. 
Structure must be achieved through:
1.  **Background Shifts:** Distinguish a sidebar from a main feed by moving from `surface` (#faf9f5) to `surface-container-low` (#f4f4f0).
2.  **Tonal Transitions:** Use subtle color blocking to group related content. 
3.  **Negative Space:** Use the Spacing Scale (specifically `8`, `12`, and `16`) to create mental "break points" between concepts.

### Surface Hierarchy & Nesting
Treat the UI as a physical desk with stacked sheets of fine paper and frosted glass.
*   **Base Layer:** `surface` (#faf9f5).
*   **Sectional Layer:** `surface-container-low` (#f4f4f0) for large background regions.
*   **Focus Layer:** `surface-container-lowest` (#ffffff) for primary cards or interactive modules to provide a soft, natural lift.
*   **Active Layer:** `surface-bright` (#faf9f5) for elevated interactive states.

### The Glass & Gradient Rule
To evoke the "flowing" nature of epiphany, use semi-transparent glassmorphism for floating navigation and modals. 
*   **Formula:** Apply a `surface` color at 70% opacity with a `20px` to `40px` backdrop blur.
*   **Signature Textures:** For high-impact CTAs, use a subtle linear gradient from `primary` (#182544) to `primary-container` (#2e3b5b) at a 135-degree angle. This adds "soul" and depth that flat Indigo cannot achieve.

---

## 3. Typography & Editorial Rhythm
We employ a high-contrast typographic scale to guide the student's journey from broad wisdom to granular detail.

*   **The Voice (Headings):** **Newsreader.** This refined serif conveys authority and history. Use `display-lg` for moment-of-arrival headers. Use `headline-md` for lesson titles to ground the user in a scholarly environment.
*   **The Engine (UI/Body):** **Manrope.** A clean, modern sans-serif that ensures maximum legibility for complex learning materials. 
*   **Editorial Rhythm:** Lean into extreme scale differences. A `display-lg` headline paired with a `body-md` description creates a focal point that forces the eye to prioritize the "insight" over the "interface."

---

## 4. Elevation & Depth
Depth in this system is a result of light and shadow, not lines and boxes.

*   **The Layering Principle:** Stack `surface-container` tiers to create hierarchy. A `surface-container-highest` (#e3e2df) element should only be used for the most crucial utility overlays (like a search bar).
*   **Ambient Shadows:** For "floating" glass elements, use an extra-diffused shadow: `0px 20px 40px rgba(27, 28, 26, 0.06)`. The shadow must feel like ambient light catching an edge, never like a heavy digital drop shadow.
*   **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility, use the `outline-variant` (#c5c6cf) at **15% opacity**. This creates a "whisper" of a container that doesn't disrupt the flow of the page.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`), using the signature Indigo gradient. Typography: `label-md` in `on-primary` (#ffffff).
*   **Secondary (The Enlightenment Button):** `surface-container-lowest` background with a `secondary` (#775a19) text color. Use this for "Reveal Hint" or "Deep Dive" actions.
*   **Tertiary:** Ghost style. No background, `primary` text, transitions to a subtle `surface-container` fill on hover.

### Glass Cards (The Insight Module)
Used for "Aha!" moments or key takeaways. 
*   **Style:** `surface` at 80% opacity, `backdrop-blur-xl`, `rounded-xl`.
*   **Content:** No dividers. Use `3.5` (1.2rem) spacing between the serif header and the sans-serif body.

### Input Fields
*   **Style:** Minimalist underline or "Ghost Border" container. 
*   **States:** On focus, the border opacity increases to 100% of `secondary` (Gold), signifying the "lighting of a spark."

### Progress Curves (Unique Component)
Instead of a linear progress bar, use an "Elegant Curve"—a thin, flowing SVG line using `secondary-fixed-dim` (#e9c176) that grows across the top of a container, representing the non-linear journey of learning.

---

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetric layouts. Place a heading on the left and a body paragraph offset to the right to create an editorial, "premium magazine" feel.
*   **DO** embrace the "Breathing Space." If a layout feels full, increase the spacing to the next tier in the scale (e.g., move from `10` to `16`).
*   **DO** use `secondary` (Gold) sparingly. It is a "spark" color—save it for the exact moment a student reaches a conclusion.

### Don't
*   **DON'T** use 1px solid borders to separate list items. Use `1.5` (0.5rem) of vertical space or a subtle background hover state.
*   **DON'T** use pure black (#000000). Always use `on-surface` (#1b1c1a) to maintain the softness of the "wisdom-inspired" palette.
*   **DON'T** crowd the edges. Every component should have at least `6` (2rem) of padding from the viewport edge to maintain the "minimalist sanctuary" feel.