package components

import (
	"encoding/json"
	"fmt"
	"strings"
)

// =============================================================================
// METAGRID COMPONENT (SECOND HYPERSTACK META COMPONENT)
// Upgrades <hx-grid> into a declarative, .fx-configured multi-pane component:
//   - "metagrid"     (standard): Left Table Browser + Formula Bar + Sheet
//   - "metagrid-ext" (extended): Parent Totals Grid -> Child Breakups (left)
//                                & Detailed Breakups (right)
// Gracefully degrades to a simple static table when keyboard/editable/formulaBar
// are disabled in the .fx configuration.
// =============================================================================

// MetaGridPage represents an entry in the integrated left table browser.
type MetaGridPage struct {
	ID   string `json:"id"`
	Label string `json:"label"`
	Code string `json:"code,omitempty"`
	Src  string `json:"src,omitempty"`
}

// MetaGridFeatures toggles interactive subsystems via metagrid.fx.
type MetaGridFeatures struct {
	Keyboard      bool `json:"keyboard"`
	Editable      bool `json:"editable"`
	FormulaBar    bool `json:"formulaBar"`
	StatusBar     bool `json:"statusBar"`
	Search        bool `json:"search"`
	ProvisionForm bool `json:"provisionForm"`
}

// MetaGridPane configures scrollbars, pagination, and columns per pane.
type MetaGridPane struct {
	ID         string       `json:"id,omitempty"`
	Title      string       `json:"title,omitempty"`
	Src        string       `json:"src,omitempty"`
	Scrollbars string       `json:"scrollbars,omitempty"` // "auto" | "both" | "x" | "y" | "none"
	Pagination string       `json:"pagination,omitempty"` // "numbers" | "vscroll" | "hscroll" | "none"
	PageSize   int          `json:"pageSize,omitempty"`
	Columns    []GridColumn `json:"columns,omitempty"`
}

// MetaGridProps configures <meta-grid> for 1:1 Go DSL parity.
type MetaGridProps struct {
	ID         string
	Mode       string // "metagrid" (default) | "metagrid-ext"
	Title      string
	ActivePage string
	FxURL      string
	Features   *MetaGridFeatures
	Pages      []MetaGridPage
	Pane1      MetaGridPane
	Pane2      MetaGridPane
	Pane3      MetaGridPane
}

// MetaGrid renders the <meta-grid> custom element with embedded .fx config.
func MetaGrid(p MetaGridProps) Component {
	id := p.ID
	if id == "" {
		id = "metagrid-1"
	}
	mode := p.Mode
	if mode == "" {
		mode = "metagrid"
	}
	features := MetaGridFeatures{
		Keyboard:   true,
		Editable:   true,
		FormulaBar: true,
		StatusBar:  true,
	}
	if p.Features != nil {
		features = *p.Features
	}

	fxPayload := map[string]any{
		"id":       id,
		"mode":     mode,
		"features": features,
		"pane1":    p.Pane1,
		"pane2":    p.Pane2,
		"pane3":    p.Pane3,
	}
	fxBytes, _ := json.Marshal(fxPayload)

	var b strings.Builder
	b.WriteString(fmt.Sprintf(`<meta-grid id="%s" mode="%s"`, id, mode))
	if p.FxURL != "" {
		b.WriteString(fmt.Sprintf(` hx-fx="%s"`, p.FxURL))
	}
	b.WriteString(` class="flex flex-col border border-slate-300 bg-white rounded-xl overflow-hidden shadow-xs">`)
	b.WriteString(fmt.Sprintf(`<script type="application/json" data-fx>%s</script>`, string(fxBytes)))

	if p.Title != "" {
		b.WriteString(fmt.Sprintf(`<div class="bg-slate-800 text-white px-3 py-1.5 text-xs font-bold flex justify-between items-center"><span>%s</span><span class="font-mono text-[10px] text-indigo-300">%s</span></div>`, p.Title, mode))
	}

	if features.FormulaBar {
		b.WriteString(`<div class="bg-slate-100 border-b border-slate-300 px-2 py-1 flex items-center gap-2"><span data-meta-address class="w-12 text-center font-mono text-[11px] font-bold bg-white border border-slate-300 py-0.5">A1</span><span class="font-serif italic font-bold text-slate-500 text-xs">fx</span><input data-meta-formula type="text" class="flex-1 bg-white border border-slate-300 px-2 py-0.5 text-xs font-mono outline-none" placeholder="Cell value..." /></div>`)
	}

	b.WriteString(`<div class="flex flex-1 min-h-0 divide-x divide-slate-300">`)
	if len(p.Pages) > 0 && mode == "metagrid" {
		b.WriteString(`<div data-meta-browser data-meta-scroll="auto" class="w-48 shrink-0 bg-white divide-y divide-slate-200 overflow-auto">`)
		for _, pg := range p.Pages {
			b.WriteString(fmt.Sprintf(`<div data-meta-page="%s" hx-get="%s" class="px-2.5 py-1.5 text-xs flex justify-between items-center cursor-pointer hover:bg-slate-50"><span>%s</span><span class="font-mono text-[10px] text-slate-400">%s</span></div>`, pg.ID, pg.Src, pg.Label, pg.Code))
		}
		b.WriteString(`</div>`)
	}

	scroll1 := p.Pane1.Scrollbars
	if scroll1 == "" {
		scroll1 = "auto"
	}
	b.WriteString(fmt.Sprintf(`<div data-meta-pane="1" data-meta-scroll="%s" class="flex-1 min-w-0 overflow-auto"></div>`, scroll1))

	if mode == "metagrid-ext" {
		scroll2 := p.Pane2.Scrollbars
		if scroll2 == "" {
			scroll2 = "auto"
		}
		b.WriteString(fmt.Sprintf(`<div data-meta-pane="2" data-meta-scroll="%s" class="flex-1 min-w-0 overflow-auto"></div>`, scroll2))
	}
	b.WriteString(`</div>`)

	if features.StatusBar {
		b.WriteString(`<div class="bg-slate-50 border-t border-slate-300 px-3 py-1 flex justify-between items-center text-[10px] font-mono text-slate-600"><span>READY</span><span data-meta-page-info></span></div>`)
	}

	b.WriteString(`</meta-grid>`)
	return Component{html: b.String()}
}
