package components

import (
	"fmt"
	"io"
	"strings"
)

// =============================================================================
// METATEXT COMPONENT (FIRST HYPERSTACK META COMPONENT)
// High-density compound field featuring a dominant hero text/input flanked by
// up to 2 metadata cells above and 2 metadata cells below.
// Strict Guardrails:
//   1. Max 2 cells Top, Max 2 cells Bottom (2x2 cap).
//   2. Meta font size is strictly 50% smaller than Hero text.
//   3. Empty values gracefully fall back to clean em-dash ("—").
// =============================================================================

// MetaCell represents an individual metadata slot (Label + Value).
type MetaCell struct {
	Label string
	Value string
}

// MetaTextProps configures the MetaText component.
type MetaTextProps struct {
	// Up to 2 cells on Top (enforced by 2x2 rule)
	Top      []MetaCell
	TopRatio string // e.g. "50/50", "30/70", "40/60"

	// Hero Main Text or Editable Input
	HeroPrefix   string // e.g. "Pt - "
	HeroValue    string // e.g. "David Jeba"
	HeroEditable bool   // if true, renders live <input>
	InputName    string // name attribute for input (e.g. "pt_name")
	Placeholder  string // placeholder if hero is empty

	// Up to 2 cells on Bottom (enforced by 2x2 rule)
	Bottom      []MetaCell
	BottomRatio string // e.g. "50/50", "40/60"

	// Styling & Sizing
	Size     string // "sm", "md" (default), "lg"
	Theme    string // "slate" (default), "dark", "light", "amber", "rose"
	Class    string // additional custom classes
	MinWidth string // min width e.g. "min-w-[280px]"

	// HTMX declarative attributes
	HxPost    string
	HxGet     string
	HxTrigger string
	HxTarget  string
	HxSwap    string

	// Raw Spec shorthand (optional)
	Spec string
}

// ParseMetaTextSpec parses the shorthand string:
// "UHID: 1221 | [Pt - David Jeba] | AGE: 45, SEX: Male"
func ParseMetaTextSpec(spec string) MetaTextProps {
	p := MetaTextProps{
		Size:     "md",
		TopRatio: "50/50",
	}

	tiers := strings.Split(spec, "|")
	for i := range tiers {
		tiers[i] = strings.TrimSpace(tiers[i])
	}

	if len(tiers) == 1 {
		// Single tier - treated as Hero
		rawHero := tiers[0]
		parseHeroSlot(&p, rawHero)
		return p
	}

	if len(tiers) == 2 {
		// 2 tiers: Hero + Bottom OR Top + Hero
		if strings.HasPrefix(tiers[0], "[") {
			parseHeroSlot(&p, tiers[0])
			p.Bottom = parseMetaRow(tiers[1])
		} else {
			p.Top = parseMetaRow(tiers[0])
			parseHeroSlot(&p, tiers[1])
		}
		return p
	}

	// 3 tiers: Top | Hero | Bottom
	p.Top = parseMetaRow(tiers[0])
	parseHeroSlot(&p, tiers[1])
	p.Bottom = parseMetaRow(tiers[2])

	return p
}

func parseMetaRow(raw string) []MetaCell {
	var cells []MetaCell
	// Check for optional ratio syntax: e.g. "(30/70)"
	cleanRaw := raw
	if idx := strings.Index(cleanRaw, "("); idx != -1 {
		endIdx := strings.Index(cleanRaw, ")")
		if endIdx > idx {
			cleanRaw = strings.TrimSpace(cleanRaw[:idx] + cleanRaw[endIdx+1:])
		}
	}

	parts := strings.Split(cleanRaw, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		// Split on colon or hyphen
		if strings.Contains(part, ":") {
			kv := strings.SplitN(part, ":", 2)
			cells = append(cells, MetaCell{
				Label: strings.TrimSpace(kv[0]),
				Value: strings.TrimSpace(kv[1]),
			})
		} else if strings.Contains(part, " - ") {
			kv := strings.SplitN(part, " - ", 2)
			cells = append(cells, MetaCell{
				Label: strings.TrimSpace(kv[0]),
				Value: strings.TrimSpace(kv[1]),
			})
		} else {
			cells = append(cells, MetaCell{
				Label: part,
				Value: "",
			})
		}
		// Strict guardrail: max 2 cells per row
		if len(cells) == 2 {
			break
		}
	}
	return cells
}

func parseHeroSlot(p *MetaTextProps, raw string) {
	clean := strings.Trim(raw, "[]")
	clean = strings.TrimSpace(clean)

	// Check if editable input: e.g. "@pt_name: David Jeba" or "input:pt_name = David Jeba"
	if strings.HasPrefix(clean, "@") {
		clean = clean[1:]
		if kv := strings.SplitN(clean, ":", 2); len(kv) == 2 {
			p.HeroEditable = true
			p.InputName = strings.TrimSpace(kv[0])
			p.HeroValue = strings.TrimSpace(kv[1])
			return
		}
	}

	// Check for common prefix e.g. "Pt - "
	if strings.HasPrefix(clean, "Pt - ") {
		p.HeroPrefix = "Pt - "
		p.HeroValue = clean[5:]
	} else if strings.HasPrefix(clean, "Pt: ") {
		p.HeroPrefix = "Pt: "
		p.HeroValue = clean[4:]
	} else {
		p.HeroValue = clean
	}
}

// MetaText constructs the component from props.
func MetaText(p MetaTextProps) Component {
	// Parse spec if provided as shorthand
	if p.Spec != "" && len(p.Top) == 0 && p.HeroValue == "" && len(p.Bottom) == 0 {
		parsed := ParseMetaTextSpec(p.Spec)
		// Inherit HTMX and style attributes
		parsed.HxPost = p.HxPost
		parsed.HxGet = p.HxGet
		parsed.HxTrigger = p.HxTrigger
		parsed.HxTarget = p.HxTarget
		parsed.HxSwap = p.HxSwap
		parsed.Class = p.Class
		if p.Theme != "" {
			parsed.Theme = p.Theme
		}
		if p.Size != "" {
			parsed.Size = p.Size
		}
		p = parsed
	}

	// Rule 1: Strictly cap at 2 cells Top, 2 cells Bottom
	if len(p.Top) > 2 {
		p.Top = p.Top[:2]
	}
	if len(p.Bottom) > 2 {
		p.Bottom = p.Bottom[:2]
	}

	// Sizing configuration
	heroTextClass := "text-2xl font-black"
	metaTextClass := "text-xs font-medium" // Strictly 50% smaller
	paddingHero := "px-3.5 py-2"
	paddingMeta := "px-3 py-1"
	minWidth := "min-w-[280px]"

	switch p.Size {
	case "sm":
		heroTextClass = "text-lg font-extrabold"
		metaTextClass = "text-[10px] font-medium"
		paddingHero = "px-2.5 py-1.5"
		paddingMeta = "px-2.5 py-0.5"
		minWidth = "min-w-[220px]"
	case "lg":
		heroTextClass = "text-3xl font-black"
		metaTextClass = "text-sm font-semibold"
		paddingHero = "px-4 py-2.5"
		paddingMeta = "px-3.5 py-1.5"
		minWidth = "min-w-[340px]"
	}

	if p.MinWidth != "" {
		minWidth = p.MinWidth
	}

	// Theming
	borderClass := "border-slate-300 dark:border-slate-800"
	bgCardClass := "bg-white dark:bg-slate-900"
	bgCellClass := "bg-slate-50/80 dark:bg-slate-950/60"
	textHeroClass := "text-slate-900 dark:text-slate-100"
	textMetaClass := "text-slate-600 dark:text-slate-400"
	textMetaValClass := "text-slate-900 dark:text-slate-200 font-semibold"

	var sb strings.Builder

	// Wrapper
	sb.WriteString(`<div class="inline-flex flex-col `)
	sb.WriteString(bgCardClass)
	sb.WriteString(` border `)
	sb.WriteString(borderClass)
	sb.WriteString(` rounded-lg shadow-sm font-sans select-none overflow-hidden `)
	sb.WriteString(minWidth)
	if p.Class != "" {
		sb.WriteString(` `)
		sb.WriteString(p.Class)
	}
	sb.WriteString(`"`)

	// HTMX declarative attributes
	if p.HxPost != "" {
		sb.WriteString(fmt.Sprintf(` hx-post="%s"`, p.HxPost))
	}
	if p.HxGet != "" {
		sb.WriteString(fmt.Sprintf(` hx-get="%s"`, p.HxGet))
	}
	if p.HxTrigger != "" {
		sb.WriteString(fmt.Sprintf(` hx-trigger="%s"`, p.HxTrigger))
	}
	if p.HxTarget != "" {
		sb.WriteString(fmt.Sprintf(` hx-target="%s"`, p.HxTarget))
	}
	if p.HxSwap != "" {
		sb.WriteString(fmt.Sprintf(` hx-swap="%s"`, p.HxSwap))
	}
	sb.WriteString(`>`)

	// 1. TOP TIER (Max 2 cells)
	if len(p.Top) > 0 {
		gridCols := "grid-cols-2"
		if len(p.Top) == 1 {
			gridCols = "grid-cols-1"
		} else if p.TopRatio == "30/70" {
			gridCols = "grid-cols-[3fr_7fr]"
		} else if p.TopRatio == "40/60" {
			gridCols = "grid-cols-[4fr_6fr]"
		}

		sb.WriteString(fmt.Sprintf(`<div class="grid %s divide-x %s border-b %s %s tracking-tight">`,
			gridCols, borderClass, borderClass, metaTextClass))

		for _, cell := range p.Top {
			label := cell.Label
			if label == "" {
				label = "—"
			}
			val := cell.Value
			if val == "" && len(p.Top) == 1 {
				// Single cell with just label
				sb.WriteString(fmt.Sprintf(`<div class="%s %s %s truncate">%s</div>`,
					paddingMeta, bgCellClass, textMetaClass, label))
			} else {
				if val == "" {
					val = "—"
				}
				sb.WriteString(fmt.Sprintf(`<div class="%s %s flex items-center justify-between gap-2 overflow-hidden">`,
					paddingMeta, bgCellClass))
				sb.WriteString(fmt.Sprintf(`<span class="%s truncate">%s</span>`, textMetaClass, label))
				sb.WriteString(fmt.Sprintf(`<span class="%s font-mono truncate">%s</span>`, textMetaValClass, val))
				sb.WriteString(`</div>`)
			}
		}
		sb.WriteString(`</div>`)
	}

	// 2. HERO MAIN TIER (Dominant central entity)
	sb.WriteString(fmt.Sprintf(`<div class="%s %s flex items-center">`, paddingHero, bgCardClass))
	if p.HeroEditable {
		// Editable Form Input Mode
		inputName := p.InputName
		if inputName == "" {
			inputName = "value"
		}
		sb.WriteString(`<div class="flex items-center w-full gap-1">`)
		if p.HeroPrefix != "" {
			sb.WriteString(fmt.Sprintf(`<span class="%s text-slate-400 select-none">%s</span>`, heroTextClass, p.HeroPrefix))
		}
		sb.WriteString(fmt.Sprintf(`<input type="text" name="%s" value="%s" placeholder="%s" `,
			inputName, p.HeroValue, p.Placeholder))
		sb.WriteString(fmt.Sprintf(`class="%s %s w-full bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400" />`,
			heroTextClass, textHeroClass))
		sb.WriteString(`</div>`)
	} else {
		// Display Badge Mode
		displayVal := p.HeroValue
		if displayVal == "" {
			displayVal = "—"
		}
		sb.WriteString(fmt.Sprintf(`<span class="%s %s tracking-tight truncate">`, heroTextClass, textHeroClass))
		if p.HeroPrefix != "" {
			sb.WriteString(p.HeroPrefix)
		}
		sb.WriteString(displayVal)
		sb.WriteString(`</span>`)
	}
	sb.WriteString(`</div>`)

	// 3. BOTTOM TIER (Max 2 cells)
	if len(p.Bottom) > 0 {
		gridCols := "grid-cols-2"
		if len(p.Bottom) == 1 {
			gridCols = "grid-cols-1"
		} else if p.BottomRatio == "40/60" {
			gridCols = "grid-cols-[4fr_6fr]"
		} else if p.BottomRatio == "30/70" {
			gridCols = "grid-cols-[3fr_7fr]"
		}

		sb.WriteString(fmt.Sprintf(`<div class="grid %s divide-x %s border-t %s %s">`,
			gridCols, borderClass, borderClass, metaTextClass))

		for _, cell := range p.Bottom {
			label := cell.Label
			val := cell.Value
			if val == "" {
				val = "—"
			}
			sb.WriteString(fmt.Sprintf(`<div class="%s %s flex items-center gap-1.5 overflow-hidden">`,
				paddingMeta, bgCellClass))
			sb.WriteString(fmt.Sprintf(`<span class="%s truncate">%s</span>`, textMetaClass, label))
			sb.WriteString(fmt.Sprintf(`<span class="%s truncate font-mono">%s</span>`, textMetaValClass, val))
			sb.WriteString(`</div>`)
		}
		sb.WriteString(`</div>`)
	}

	sb.WriteString(`</div>`)

	return Component{html: sb.String()}
}

// Shorthand function
func MetaTextField(spec string, modifiers ...string) Component {
	p := ParseMetaTextSpec(spec)
	for _, mod := range modifiers {
		if strings.HasPrefix(mod, "hx-post:") {
			p.HxPost = mod[8:]
		} else if strings.HasPrefix(mod, "class:") {
			p.Class = mod[6:]
		} else if mod == "sm" || mod == "md" || mod == "lg" {
			p.Size = mod
		}
	}
	return MetaText(p)
}

// Satisfies standard Go io.WriterTo for zero-copy streaming
func (c Component) RenderTo(w io.Writer) error {
	_, err := io.WriteString(w, c.html)
	return err
}

func (c Component) WriteTo(w io.Writer) (int64, error) {
	n, err := io.WriteString(w, c.html)
	return int64(n), err
}
