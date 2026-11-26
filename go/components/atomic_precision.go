package components

import (
	"fmt"
	"strings"
)

// AtomicBlockProps configures a spatial canvas block with deterministic blockid and layer.
type AtomicBlockProps struct {
	BlockID string
	Layer   int
	Title   string
	Price   float64
	DiagMs  float64
}

// AtomicBlock renders an atomically addressed canvas block matching views/components/atomic-precision.html.
func AtomicBlock(p AtomicBlockProps) Component {
	html := fmt.Sprintf(`<div blockid="%s" layer="%d" class="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
  <div class="flex items-center justify-between text-xs font-bold text-slate-800">
    <span>%s</span>
    <span class="text-[10px] font-mono text-indigo-600">Z: %d</span>
  </div>
  <div class="text-[11px] text-slate-500 font-mono">blockid="%s"</div>
  <div class="text-[10px] text-emerald-600 font-semibold">$diag: %.1fms atomic swap</div>
</div>`, p.BlockID, p.Layer, p.Title, p.Layer, p.BlockID, p.DiagMs)
	return Component{html: html}
}

// AtomicERPRowProps configures an ERP table row with rowid, cellid coordinates, and MetaText demographic cell.
type AtomicERPRowProps struct {
	RowID    string
	Category string
	Customer string
	Account  string
	Amount   float64
	Status   string
}

// AtomicERPRow renders an O(1) addressed table row using official MetaText for high-density ERP ledgers.
func AtomicERPRow(p AtomicERPRowProps) Component {
	cat := p.Category
	if cat == "" {
		cat = "LOGISTICS"
	}
	metaCell := MetaText(MetaTextProps{
		Top: []MetaCell{
			{Value: "[" + cat + "]"},
			{Value: "ACTIVE"},
		},
		HeroValue: p.Customer,
		Bottom: []MetaCell{
			{Label: "ACCOUNT", Value: p.Account},
		},
	})
	html := fmt.Sprintf(`<tr rowid="%s" class="hover:bg-slate-50 transition-colors h-[46px]">
  <td class="py-1 px-3 font-bold text-blue-600">#%s</td>
  <td class="py-1 px-3 min-w-[220px]">%s</td>
  <td cellid="%s:amount" class="py-1 px-3 font-bold text-slate-900">$%.2f</td>
  <td class="py-1 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">%s</span></td>
</tr>`, p.RowID, p.RowID, metaCell.Render(), p.RowID, p.Amount, p.Status)
	return Component{html: html}
}

// AtomicPrecisionDoc renders the root container for the atomic precision documentation page.
func AtomicPrecisionDoc(blocks []AtomicBlockProps, rows []AtomicERPRowProps) Component {
	var sb strings.Builder
	sb.WriteString(`<div class="space-y-8 max-w-5xl py-6">`)
	sb.WriteString(`<h1 class="text-3xl font-extrabold text-slate-900">Atomic Precision & Universal Addressing</h1>`)
	
	sb.WriteString(`<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">`)
	for _, b := range blocks {
		sb.WriteString(AtomicBlock(b).Render())
	}
	sb.WriteString(`</div>`)

	sb.WriteString(`<table class="w-full text-left text-xs font-mono"><tbody>`)
	for _, r := range rows {
		sb.WriteString(AtomicERPRow(r).Render())
	}
	sb.WriteString(`</tbody></table>`)

	sb.WriteString(`</div>`)
	return Component{html: sb.String()}
}
