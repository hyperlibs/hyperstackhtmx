package components

import (
	"strings"
	"testing"
)

func TestMetaGridStandardAndExtended(t *testing.T) {
	out := MetaGrid(MetaGridProps{
		ID:    "pmGrid",
		Mode:  "metagrid",
		Title: "Master Authoring",
		Pages: []MetaGridPage{
			{ID: "pm", Label: "Purchase Masters", Code: "PM", Src: "/api/pages/pm"},
		},
		Pane1: MetaGridPane{Pagination: "numbers", PageSize: 25, Scrollbars: "auto"},
	}).Render()

	if !strings.Contains(out, `<meta-grid id="pmGrid" mode="metagrid"`) {
		t.Errorf("expected <meta-grid> tag with mode=metagrid, got: %s", out)
	}
	if !strings.Contains(out, `data-meta-page="pm"`) {
		t.Errorf("expected left browser page item")
	}
	if !strings.Contains(out, `"pagination":"numbers"`) {
		t.Errorf("expected numbers pagination in .fx payload")
	}
}

func TestMetaGridSimpleTableDegradation(t *testing.T) {
	out := MetaGrid(MetaGridProps{
		ID:   "simpleGrid",
		Mode: "metagrid-ext",
		Features: &MetaGridFeatures{
			Keyboard:   false,
			Editable:   false,
			FormulaBar: false,
			StatusBar:  false,
		},
		Pane1: MetaGridPane{Pagination: "hscroll", Scrollbars: "x"},
		Pane2: MetaGridPane{Pagination: "vscroll", Scrollbars: "y"},
	}).Render()

	if strings.Contains(out, `data-meta-formula`) {
		t.Errorf("formula bar should be omitted when FormulaBar=false")
	}
	if !strings.Contains(out, `data-meta-pane="2"`) {
		t.Errorf("expected pane 2 in metagrid-ext mode")
	}
	if !strings.Contains(out, `"keyboard":false`) {
		t.Errorf("expected keyboard:false in .fx payload")
	}
}
