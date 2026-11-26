package components

import (
	"strings"
	"testing"
)

func TestAtomicPrecisionComponents(t *testing.T) {
	block := AtomicBlock(AtomicBlockProps{
		BlockID: "hw-block-buybox",
		Layer:   3,
		Title:   "Cyberpunk Keyboard",
		Price:   189.00,
		DiagMs:  0.2,
	})
	renderedBlock := block.Render()

	if !strings.Contains(renderedBlock, `blockid="hw-block-buybox"`) {
		t.Errorf("expected blockid attribute in block, got %s", renderedBlock)
	}
	if !strings.Contains(renderedBlock, `layer="3"`) {
		t.Errorf("expected layer 3 in block, got %s", renderedBlock)
	}
	if !strings.Contains(renderedBlock, "$diag: 0.2ms") {
		t.Errorf("expected diag badge in block, got %s", renderedBlock)
	}

	row := AtomicERPRow(AtomicERPRowProps{
		RowID:    "INV-10023",
		Customer: "Acme Industrial Logistics",
		Amount:   4520.00,
		Status:   "RECONCILED",
	})
	renderedRow := row.Render()

	if !strings.Contains(renderedRow, `rowid="INV-10023"`) {
		t.Errorf("expected rowid in row, got %s", renderedRow)
	}
	if !strings.Contains(renderedRow, `cellid="INV-10023:amount"`) {
		t.Errorf("expected cellid in row, got %s", renderedRow)
	}
	if !strings.Contains(renderedRow, "$4520.00") {
		t.Errorf("expected formatted amount in row, got %s", renderedRow)
	}
}
