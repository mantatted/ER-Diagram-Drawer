import { useState, useEffect } from 'react'

function FontSizeInput({ value, onChange }) {
  const [localValue, setLocalValue] = useState(String(value))

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const commit = () => {
    const val = parseInt(localValue, 10)
    if (!isNaN(val) && val >= 8 && val <= 48) {
      onChange(val)
    } else {
      setLocalValue(String(value))
    }
  }

  return (
    <input
      type="text"
      className="prop-font-input"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.target.blur()
        e.stopPropagation()
      }}
    />
  )
}

function PropertiesBar({
  elements,
  selectedElements,
  updateElement,
  updateElements,
  deleteElement,
  deleteElements
}) {
  const [globalFontSize, setGlobalFontSize] = useState('16')

  const selectedCount = selectedElements.length
  const sel = selectedCount === 1
    ? elements.find(el => el.id === selectedElements[0])
    : null

  const applyGlobalFontSize = () => {
    const val = parseInt(globalFontSize, 10)
    if (isNaN(val) || val < 8 || val > 48) return
    const updates = elements.map(el => ({ id: el.id, changes: { fontSize: val } }))
    updateElements(updates)
  }

  return (
    <div className="properties-bar">
      <div className="prop-item">
        <span className="prop-label">All Font</span>
        <div className="prop-font-size">
          <input
            type="text"
            className="prop-font-input"
            value={globalFontSize}
            onChange={(e) => setGlobalFontSize(e.target.value)}
            onBlur={applyGlobalFontSize}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyGlobalFontSize()
                e.target.blur()
              }
              e.stopPropagation()
            }}
          />
          <button className="prop-apply-btn" onClick={applyGlobalFontSize}>
            Apply
          </button>
        </div>
      </div>

      {sel && (
        <>
          <div className="prop-divider" />
          <div className="prop-item">
            <span className="prop-label">Type</span>
            <select
              className="prop-type-select"
              value={sel.type === 'attribute' && sel.isKey ? 'keyAttribute' : sel.type}
              onChange={(e) => {
                const val = e.target.value
                if (val === 'entity') {
                  updateElement(sel.id, { type: 'entity', isKey: undefined })
                } else if (val === 'attribute') {
                  updateElement(sel.id, { type: 'attribute', isKey: false })
                } else if (val === 'keyAttribute') {
                  updateElement(sel.id, { type: 'attribute', isKey: true })
                } else if (val === 'relationship') {
                  updateElement(sel.id, { type: 'relationship', isKey: undefined })
                }
              }}
            >
              <option value="entity">Entity</option>
              <option value="attribute">Attribute</option>
              <option value="keyAttribute">Key Attribute</option>
              <option value="relationship">Relationship</option>
            </select>
          </div>
          <div className="prop-divider" />
          <div className="prop-item">
            <span className="prop-label">Text</span>
            <input
              type="text"
              className="prop-text-input"
              value={sel.text}
              onChange={(e) => updateElement(sel.id, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur()
                e.stopPropagation()
              }}
            />
          </div>
          <div className="prop-divider" />
          <div className="prop-item">
            <span className="prop-label">Font Size</span>
            <div className="prop-font-size">
              <button
                className="prop-font-btn"
                onClick={() => {
                  const current = sel.fontSize || 16
                  if (current > 8) updateElement(sel.id, { fontSize: current - 2 })
                }}
              >
                −
              </button>
              <FontSizeInput
                value={sel.fontSize || 16}
                onChange={(val) => updateElement(sel.id, { fontSize: val })}
              />
              <button
                className="prop-font-btn"
                onClick={() => {
                  const current = sel.fontSize || 16
                  if (current < 48) updateElement(sel.id, { fontSize: current + 2 })
                }}
              >
                +
              </button>
            </div>
          </div>
          <div className="prop-divider" />
          <button className="prop-delete-btn" onClick={() => deleteElement(sel.id)}>
            Delete
          </button>
        </>
      )}

      {selectedCount > 1 && (
        <>
          <div className="prop-divider" />
          <div className="prop-item">
            <span className="prop-label">Selected</span>
            <span className="prop-value">{selectedCount} elements</span>
          </div>
          <div className="prop-divider" />
          <button className="prop-delete-btn" onClick={() => deleteElements(selectedElements)}>
            Delete All
          </button>
        </>
      )}
    </div>
  )
}

export default PropertiesBar
