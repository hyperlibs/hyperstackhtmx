package components

import (
	"bytes"
	"strings"
	"testing"
)

func TestMetaTextParsing(t *testing.T) {
	spec := "UHID: 1221 | [Pt - David Jeba] | AGE: 45, SEX: Male"
	p := ParseMetaTextSpec(spec)

	if len(p.Top) != 1 || p.Top[0].Label != "UHID" || p.Top[0].Value != "1221" {
		t.Fatalf("unexpected Top: %+v", p.Top)
	}

	if p.HeroPrefix != "Pt - " || p.HeroValue != "David Jeba" {
		t.Fatalf("unexpected Hero: prefix=%s val=%s", p.HeroPrefix, p.HeroValue)
	}

	if len(p.Bottom) != 2 || p.Bottom[0].Label != "AGE" || p.Bottom[0].Value != "45" {
		t.Fatalf("unexpected Bottom[0]: %+v", p.Bottom)
	}

	if p.Bottom[1].Label != "SEX" || p.Bottom[1].Value != "Male" {
		t.Fatalf("unexpected Bottom[1]: %+v", p.Bottom[1])
	}
}

func TestMetaText2x2Guardrail(t *testing.T) {
	// Trying to pass 4 items on top and 3 items on bottom
	p := MetaTextProps{
		Top: []MetaCell{
			{Label: "T1", Value: "V1"},
			{Label: "T2", Value: "V2"},
			{Label: "T3", Value: "V3"},
			{Label: "T4", Value: "V4"},
		},
		HeroValue: "Hero Target",
		Bottom: []MetaCell{
			{Label: "B1", Value: "V1"},
			{Label: "B2", Value: "V2"},
			{Label: "B3", Value: "V3"},
		},
	}

	comp := MetaText(p)
	html := comp.Render()

	// Must enforce max 2 cells
	if strings.Contains(html, "T3") || strings.Contains(html, "T4") {
		t.Errorf("Top cells violated 2x2 rule, contained T3 or T4")
	}
	if strings.Contains(html, "B3") {
		t.Errorf("Bottom cells violated 2x2 rule, contained B3")
	}
	if !strings.Contains(html, "T1") || !strings.Contains(html, "T2") {
		t.Errorf("Top cells missing T1 or T2")
	}
	if !strings.Contains(html, "B1") || !strings.Contains(html, "B2") {
		t.Errorf("Bottom cells missing B1 or B2")
	}
}

func TestMetaTextEditableMode(t *testing.T) {
	spec := "UHID: 1221 | [@pt_name: David Jeba] | AGE: 45, SEX: Male"
	comp := MetaTextField(spec, "hx-post:/api/patients/save")
	html := comp.Render()

	if !strings.Contains(html, `<input type="text" name="pt_name" value="David Jeba"`) {
		t.Errorf("Expected editable input field, got: %s", html)
	}
	if !strings.Contains(html, `hx-post="/api/patients/save"`) {
		t.Errorf("Expected hx-post attribute, got: %s", html)
	}
}

func TestMetaTextStreaming(t *testing.T) {
	comp := MetaTextField("UHID: 1001 | [Test Hero] | BED: 4A, STATUS: Active")
	var buf bytes.Buffer
	err := comp.RenderTo(&buf)
	if err != nil {
		t.Fatalf("RenderTo failed: %v", err)
	}

	if buf.Len() == 0 || !strings.Contains(buf.String(), "Test Hero") {
		t.Errorf("Streamed buffer missing content: %s", buf.String())
	}
}
