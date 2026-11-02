# Changelog

All notable changes to Protoling are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Until 1.0, minor versions may include breaking changes.

## [Unreleased]

### Added

- **Share** in the play view: copy a preview link, or open the preview in a new tab. Board frames have a copy-link button. Links use the site you're on, so they work locally and when deployed, with nothing to configure.
- **Share builds** (`bun run build:share`): a deployable site with only the prototypes chosen in `protoling.config.ts` and none of Protoling's tooling. The root URL and unknown paths go to a start screen, and links keep their screen and `?v=` variant. Deploy notes for Vercel (`vercel.json` included) and Cloudflare Pages. ([#3](https://github.com/prashantrajm/protoling/issues/3))
- Opening an app URL in a desktop browser shows the app alone in a phone frame, at real device size, instead of stretched across the window.
- MIT license.
- Code of conduct, contributing guide, security policy, issue and pull request templates, and a CI workflow.

### Changed

- Previews open in preview mode: the hidden menu offers **Restart** instead of **Exit preview**, and Escape only closes it. **Exit preview** remains on your own dev server.

### Fixed

- Going back from a screen opened directly (no history to return to) no longer carries that screen's own query params, like `?task=`, to its parent. Variant choices (`?v=`) are kept.

## [0.1.0] - 2026-11-02

First release.

### Added

- **Projects as mini apps.** Each folder in `projects/` with an `app/` directory is mounted at `/<project>` from plain TanStack Router file routes, with type-checked links and params.
- **Native-style navigation from plain routes.** `<StackScreen>` presents a child route as a push, sheet or full-screen modal, from `staticData.presentation`. Edge swipe-back works on pushes, and sheets can be dragged to dismiss. `useDismiss()` animates out, then navigates. `useTabs()` remembers each tab's stack.
- **Motion tokens and variants** declared in `staticData.screen` and read with `useMotion()` and `useVariant()`. The chosen variant is kept in the URL (`?v=`), so links reproduce what you saw.
- **Play view.** The whole app runs on a phone frame at real device size, with device choice, replay, slow motion and full screen. The page URL follows the app.
- **Boards.** An automatic All screens board per project, with arrows from each screen to the screens it presents, plus curated boards in `boards/*.ts`. Every frame is a live copy of the app.
- **Inspector and handoff.** Curves and physics for every motion token and presentation transition, with generated Motion, SwiftUI and Jetpack Compose code. Spring conversions are unit-tested against Motion's own spring generator.
- **Phone preview.** Edge-to-edge on a real device, with a hidden menu opened by a three-finger tap or ⌘ . (Ctrl . on other keyboards), and an "Open on phone" QR code.
- **For coding agents.** `AGENTS.md` (loaded by Claude Code through `CLAUDE.md`), and `bun run snap`, which renders app states to PNGs.
- **Orbit**, an example app: onboarding, a tab bar, a pushed detail screen and a draggable sheet.
- Command palette (⌘K), keyboard shortcuts, and light, dark and system themes.

[Unreleased]: https://github.com/prashantrajm/protoling/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/prashantrajm/protoling/releases/tag/v0.1.0
