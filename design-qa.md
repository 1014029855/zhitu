# Design QA

## Scope

- Product: Zhitu learning platform and psychology course system.
- Surfaces: login, dashboard, course catalog, course overview, interactive lesson, course studio, competitions, papers, exercises, AI assistant, admin, and mobile layouts.
- Lesson reference: `C:\\Users\\17187\\.codex\\generated_images\\019ebb48-54d7-7f13-91ac-0f06b65161c9\\exec-cbb905d5-d39e-47bd-bc72-5cbcd7fa8978.png` (1586 x 992).
- Overview/studio reference: `C:\\Users\\17187\\.codex\\generated_images\\019ebb48-54d7-7f13-91ac-0f06b65161c9\\exec-5c26e4cb-47a4-4dc1-99f2-002265123087.png` (1604 x 980).
- Browser: installed Google Chrome, headless, device scale factor 1.

## Captured States

| Surface | Viewport | State | Capture |
| --- | --- | --- | --- |
| Login | 1440 x 960 | Guest, live captcha | `qa-login.png` |
| Dashboard | 1440 x 960 | Student, active course | `qa-home.png` |
| Course catalog | 1440 x 960 | Student, 13 courses | `qa-courses.png` |
| Course overview | 802 x 980 | Psychology course, module 3 expanded | `qa-course-overview.png` |
| Interactive lesson | 1586 x 992 | Simulation control and conclusion selected | `qa-lesson-simulation.png` |
| Transfer question | 1586 x 992 | Open response completed | `qa-lesson-transfer.png` |
| Learning notebook | 1586 x 992 | Explanation drafted after four activities | `qa-lesson-notebook.png` |
| Course studio | 802 x 980 | Admin editing interactive content | `qa-course-studio.png` |
| Competitions, papers, exercises | 1440 x 960 | Populated list states | `qa-competition.png`, `qa-papers.png`, `qa-exercises.png` |
| AI assistant, admin | 1440 x 960 | Empty and populated states | `qa-ai.png`, `qa-admin.png` |
| Dashboard and course | 390 x 844 | Mobile layouts | `qa-home-mobile.png`, `qa-course-mobile.png` |

All implementation captures are stored under `C:\\Users\\17187\\.codex\\visualizations\\2026\\06\\12\\019ebb48-54d7-7f13-91ac-0f06b65161c9`.

## Combined Comparisons

- Lesson reference above live simulation: `qa-lesson-comparison.png`.
- Overview/studio reference above live overview/studio: `qa-course-comparison.png`.

The final comparisons use the same source viewport dimensions. They were inspected together for frame proportions, density, type hierarchy, surface treatment, color mapping, and control states.

## Fidelity Review

- **Layout and spacing:** Passed. The course preserves the reference's compact navigation, dense module rows, three-column lesson frame, mastery rail, fixed lesson actions, and three-column authoring studio. Dashboard and list pages use the same constrained width, thin dividers, and compact row rhythm.
- **Typography:** Passed. The serif Zhitu brand is paired with a local Chinese sans stack. Heading scale, weight, line height, zero letter spacing, and truncation remain consistent across learning, research, competition, exercise, AI, authentication, and admin surfaces.
- **Colors and surfaces:** Passed. White and neutral-gray surfaces, green progression, blue prompts, coral correction, low-radius controls, and low-elevation borders match the concept. Decorative gradients, blur orbs, oversized round cards, and one-off dark panels are absent from rendered routes.
- **Icons:** Passed. Visible controls use Lucide icons with consistent 15-18 px sizing. Search, navigation, hints, evidence movement, lesson actions, saving, authoring, account, and external-link actions are represented.
- **Copy and content:** Passed. Generic promotional copy was replaced with task-specific Chinese. External paper markup is converted to plain text before rendering. Course content uses Zhitu's psychology curriculum rather than reference-site fields.
- **Behavior and states:** Passed. The four-stage memory lesson supports classification, interview choice, a manipulable wording experiment, and an open transfer response. Correctness feedback advances the sequence; the learning notebook stores explanation, example, question, and confidence. Course units, navigation, filters, forms, account menus, and studio variant controls remain functional.
- **Responsiveness and accessibility:** Passed. Chrome reported no horizontal overflow at 1440, 1586, 802, or 390 px. The 802 px design retains the dense desktop navigation seen in the concept; the 390 px layout switches to a mobile menu. Focus-visible styles, native form labels, semantic buttons, reduced motion, non-color status labels, and practical touch targets are present.
- **Images and assets:** Passed. The referenced operational screens contain no photographic product assets. No fake illustration, CSS art, handcrafted SVG, or placeholder image was introduced.

## Comparison History

1. **P1 - shallow, reading-first course:** Replaced by a problem-first sequence with evidence classification, decision, simulation, transfer writing, explanation, mastery evidence, review timing, and saved notes.
2. **P1 - fragmented site styling:** Replaced the old side shell, gradients, generic cards, inconsistent detail pages, and mixed admin styles with one shared learning product system.
3. **P1 - course authoring could not express richer activities:** Added editable simulation and open-response variants while preserving the existing activity schema and lightweight local stack.
4. **P2 - tablet navigation collapsed too early:** Moved the mobile breakpoint to 680 px and tightened the medium layout so the 802 px reference density is preserved.
5. **P2 - external research titles exposed HTML fragments:** Added DOM parsing before display so imported titles, abstracts, and author fields render as clean text.
6. **P2 - generic AI and authentication language:** Replaced broad claims and decorative font treatments with direct learning prompts and the shared type system.

No P1 or P2 findings remain.

## Intentional P3 Differences

- Live local progress is `0-1%`, not the concept's illustrative `42-65%`.
- The lesson comparison shows Zhitu's new wording simulation rather than the concept's transient drag ghost; the earlier evidence-classification interaction remains the first stage of the same lesson.
- The studio displays Zhitu's actual curriculum fields and blocks, as requested, instead of copying reference text.
- Course overview rows reflect seven real modules and 50 lessons, so the content is longer than the illustrative reference.

## Functional Verification

- Chrome console errors: 0.
- Chrome page errors: 0.
- Local HTTP responses >= 400: 0.
- Horizontal overflow findings: 0.
- Production build: passed.
- Automated tests: 12 passed, 0 failed.
- Visual attempt responses were intercepted, so QA did not persist artificial learning results to the local database.

## Final Result

passed
