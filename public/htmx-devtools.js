(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __moduleCache = /* @__PURE__ */ new WeakMap;
  var __toCommonJS = (from) => {
    var entry = __moduleCache.get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function")
      __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
        get: () => from[key],
        enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
      }));
    __moduleCache.set(from, entry);
    return entry;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: (newValue) => all[name] = () => newValue
      });
  };

  // src/htmx-devtools.ts
  var exports_htmx_devtools = {};
  __export(exports_htmx_devtools, {
    HxDevTools: () => HxDevTools,
    DiagnosticService: () => DiagnosticService,
    $diag: () => $diag
  });

  class DiagnosticService {
    events = [];
    maxEvents = 200;
    listeners = [];
    isInitialized = false;
    constructor() {
      if (typeof window !== "undefined") {
        this.initAutoCapture();
      }
    }
    initAutoCapture() {
      if (this.isInitialized || typeof window === "undefined")
        return;
      this.isInitialized = true;
      window.addEventListener("error", (event) => {
        const target = event.target;
        if (target && target !== window) {
          const tagName = target.tagName ? target.tagName.toUpperCase() : "";
          if (tagName === "LINK") {
            const href = target.getAttribute("href") || target.href || "unknown stylesheet";
            this.record({
              code: "CSS_LOAD_FAILURE",
              category: "CSS_ASSET",
              severity: "ERROR",
              culprit: href,
              target: '<link rel="stylesheet">',
              message: `CSS stylesheet failed to load: ${href}`,
              fixHint: `Ensure the file exists in public/ or dist/ and route is mapped in server.ts and server.go.`
            });
          } else if (tagName === "SCRIPT") {
            const src = target.getAttribute("src") || target.src || "unknown script";
            this.record({
              code: "SCRIPT_LOAD_FAILURE",
              category: "CSS_ASSET",
              severity: "ERROR",
              culprit: src,
              target: "<script>",
              message: `JavaScript script failed to load: ${src}`,
              fixHint: `Check that script is built via bun run build:engines or route is declared.`
            });
          } else if (tagName === "IMG") {
            const src = target.getAttribute("src") || target.src || "unknown image";
            this.record({
              code: "IMAGE_LOAD_FAILURE",
              category: "CSS_ASSET",
              severity: "WARNING",
              culprit: src,
              target: "<img>",
              message: `Image failed to load: ${src}`,
              fixHint: `Check image path in public/ or assets directory.`
            });
          }
        } else if (event.message) {
          this.record({
            code: "JS_RUNTIME_ERROR",
            category: "RUNTIME_JS",
            severity: "CRITICAL",
            culprit: event.filename || window.location.pathname,
            message: event.message,
            stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
            fixHint: `Investigate unhandled exception at ${event.filename || "unknown"}:${event.lineno || "0"}.`
          });
        }
      }, true);
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason || "Unhandled promise rejection");
        this.record({
          code: "PROMISE_REJECTION",
          category: "RUNTIME_JS",
          severity: "ERROR",
          culprit: window.location.pathname,
          message,
          stack: reason instanceof Error ? reason.stack : undefined,
          fixHint: `Ensure async operations have proper catch() or try/catch blocks.`
        });
      });
      if (typeof document !== "undefined") {
        document.addEventListener("htmx:responseError", (event) => {
          const xhr = event.detail?.xhr;
          const status = xhr ? xhr.status : 0;
          const path = event.detail?.requestConfig?.path || xhr?.responseURL || "unknown endpoint";
          const target = event.detail?.target ? event.detail.target.id ? `#${event.detail.target.id}` : event.detail.target.tagName.toLowerCase() : "document";
          this.record({
            code: status === 404 ? "HTMX_404_NOT_FOUND" : status >= 500 ? "HTMX_500_SERVER_ERROR" : `HTMX_HTTP_${status}`,
            category: "HTMX_SWAP",
            severity: status >= 500 ? "CRITICAL" : "ERROR",
            status,
            culprit: path,
            target,
            message: `HTMX request failed with HTTP ${status} when requesting ${path}`,
            fixHint: status === 404 ? `Add endpoint route handler in server.ts and server.go for ${path}` : `Inspect server logs for 500 crash on ${path}`
          });
        });
        document.addEventListener("htmx:targetError", (event) => {
          this.record({
            code: "HTMX_TARGET_MISSING",
            category: "HTMX_SWAP",
            severity: "ERROR",
            culprit: event.detail?.target || "unknown target",
            message: `HTMX target element not found in DOM for swap: ${event.detail?.target || ""}`,
            fixHint: `Verify hx-target selector exists in the page before triggering request.`
          });
        });
        document.addEventListener("htmx:swapError", (event) => {
          this.record({
            code: "HTMX_SWAP_ERROR",
            category: "HTMX_SWAP",
            severity: "ERROR",
            culprit: event.detail?.requestConfig?.path || "swap operation",
            message: `HTMX failed to swap HTML content into target element`,
            fixHint: `Verify server response contains valid HTML snippet matching swap strategy.`
          });
        });
        document.addEventListener("htmx:sendError", (event) => {
          this.record({
            code: "HTMX_NETWORK_ERROR",
            category: "HTMX_SWAP",
            severity: "ERROR",
            culprit: event.detail?.requestConfig?.path || "network",
            message: `Network failure: HTMX could not reach endpoint`,
            fixHint: `Verify network connectivity or CORS headers on backend.`
          });
        });
      }
      window.addEventListener("htmx:diag", (event) => {
        const d = event.detail;
        if (d) {
          this.record({
            code: d.code || "HYPERSTACK_INTERNAL",
            category: String(d.code).includes("AUTH") ? "SECURITY_RBAC" : "INTERNAL",
            severity: "WARNING",
            culprit: d.target || window.location.pathname,
            message: `${d.title}: ${d.detail}`,
            fixHint: d.fix || "Consult /schema/hyperstack.json"
          });
        }
      });
    }
    record(input) {
      const timeMs = Date.now();
      const event = {
        id: input.id || `diag-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: input.timestamp || new Date(timeMs).toLocaleTimeString(),
        timeMs,
        code: input.code || "UNSPECIFIED_DIAG_EVENT",
        category: input.category || "INTERNAL",
        severity: input.severity || "ERROR",
        url: input.url || (typeof window !== "undefined" ? window.location.pathname : "/"),
        culprit: input.culprit || "unknown",
        target: input.target,
        message: input.message || "Diagnostic event recorded",
        status: input.status,
        fixHint: input.fixHint || "Check diagnostic guidelines in docs/DIAGNOSTICS.md",
        stack: input.stack
      };
      const isDuplicate = this.events.length > 0 && this.events[0].code === event.code && this.events[0].culprit === event.culprit && timeMs - this.events[0].timeMs < 1000;
      if (!isDuplicate) {
        this.events.unshift(event);
        if (this.events.length > this.maxEvents) {
          this.events.pop();
        }
        this.beaconToServer(event);
        this.notifySubscribers(event);
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          try {
            window.dispatchEvent(new CustomEvent("htmx:diag-live", { detail: event }));
          } catch {}
        }
      }
      return event;
    }
    beaconToServer(event) {
      if (typeof window === "undefined" || typeof fetch === "undefined")
        return;
      try {
        fetch("/api/diag/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event)
        }).catch(() => {});
      } catch {}
    }
    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter((l) => l !== fn);
      };
    }
    notifySubscribers(event) {
      const all = this.getLogs();
      this.listeners.forEach((fn) => {
        try {
          fn(event, all);
        } catch {}
      });
    }
    getLogs() {
      return [...this.events];
    }
    getStats() {
      const total = this.events.length;
      let errors = 0;
      let warnings = 0;
      let routes404 = 0;
      let cssAssets = 0;
      let htmxSwaps = 0;
      this.events.forEach((e) => {
        if (e.severity === "CRITICAL" || e.severity === "ERROR")
          errors++;
        if (e.severity === "WARNING")
          warnings++;
        if (e.category === "404_ROUTE" || e.code.includes("404"))
          routes404++;
        if (e.category === "CSS_ASSET")
          cssAssets++;
        if (e.category === "HTMX_SWAP")
          htmxSwaps++;
      });
      const health = total === 0 ? "100%" : Math.max(0, Math.round(100 - errors * 5)).toString() + "%";
      return { total, errors, warnings, routes404, cssAssets, htmxSwaps, health };
    }
    clear() {
      this.events = [];
      this.notifySubscribers({});
    }
    simulate(type) {
      switch (type) {
        case "404":
          return this.record({
            code: "CLIENT_404_NOT_FOUND",
            category: "404_ROUTE",
            severity: "ERROR",
            url: "/broken/sample-route-404",
            culprit: "/broken/sample-route-404",
            message: "Navigation attempted to missing route /broken/sample-route-404",
            fixHint: "Create route handler in server.ts and server.go for /broken/sample-route-404."
          });
        case "css":
          return this.record({
            code: "CSS_LOAD_FAILURE",
            category: "CSS_ASSET",
            severity: "ERROR",
            url: typeof window !== "undefined" ? window.location.pathname : "/demo/tailadmin",
            culprit: "/css/missing-theme.css",
            target: '<link rel="stylesheet">',
            message: "Failed to load stylesheet /css/missing-theme.css",
            fixHint: "Verify that /css/missing-theme.css exists in public/ and is served."
          });
        case "swap":
          return this.record({
            code: "HTMX_404_NOT_FOUND",
            category: "HTMX_SWAP",
            severity: "ERROR",
            status: 404,
            url: typeof window !== "undefined" ? window.location.pathname : "/demo/tailadmin",
            culprit: "/api/v1/patient/999/vitals",
            target: "#patient-vitals-card",
            message: "HTMX request failed with HTTP 404 for /api/v1/patient/999/vitals",
            fixHint: "Implement mock or live endpoint for /api/v1/patient/999/vitals."
          });
        case "js":
          return this.record({
            code: "JS_RUNTIME_ERROR",
            category: "RUNTIME_JS",
            severity: "CRITICAL",
            url: typeof window !== "undefined" ? window.location.pathname : "/demo/tailadmin",
            culprit: "dashboard-chart.js",
            message: 'TypeError: Cannot read properties of undefined (reading "renderChart")',
            stack: `TypeError: Cannot read properties of undefined
    at renderDashboard (dashboard-chart.js:42:15)`,
            fixHint: "Add null-check before invoking renderChart() on undefined canvas context."
          });
      }
    }
    generateAIPrompt() {
      if (this.events.length === 0) {
        return "### @diag System Report: All systems healthy. 0 errors detected.";
      }
      const lines = [
        "### \uD83E\uDD16 @diag Self-Healing AI Repair Task",
        "The following errors were captured live by the Hyperstack Diagnostics Service:",
        ""
      ];
      this.events.forEach((e, idx) => {
        lines.push(`${idx + 1}. **[@diag ${e.code}]** (${e.severity})`);
        lines.push(`   - Category: \`${e.category}\``);
        lines.push(`   - Origin URL: \`${e.url}\``);
        lines.push(`   - Culprit: \`${e.culprit}\``);
        if (e.target)
          lines.push(`   - Target: \`${e.target}\``);
        lines.push(`   - Description: ${e.message}`);
        lines.push(`   - Suggested AI Fix: ${e.fixHint}`);
        lines.push("");
      });
      lines.push("Please inspect each culprit, update or register the missing routes/styles, and confirm all tests pass.");
      return lines.join(`
`);
    }
    generateSARIF() {
      const sarif = {
        $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        version: "2.1.0",
        runs: [{
          tool: {
            driver: {
              name: "Hyperstack Diagnostics Service ($diag)",
              version: "1.0.0",
              rules: this.events.map((e) => ({
                id: e.code,
                shortDescription: { text: e.message },
                help: { text: e.fixHint }
              }))
            }
          },
          results: this.events.map((e) => ({
            ruleId: e.code,
            level: e.severity === "CRITICAL" || e.severity === "ERROR" ? "error" : e.severity === "WARNING" ? "warning" : "note",
            message: { text: e.message },
            locations: [{
              physicalLocation: {
                artifactLocation: { uri: e.url }
              }
            }]
          }))
        }]
      };
      return JSON.stringify(sarif, null, 2);
    }
  }
  var $diag = new DiagnosticService;

  class DevToolsPanel {
    panelEl = null;
    isVisible = false;
    activeTab = "diag";
    constructor() {
      if (typeof window === "undefined")
        return;
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
          this.toggle();
        }
      });
      $diag.subscribe(() => {
        if (this.isVisible)
          this.refresh();
      });
    }
    toggle() {
      if (!this.panelEl) {
        this.createDOM();
      }
      this.isVisible = !this.isVisible;
      if (this.panelEl) {
        this.panelEl.style.display = this.isVisible ? "flex" : "none";
        if (this.isVisible)
          this.refresh();
      }
    }
    setTab(tab) {
      this.activeTab = tab;
      this.refresh();
    }
    createDOM() {
      this.panelEl = document.createElement("div");
      this.panelEl.id = "hyperstack-devtools-panel";
      this.panelEl.className = "fixed bottom-4 right-4 w-[420px] max-h-[540px] bg-slate-950 text-slate-100 border border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col font-mono text-xs overflow-hidden backdrop-blur-md";
      this.panelEl.style.display = "none";
      this.panelEl.innerHTML = `
      <div class="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-slate-100">Hyperstack $diag &amp; DevTools</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="hx-dev-btn-undo px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px]">Undo</button>
          <button class="hx-dev-btn-redo px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px]">Redo</button>
          <button class="hx-dev-btn-close px-2 py-0.5 text-slate-400 hover:text-slate-200">✕</button>
        </div>
      </div>
      <!-- TABS -->
      <div class="flex border-b border-slate-800 bg-slate-900/60 text-[11px]">
        <button class="hx-tab-diag flex-1 py-1.5 text-center font-bold text-amber-400 border-b-2 border-amber-500 transition-colors">
          ⚡ @diag (<span class="hx-diag-count">0</span>)
        </button>
        <button class="hx-tab-stores flex-1 py-1.5 text-center font-semibold text-slate-400 hover:text-slate-200 transition-colors">
          Stores &amp; Signals
        </button>
        <button class="hx-tab-offline flex-1 py-1.5 text-center font-semibold text-slate-400 hover:text-slate-200 transition-colors">
          Offline
        </button>
      </div>
      <div class="p-3 overflow-y-auto flex-1 space-y-3">
        <!-- DIAG TAB CONTENT -->
        <div class="hx-section-diag space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Live Error &amp; 404 Telemetry</span>
            <div class="flex gap-1.5">
              <button class="hx-btn-sim-404 px-1.5 py-0.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded text-[9px] border border-rose-500/30">Sim 404</button>
              <button class="hx-btn-sim-css px-1.5 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded text-[9px] border border-amber-500/30">Sim CSS</button>
              <button class="hx-btn-clear-diag px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px]">Clear</button>
            </div>
          </div>
          <div class="hx-diag-logs-container space-y-1.5 max-h-72 overflow-y-auto">
            <div class="p-3 text-center text-slate-500 text-[11px] italic">No active errors detected. All systems healthy.</div>
          </div>
        </div>
        <!-- STORES TAB CONTENT -->
        <div class="hx-section-stores space-y-2 hidden">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Active Signal Stores &amp; State</div>
          <pre class="hx-dev-stores p-2 bg-slate-900 rounded border border-slate-800/80 text-[11px] text-emerald-400 overflow-x-auto max-h-72">{}</pre>
        </div>
        <!-- OFFLINE TAB CONTENT -->
        <div class="hx-section-offline space-y-2 hidden">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Offline Status &amp; Queue</div>
          <div class="p-2 bg-slate-900 rounded border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div>Network: <span class="hx-dev-net-status text-emerald-400">Online</span></div>
            <div>IndexedDB Pending Mutations: <span class="hx-dev-queue-count font-bold">0</span></div>
          </div>
        </div>
      </div>
    `;
      document.body.appendChild(this.panelEl);
      this.panelEl.querySelector(".hx-dev-btn-close")?.addEventListener("click", () => this.toggle());
      this.panelEl.querySelector(".hx-tab-diag")?.addEventListener("click", () => this.setTab("diag"));
      this.panelEl.querySelector(".hx-tab-stores")?.addEventListener("click", () => this.setTab("stores"));
      this.panelEl.querySelector(".hx-tab-offline")?.addEventListener("click", () => this.setTab("offline"));
      this.panelEl.querySelector(".hx-btn-sim-404")?.addEventListener("click", () => {
        $diag.simulate("404");
        this.refresh();
      });
      this.panelEl.querySelector(".hx-btn-sim-css")?.addEventListener("click", () => {
        $diag.simulate("css");
        this.refresh();
      });
      this.panelEl.querySelector(".hx-btn-clear-diag")?.addEventListener("click", () => {
        $diag.clear();
        this.refresh();
      });
      this.panelEl.querySelector(".hx-dev-btn-undo")?.addEventListener("click", () => {
        if (window.HxBolt && window.HxBolt.undo)
          window.HxBolt.undo();
        this.refresh();
      });
      this.panelEl.querySelector(".hx-dev-btn-redo")?.addEventListener("click", () => {
        if (window.HxBolt && window.HxBolt.redo)
          window.HxBolt.redo();
        this.refresh();
      });
    }
    refresh() {
      if (!this.panelEl)
        return;
      const tabDiag = this.panelEl.querySelector(".hx-tab-diag");
      const tabStores = this.panelEl.querySelector(".hx-tab-stores");
      const tabOffline = this.panelEl.querySelector(".hx-tab-offline");
      const secDiag = this.panelEl.querySelector(".hx-section-diag");
      const secStores = this.panelEl.querySelector(".hx-section-stores");
      const secOffline = this.panelEl.querySelector(".hx-section-offline");
      if (tabDiag && tabStores && tabOffline && secDiag && secStores && secOffline) {
        tabDiag.className = this.activeTab === "diag" ? "hx-tab-diag flex-1 py-1.5 text-center font-bold text-amber-400 border-b-2 border-amber-500 transition-colors" : "hx-tab-diag flex-1 py-1.5 text-center font-semibold text-slate-400 hover:text-slate-200 transition-colors";
        tabStores.className = this.activeTab === "stores" ? "hx-tab-stores flex-1 py-1.5 text-center font-bold text-emerald-400 border-b-2 border-emerald-500 transition-colors" : "hx-tab-stores flex-1 py-1.5 text-center font-semibold text-slate-400 hover:text-slate-200 transition-colors";
        tabOffline.className = this.activeTab === "offline" ? "hx-tab-offline flex-1 py-1.5 text-center font-bold text-cyan-400 border-b-2 border-cyan-500 transition-colors" : "hx-tab-offline flex-1 py-1.5 text-center font-semibold text-slate-400 hover:text-slate-200 transition-colors";
        secDiag.classList.toggle("hidden", this.activeTab !== "diag");
        secStores.classList.toggle("hidden", this.activeTab !== "stores");
        secOffline.classList.toggle("hidden", this.activeTab !== "offline");
      }
      const logs = $diag.getLogs();
      const countEl = this.panelEl.querySelector(".hx-diag-count");
      if (countEl)
        countEl.textContent = String(logs.length);
      const logsContainer = this.panelEl.querySelector(".hx-diag-logs-container");
      if (logsContainer) {
        if (logs.length === 0) {
          logsContainer.innerHTML = '<div class="p-3 text-center text-slate-500 text-[11px] italic">No active errors detected. All systems healthy.</div>';
        } else {
          logsContainer.innerHTML = logs.map((e) => `
          <div class="p-2 rounded bg-slate-900 border ${e.severity === "CRITICAL" ? "border-rose-500/50 bg-rose-950/20" : e.severity === "ERROR" ? "border-amber-500/40 bg-amber-950/20" : "border-slate-800"} text-[10px]">
            <div class="flex items-center justify-between text-slate-400 mb-1">
              <span class="font-bold ${e.severity === "CRITICAL" ? "text-rose-400" : "text-amber-400"}">[@diag ${e.code}]</span>
              <span>${e.timestamp}</span>
            </div>
            <div class="text-slate-200 font-medium truncate">${e.message}</div>
            <div class="text-slate-500 truncate mt-0.5">Culprit: <span class="text-slate-400">${e.culprit}</span></div>
          </div>
        `).join("");
        }
      }
      const storesEl = this.panelEl.querySelector(".hx-dev-stores");
      if (storesEl && typeof window !== "undefined") {
        const activeData = {};
        if (window.HxBolt && window.HxBolt.getStore) {
          const commonStores = ["auth", "cart", "app", "user", "theme", "filters", "settings"];
          commonStores.forEach((name) => {
            const s = window.HxBolt.getStore(name);
            if (s) {
              activeData[`$store.${name}`] = s.__raw || s;
            }
          });
        }
        document.querySelectorAll("[hx-state]").forEach((el, idx) => {
          if (window.HxBolt && window.HxBolt.getState) {
            const st = window.HxBolt.getState(el);
            if (st) {
              const raw = st.__raw || st;
              const sanitized = {};
              for (const [k, v] of Object.entries(raw)) {
                if (k !== "__refs" && typeof v !== "function") {
                  sanitized[k] = v;
                }
              }
              activeData[`Component[${el.id || idx}]`] = sanitized;
            }
          }
        });
        storesEl.textContent = JSON.stringify(activeData, null, 2);
      }
      const netEl = this.panelEl.querySelector(".hx-dev-net-status");
      const queueEl = this.panelEl.querySelector(".hx-dev-queue-count");
      if (netEl) {
        netEl.textContent = navigator.onLine ? "Online \uD83D\uDFE2" : "Offline \uD83D\uDCF4";
        netEl.className = navigator.onLine ? "hx-dev-net-status text-emerald-400 font-semibold" : "hx-dev-net-status text-amber-400 font-semibold";
      }
      if (queueEl && window.HxOffline) {
        queueEl.textContent = String(window.HxOffline.queueCount);
      }
    }
  }
  var HxDevTools = new DevToolsPanel;
  if (typeof window !== "undefined") {
    window.$diag = $diag;
    window.HxDiag = $diag;
    window.HxDevTools = HxDevTools;
    if (typeof window.Hyperstack !== "undefined") {
      window.Hyperstack.diag = $diag;
      window.Hyperstack.devtools = HxDevTools;
    }
  }
})();
