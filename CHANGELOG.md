# 📜 Changelog — `Hyperstack`

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-11-26

### Added
- **HxGrid Flyweight Component Registry (`coltyp: "compid"`)**: Transitioned `<hx-grid>` data cells to a high-speed DOM recycling pool where the component IS the cell. Supports `text`, `metatext`, `chipsui`, `dropdown`, `checkbox`, and `date` with zero nested gaps, matching flush 40px gridlines.
- **Server-Pushed Directives (`.fx`)**: Server pushes behavioral constraints (e.g. `mode: "single"` for nurses vs `mode: "multi"` for physicians) to execute on the client in 0.0ms with zero HTTP round-trips while preserving server-side transaction validation.
- **Million-Row Zero-Lag Virtualization**: Constant $O(1)$ memory consumption via ~30 pooled viewport DOM rows, eliminating HTML wire bloat (~35MB primitive tuples vs ~500MB markup).
- **1:1 Go DSL Component Parity**: Full Go DSL constructors for `HxGrid`, `GridColumn`, and `CellDirectives` in `go/components/components.go`.
- **Atomic Precision Documentation & Domain Specification**: Published comprehensive architecture guide at `/docs/components/atomic-precision` detailing the 4 Core Atomic Pillars and concrete implementation examples across CMS, E-Commerce Buy Box, Large Enterprise DataGrids, 120Hz Kinetic Game Simulators, and Spatial Mobile OS.
- **`$diag` Autonomous Live Diagnostics Service**: Runtime error interceptor capturing CSS asset load failures (<link>, <script>, <img>), HTMX partial swap errors (`htmx:responseError`, `targetError`, `swapError`), and JavaScript runtime exceptions without manual inspection.
- **Admin Diagnostics Live Service Menu**: Integrated full-featured real-time `@diag` incident dashboard into `HyperAdmin` (`/demo/tailadmin`) with live category filters (404s, CSS/Assets, Swaps, JS), error counters, and one-click machine-actionable AI prompt and SARIF 2.1.0 exports.
- **Backend Telemetry Sentinel**: Added `/api/diag/log`, `/api/diag/logs`, `/api/diag/clear`, and `/api/diag/simulate` endpoints to `server.ts` and `server.go`, automatically trapping and logging all server 404s into a thread-safe circular buffer.
- **MetaComponents Tier**: High-density components designed for ERP and data-heavy interfaces. Provides regular components enhanced with structured metadata tiers (Header, Hero, Footer) that fit within standard component footprints.
- **`MetaText` Component**: Added `views/components/text.html` and `go/components/metatext.go` featuring strict single-line truncation, mandatory baseline padding, auto-growing widths, and 1:1 Go DSL parity.
- **Unified Documentation**: Updated `/docs/components/text` with dual-tab comparison (`[Text Field]` and `[MetaText Field]`) demonstrating Form, Table, and Telemetry use cases in light theme.

---

## [0.1.0] - 2026-09-12

### 🌟 Initial Production Release (The Hypermedia Platform for Go, Rust, Python & .NET)

`Hyperstack` v0.1.0 provides a complete, hyperreactive, node-free hypermedia platform designed for backend developers.

### 🚀 10 Modular Core Micro-Engines (~48KB total)
- **`HxBolt` (`htmx-bolt.js`)**: Signal-based reactive state proxy, microtask batching scheduler, typo guard, and 120 FPS high-frequency ticker.
- **`HxBolt.matrix`**: Atomic 2D Sparse Matrix Signals with $O(1)$ cell indexing and subscriber callbacks.
- **`HxFlash` (`htmx-flash.js`)**: In-memory zero-latency fuzzy search, multi-column filtering, and TypedArray columnar store (`createColumnStore`).
- **`HxVirtual` (`htmx-virtual.js`)**: Bi-directional 2D windowing virtualization with pinned rows and columns for million-row tables.
- **`HxCalc` (`htmx-calc.js`)**: Reactive spreadsheet formula engine with topological sorting DAG and circular reference detection (`#CYCLE!`).
- **`HxForm` (`htmx-form.js`)**: Declarative form validation state machine, optimistic updates, and cell transaction rollback manager (`Ctrl+Z`/`Ctrl+Y`).
- **`HxVibe` (`htmx-vibe.js`)**: Spring physics solver, FLIP layout animation manager, and intersection view transitions.
- **`HxA11y` (`htmx-a11y.js`)**: WAI-ARIA focus trap, roving tabindex, and 2D matrix navigation with Excel-style bounding box range selection.
- **`HxOffline` (`htmx-offline.js`)**: Offline queueing with automatic backoff and IndexedDB persistence.
- **`HxDevTools` (`htmx-devtools.js`)**: Real-time signal inspector, swap latency timer, and `@diag` telemetry HUD.

### 🌐 Protocols & Integrations
- **HyperStream Micro-Delta Protocol**: Server-driven delta parsing (`Δrow:col:val:flashClass`) over SSE or WebSockets with 60 FPS RAF batching.
- **Autonomous Spatial Bridge (`HxSpatial`)**: Directs `[hx-3d]`, `[3denv]`, `[3datmos]`, `[3dfx]`, and `<hx-viewport>` elements to `htmFX` with `@diag FX-0404` fallback.
- **Canonical Schema & Machine Discovery**: Published `llms.txt` and `schema/hyperstack.json` covering all component grammar and attributes.
