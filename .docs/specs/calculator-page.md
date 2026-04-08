# Behavioral Specification — Calculator Page

**Date**: 2026-04-08
**Source**: Intent (add a calculator page) + ideation proposal + RFC
**Scope**: All observable behaviors of the calculator accessible via external interfaces (button clicks, keyboard input, display output)

---

## 1. Route & Mount

- The calculator is accessible at the `/calculator` path.
- On load, the display area shows `0` and the expression line is empty.
- The display area is focusable and receives focus on mount.

---

## 2. Display

- The display area always shows the current operand as a right-aligned string.
- An expression line above the display shows the accumulated expression (e.g. `125 + 7`) or the completed expression with `=` (e.g. `125 + 7 =`).
- When a result is displayed (after pressing `=`), both lines are visible until the next input.
- The display result line is capped at 15 characters; very large results are shown in scientific notation.
- The expression line is capped at 30 characters; longer expressions truncate from the left with a `…` prefix, showing the most recent 29 characters.

---

## 3. Digit Entry

- Pressing a digit button appends that digit to the current operand.
- Pressing a digit when the display shows only `0` replaces `0` with the digit (no leading zeros).
- Subsequent digit presses append to the right.
- When the display is showing a computed result (after `=`), the next digit press clears the result and expression and starts a fresh operand.
- The display ignores digit input once it reaches 15 characters.

---

## 4. Decimal Entry

- Pressing the decimal point appends `.` to the current operand.
- If the operand already contains `.`, the decimal point button is ignored.
- Pressing decimal when the display is `0` produces `0.`.

---

## 5. Operators

- Pressing `+`, `−`, `×`, or `÷` stores the current operand and operator.
- The expression line updates to show the stored operand and operator.
- If an operator is already pending and the user presses a different operator, the first operator is replaced by the second without committing a calculation.
- If an operator is already pending and the user presses the same operator again, the expression is updated to reflect the new operator and the display value remains unchanged.
- Pressing an operator when no operand has been entered does not change state.

---

## 6. Live Preview

- After entering an operator and a second operand, the display shows the result of applying the pending operator to the stored operand and the current operand.
- This preview updates each time the second operand changes.

---

## 7. Equals — Committing a Calculation

- Pressing `=` commits the pending operation and displays the result.
- The expression line shows the full completed expression including `=`.
- The calculator enters "result-displayed" state.
- Pressing `=` a second time repeats the last operation using the displayed result as the new first operand (chained calculation).
- Pressing `=` with no operator pending is a no-op; the display and expression remain unchanged.

---

## 8. Clear

- Pressing `C` (clear) resets the display to `0`, the expression line to empty, and clears all stored operands and pending operators.
- The calculator returns to its initial state.

---

## 9. Backspace

- Pressing backspace removes the last character from the current operand.
- If removing the last character would leave the operand empty, the display shows `0`.
- Backspace has no effect when the expression is already empty (the display remains `0`).

---

## 10. Percent

- Pressing `%` divides the displayed value by 100 and updates the display.
- The expression line is not updated by the percent operation.

---

## 11. Sign Toggle

- Pressing `+/−` negates the displayed value.
- Pressing it on a positive number prepends a minus sign; pressing it on a negative number removes the minus sign.
- Pressing sign toggle when the display is `0` is a no-op (zero has no sign).

---

## 12. Error State

- Division by zero (`n ÷ 0`) causes the display to show `Error`.
- A numeric overflow that produces `Infinity` or `-Infinity` also causes the display to show `Error`.
- When `Error` is shown, the expression line is cleared and all subsequent operator and equals inputs are no-ops until a digit or `C` is pressed.
- Pressing any digit while `Error` is shown resets the machine: the display shows that digit, the expression line is cleared, and all stored state is cleared.
- Pressing `C` while `Error` is shown resets to the initial state.
- Backspace, percent, and sign toggle are no-ops while `Error` is shown.

---

## 13. Keyboard Support

- Keyboard digit keys (`0`–`9`) and the period (`.`) produce the same result as the corresponding digit and decimal buttons.
- Keyboard `+`, `-`, `*`, `/` produce the same result as the `+`, `−`, `×`, `÷` buttons respectively.
- `Enter` or `=` commits the current calculation (equivalent to the `=` button).
- `Backspace` removes the last character from the current operand (equivalent to the backspace button).
- `Escape` or `c` clears all state (equivalent to `C`).
- `%` divides the current operand by 100.
- `Shift+=` toggles the sign of the current operand.
- The `n` key does not trigger sign toggle (it is not wired to any calculator action).

---

## 14. Accessibility

- Every button has an `aria-label` that describes its action (e.g. "Divide", "Add", "Clear").
- The display area has `role="status"` and `aria-live="polite"` so that result changes are announced by screen readers without interrupting ongoing speech.
- Buttons have a visible focus ring when focused.
- Color is never the sole differentiator for any control; buttons are also distinguished by position.

---

## 15. Scope Boundaries (Out of Scope)

- Scientific functions (trigonometry, logarithms, exponents)
- Calculation history or memory (M+, M−, MR)
- Unit or currency conversion
- Dark mode (the page uses the project's existing warm palette)
