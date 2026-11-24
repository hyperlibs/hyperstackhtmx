package components

import (
	"fmt"
	"io"
	"strings"
)

// =============================================================================
// METATEXT COMPONENT (FIRST HYPERSTACK META COMPONENT)
// Ultra-compact compound text component that drops in wherever a simple textbox
// fits (standard 40px/h-10 height). A dominant hero text/input is flanked by
// micro-metadata tiers above and below with ZERO wasted gap.
// Strict Guardrails:
//   1. Max 2 cells Top, Max 2 cells Bottom (2x2 cap).
//   2. Meta font size is strictly 50% smaller than Hero text.
//   3. Empty values gracefully fall back to clean em-dash ("—").
//   4. Ultra-compact footprint: fits 1:1 into standard text input form slots.
// =============================================================================

// MetaCell represents an individual metadata slot (Label + Value + optional Color/Class).
type MetaCell struct {
	Label string
	Value string
	Color string // Semantic color: "red", "amber", "emerald", "sky", "purple", "rose"
	Class string // Custom CSS class overrides for the cell/value
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
	if strings.Contains(cleanRaw, "(50/50)") {
		cleanRaw = strings.ReplaceAll(cleanRaw, "(50/50)", "")
	} else if strings.Contains(cleanRaw, "(30/70)") {
		cleanRaw = strings.ReplaceAll(cleanRaw, "(30/70)", "")
	} else if strings.Contains(cleanRaw, "(40/60)") {
		cleanRaw = strings.ReplaceAll(cleanRaw, "(40/60)", "")
	}

	parts := strings.Split(cleanRaw, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		var label, val, color string

		// Split on colon or hyphen
		if strings.Contains(part, ":") {
			kv := strings.SplitN(part, ":", 2)
			label = strings.TrimSpace(kv[0])
			val = strings.TrimSpace(kv[1])
		} else if strings.Contains(part, " - ") {
			kv := strings.SplitN(part, " - ", 2)
			label = strings.TrimSpace(kv[0])
			val = strings.TrimSpace(kv[1])
		} else {
			label = part
			val = ""
		}

		// Detect color modifier in value or label: e.g. "45!red" or "45 (red)" or "AGE!red: 45"
		if strings.Contains(val, "!") {
			vp := strings.SplitN(val, "!", 2)
			val = strings.TrimSpace(vp[0])
			color = strings.TrimSpace(vp[1])
		} else if strings.Contains(label, "!") {
			lp := strings.SplitN(label, "!", 2)
			label = strings.TrimSpace(lp[0])
			color = strings.TrimSpace(lp[1])
		} else if strings.HasSuffix(val, ")") && strings.Contains(val, "(") {
			idx := strings.LastIndex(val, "(")
			colorCandidate := strings.Trim(val[idx:], "()")
			val = strings.TrimSpace(val[:idx])
			color = colorCandidate
		}

		cells = append(cells, MetaCell{
			Label: label,
			Value: val,
			Color: color,
		})

		// Strict guardrail: max 2 cells per row
		if len(cells) == 2 {
			break
		}
	}
	return cells
}

func resolveCellColorClass(cell MetaCell, defaultValClass string) string {
	if cell.Class != "" {
		return cell.Class
	}
	switch strings.ToLower(cell.Color) {
	case "red", "rose", "danger", "alert":
		return "text-red-600 dark:text-red-400 font-bold"
	case "amber", "yellow", "orange", "warning":
		return "text-amber-600 dark:text-amber-400 font-bold"
	case "emerald", "green", "success":
		return "text-emerald-600 dark:text-emerald-400 font-bold"
	case "sky", "blue", "cyan", "info":
		return "text-sky-600 dark:text-sky-400 font-bold"
	case "purple", "violet", "indigo":
		return "text-purple-600 dark:text-purple-400 font-bold"
	default:
		return defaultValClass
	}
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

	// Rigid sizing configuration (Default md: 48px / h-12 rigid boundary)
	containerClass := "h-12 w-full box-border" // Standard 48px enterprise cell & input height
	heroTextClass := "text-xs font-bold"
	metaTextClass := "text-[9px] font-mono leading-none tracking-wider uppercase" // Strictly 50% smaller
	topHeightClass := "h-[14px] min-h-[14px] shrink-0"
	heroHeightClass := "h-[20px] min-h-[20px] shrink-0"
	bottomHeightClass := "h-[14px] min-h-[14px] shrink-0"
	paddingX := "px-2.5"

	switch p.Size {
	case "sm":
		containerClass = "h-10 w-full box-border" // 40px compact form input
		heroTextClass = "text-xs font-bold"
		metaTextClass = "text-[8px] font-mono leading-none tracking-wider uppercase"
		topHeightClass = "h-[12px] min-h-[12px] shrink-0"
		heroHeightClass = "h-[16px] min-h-[16px] shrink-0"
		bottomHeightClass = "h-[12px] min-h-[12px] shrink-0"
		paddingX = "px-2"
	case "lg":
		containerClass = "h-14 w-full box-border" // 56px large input / badge
		heroTextClass = "text-sm font-bold"
		metaTextClass = "text-[10px] font-mono leading-none tracking-wider uppercase"
		topHeightClass = "h-[16px] min-h-[16px] shrink-0"
		heroHeightClass = "h-[24px] min-h-[24px] shrink-0"
		bottomHeightClass = "h-[16px] min-h-[16px] shrink-0"
		paddingX = "px-3"
	}

	// Theming & subtle hairline borders
	borderClass := "border-slate-300 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20"
	dividerClass := "border-slate-200 dark:border-slate-800"
	bgCardClass := "bg-white dark:bg-slate-900"
	bgCellClass := "bg-slate-50/70 dark:bg-slate-950/50"
	textHeroClass := "text-slate-900 dark:text-slate-100"
	textMetaClass := "text-slate-500 dark:text-slate-400"
	textMetaValClass := "text-slate-800 dark:text-slate-200 font-semibold"

	var sb strings.Builder

	// Wrapper: ultra-compact flex column fitting 1:1 in textbox slot
	sb.WriteString(`<div class="hs-metatext inline-flex flex-col justify-between `)
	sb.WriteString(bgCardClass)
	sb.WriteString(` border `)
	sb.WriteString(borderClass)
	sb.WriteString(` rounded shadow-2xs font-sans select-none overflow-hidden `)
	sb.WriteString(containerClass)
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

	// 1. TOP TIER (Max 2 cells) - Hairline micro-row
	if len(p.Top) > 0 {
		gridCols := "grid-cols-2"
		if len(p.Top) == 1 {
			gridCols = "grid-cols-1"
		} else if p.TopRatio == "30/70" {
			gridCols = "grid-cols-[3fr_7fr]"
		} else if p.TopRatio == "40/60" {
			gridCols = "grid-cols-[4fr_6fr]"
		}

		sb.WriteString(fmt.Sprintf(`<div class="grid %s divide-x %s border-b %s %s %s leading-none">`,
			gridCols, dividerClass, dividerClass, topHeightClass, metaTextClass))

		for _, cell := range p.Top {
			label := cell.Label
			if label == "" {
				label = "—"
			}
			val := cell.Value
			if val == "" && len(p.Top) == 1 {
				// Single cell with just label
				sb.WriteString(fmt.Sprintf(`<div class="%s %s flex items-center %s truncate"><span>%s</span></div>`,
					paddingX, bgCellClass, textMetaClass, label))
			} else {
				if val == "" {
					val = "—"
				}
				valClass := resolveCellColorClass(cell, textMetaValClass)
				sb.WriteString(fmt.Sprintf(`<div class="%s %s flex items-center justify-between gap-1 overflow-hidden">`,
					paddingX, bgCellClass))
				sb.WriteString(fmt.Sprintf(`<span class="%s truncate">%s</span>`, textMetaClass, label))
				sb.WriteString(fmt.Sprintf(`<span class="%s font-mono truncate">%s</span>`, valClass, val))
				sb.WriteString(`</div>`)
			}
		}
		sb.WriteString(`</div>`)
	}

	// 2. HERO MAIN TIER (Dominant central entity, fits 1:1 in textbox line)
	sb.WriteString(fmt.Sprintf(`<div class="%s %s %s flex items-center">`, paddingX, heroHeightClass, bgCardClass))
	if p.HeroEditable {
		// Editable Form Input Mode
		inputName := p.InputName
		if inputName == "" {
			inputName = "value"
		}
		sb.WriteString(`<div class="flex items-center w-full gap-1">`)
		if p.HeroPrefix != "" {
			sb.WriteString(fmt.Sprintf(`<span class="%s text-slate-400 select-none leading-none">%s</span>`, heroTextClass, p.HeroPrefix))
		}
		sb.WriteString(fmt.Sprintf(`<input type="text" name="%s" value="%s" placeholder="%s" `,
			inputName, p.HeroValue, p.Placeholder))
		sb.WriteString(fmt.Sprintf(`class="%s %s w-full bg-transparent border-0 p-0 m-0 leading-none focus:outline-none focus:ring-0 placeholder:text-slate-400" />`,
			heroTextClass, textHeroClass))
		sb.WriteString(`</div>`)
	} else {
		// Display Badge Mode
		displayVal := p.HeroValue
		if displayVal == "" {
			displayVal = "—"
		}
		sb.WriteString(fmt.Sprintf(`<span class="%s %s leading-none tracking-tight truncate">`, heroTextClass, textHeroClass))
		if p.HeroPrefix != "" {
			sb.WriteString(p.HeroPrefix)
		}
		sb.WriteString(displayVal)
		sb.WriteString(`</span>`)
	}
	sb.WriteString(`</div>`)

	// 3. BOTTOM TIER (Max 2 cells) - Hairline micro-row
	if len(p.Bottom) > 0 {
		gridCols := "grid-cols-2"
		if len(p.Bottom) == 1 {
			gridCols = "grid-cols-1"
		} else if p.BottomRatio == "40/60" {
			gridCols = "grid-cols-[4fr_6fr]"
		} else if p.BottomRatio == "30/70" {
			gridCols = "grid-cols-[3fr_7fr]"
		}

		sb.WriteString(fmt.Sprintf(`<div class="grid %s divide-x %s border-t %s %s %s leading-none">`,
			gridCols, dividerClass, dividerClass, bottomHeightClass, metaTextClass))

		for _, cell := range p.Bottom {
			label := cell.Label
			val := cell.Value
			if val == "" {
				val = "—"
			}
			valClass := resolveCellColorClass(cell, textMetaValClass)
			sb.WriteString(fmt.Sprintf(`<div class="%s %s flex items-center justify-between gap-1 overflow-hidden">`,
				paddingX, bgCellClass))
			sb.WriteString(fmt.Sprintf(`<span class="%s truncate">%s</span>`, textMetaClass, label))
			sb.WriteString(fmt.Sprintf(`<span class="%s truncate font-mono">%s</span>`, valClass, val))
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
