# RFC: Calculator Page

**Date**: 2026-04-08
**Status**: Draft

---

## 2000ft View

This RFC proposes adding a single-page calculator to the RedwoodSDK application. The calculator is a fully client-side React component — no API calls, no server state — rendering at the `/calculator` route. It performs basic arithmetic (addition, subtraction, multiplication, division) plus a curated set of supplementary operations (percentage, sign toggle, decimal entry, clear, backspace) that make it genuinely useful for everyday mental math without overwhelming the interface. The design adopts the project's existing warm palette and serif/sans-serif typography pairing, so the page feels native to the app rather than like an embedded third-party widget.

The choice of a basic arithmetic calculator over scientific, BMI, loan, or unit-converter alternatives reflects two constraints: (1) universal applicability — every visitor to the site has an immediate use for it — and (2) scope discipline. A scientific calculator with trigonometry and memory functions adds complexity and cognitive load without commensurate value for this project. The design intentionally stops at "feels complete for everyday use" rather than chasing feature parity with a phone's native app.

---

## Product Vision Lens

**What would make this transformative, not incremental?**

A calculator that feels *designed*, not assembled. Most web calculators are grids of grey buttons with no personality — they feel like tools dropped into a page. This one should feel like the page was *made for* this calculator.

Concretely:
- The calculator is not a generic utility. It carries the project's visual identity (Playfair Display for the display readout, Noto Sans for the buttons, the warm beige/orange palette) so it reads as a first-class feature rather than a DevTools snippet.
- The display has *presence*. It dominates the visual hierarchy — large, right-aligned, and typographically distinct — so the result is always the most legible thing on the screen. The running expression is visible above it in a smaller secondary line.
- Operations have subtle tactile feedback (a brief background color shift on press) so every tap confirms the machine received the input.

**What do users not know they need?**

- A persistent expression line above the result. Most calculators show only the current number; seeing `125 × 7 =` above the result means the user can verify their intent before committing to it.
- A graceful overflow strategy. Long numbers don't break the layout — the display scrolls horizontally, preserving button grid proportions at all screen widths.
- A clear-all that is visually distinct from backspace. Two different shapes and colors prevent destructive mis-taps.

---

## User Experience Lens

### Layout

```
┌──────────────────────────────────┐
│  [header: "Calculator"]          │
│                                  │
│  ┌────────────────────────────┐  │
│  │  125 × 7                   │  ← expression line (secondary, right-aligned)
│  │  875                       │  ← result line (primary, large)
│  └────────────────────────────┘  │
│                                  │
│  [C]  [⌫]   [ % ]  [ ÷ ]        │
│  [ 7] [ 8]   [ 9 ]  [ × ]        │
│  [ 4] [ 5]   [ 6 ]  [ − ]        │
│  [ 1] [ 2]   [ 3 ]  [ + ]        │
│  [+/−] [ 0 ]  [ . ]  [ = ]        │
│                                  │
│  [footer: keyboard hint]         │
└──────────────────────────────────┘
```

- **Display area**: Above the button grid, a two-line display. Top line shows the accumulated expression (`125 × 7`). Bottom line shows the current operand or the computed result (`875`). Both are right-aligned.
- **Button grid**: 5 rows × 4 columns. Digits fill the lower-left quadrant. Operators occupy the rightmost column. Utility ops (`C`, `⌫`, `%`, `+/−`) occupy the top row.
- **Max-width constraint**: The calculator card is centered and capped at `420px`. Below that width the grid compresses proportionally. The display area scrolls horizontally if a number exceeds the card width.

### Button Categories & Visual Treatment

| Category | Buttons | Style |
|---|---|---|
| Utility | C, ⌫, % | Light background, dark text |
| Operator | +, −, ×, ÷ | Orange background (`--color-orange`), white text |
| Equals | = | Orange-light background (`--color-orange-light`), dark text |
| Digit | 0–9 | Warm beige background (`--color-baige`), dark text, border |
| Sign | +/− | Light background, dark text |

This categorization means the user can locate any button by color alone — a meaningful accessibility win.

### Interactions

- **Digit press**: Appends digit to current operand. If the result is currently displayed (e.g., after `=`), pressing a digit starts a fresh calculation.
- **Operator press**: Stores the current operand and operator. Immediately previews the result of `storedOperand op currentOperand` in the result line (live preview) so the user sees the consequence of their action before entering the next operand.
- **Equals press**: Commits the calculation, displays the result, and sets the calculator to "result-displayed" state.
- **C (clear)**: Resets all state — operand, operator, expression. Equivalent to a full machine reset.
- **⌫ (backspace)**: Removes the last character from the current operand. If the operand becomes empty, it is treated as `0`.
- **% (percent)**: Divides the current operand by 100. Useful for tip calculations and discounts.
- **+/− (sign toggle)**: Negates the current operand.
- **Decimal point**: Inserts a decimal point. Ignored if the current operand already contains a decimal point.

### Error Handling

| Condition | Display | Behavior |
|---|---|---|
| Division by zero (`n ÷ 0`) | `Error` | Resets calculator state. No crash. |
| Overflow (number exceeds safe precision) | `Error` | Same. |
| Consecutive operators (`++`) | — | Second operator replaces the first without advancing calculation. |
| Pressing `=` with no operator pending | — | No-op. Result remains unchanged. |

No modal, no toast, no error banner — the word `Error` appears in the display area and the machine resets on the next digit or `C` press. This matches the behavior of physical calculators.

### Keyboard Support

The calculator is fully operable via keyboard:
- `0–9`, `.` → digit/decimal entry
- `+`, `-`, `*`, `/` → operators (standard keyboard symbols)
- `Enter` or `=` → equals
- `Backspace` → backspace
- `Escape` or `c` → clear
- `%` → percent
- `n` (or `Shift+=`) → negate

The display receives focus on mount. A visible `:focus-visible` ring ensures orientation is never lost.

---

## Challenge & Risk Lens

### Edge Cases

1. **Floating-point artifacts**: `0.1 + 0.2` in IEEE 754 returns `0.30000000000000004`. The calculator rounds displayed results to a maximum of 10 significant digits after the decimal point to suppress trailing noise. This is the standard mitigation used by Apple's Calculator and Google's search bar calculator.

2. **Leading zeros**: Typing `007` stores `7`, not `007`. Leading zeros are discarded on entry — the operand is parsed as a number, not a string.

3. **Multiple decimal points**: A second decimal press on an operand that already contains `.` is ignored. The display does not change.

4. **Rapid button mashing**: The implementation uses a functional state update pattern (`setState(prev => ...)`) so intermediate state is never lost. No debouncing is needed because React's state machine handles event serialization.

5. **Long expressions**: The expression line (`125 × 7`) is capped at 30 characters. Longer expressions truncate from the left with `…`. The result line always shows the full computed value up to the 10-digit limit.

6. **Screen resize**: CSS Grid is used for the button layout, not fixed pixel dimensions. The calculator is inherently responsive.

### Accessibility

- Every button has an `aria-label` describing its action (e.g., `aria-label="Divide"`).
- The display area has `role="display"` and `aria-live="polite"` so screen readers announce the current result.
- Button elements are used (not `<div>`) so the browser handles `:focus`, `:active`, and `:disabled` natively.
- Color is never the sole differentiator — operators differ from digits by color *and* position (right column vs. grid interior).
- The overall contrast ratio between button text and backgrounds exceeds WCAG AA (4.5:1) for normal text.

### Security

- Fully client-side. No network requests, no `eval`, no `new Function`, no `innerHTML`.
- No user-generated content is stored or displayed. Input is ephemeral.
- No third-party scripts or CDNs beyond the Google Fonts already loaded by the design system.

### Failure Modes

| Failure | Consequence | Recovery |
|---|---|---|
| Invalid state (e.g., operator with no operand) | Result line shows `0`. No crash. | User presses `C`. |
| Number overflow (JavaScript `Infinity`) | Display shows `Error`. State resets on next input. | Same as division by zero. |
| Browser without `Intl` (extremely rare) | Decimal rounding uses `toFixed`. Graceful degradation. | N/A |

---

## What This RFC Does NOT Cover

- Scientific functions (sin, cos, log, powers) — out of scope for v1
- Calculation history or memory (M+, M−, MR) — out of scope
- Unit conversion, currency conversion — out of scope
- Dark mode toggle — the page uses the existing warm palette; theming is a separate concern
- File structure, component names, CSS class naming conventions — handled in the Implementation RFC
- Test structure — handled by QA in the Spec Derivation phase
