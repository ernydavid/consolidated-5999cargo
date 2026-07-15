<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-rules -->
# UI Design Rule

Every new or modified dashboard shell, `page.tsx`, layout, operational view, settings view, and authentication page must comply with `APP_DESIGN_RULES.md`.

Treat `APP_DESIGN_RULES.md` as the canonical design specification for this project.

At minimum:
- dashboard pages must use an operational shell, not landing-page heroes;
- data pages must prefer compact top panels, reusable stat/action patterns, and dedicated detail navigation;
- settings pages must use vertically stacked responsibility cards;
- auth pages must use a distinct two-column shell on desktop and prioritize the form on mobile;
- menus, popovers and user surfaces must keep the same visual language;
- before introducing a new page-level pattern, reuse or extend an existing base component that already follows the design rules.
<!-- END:design-rules -->
