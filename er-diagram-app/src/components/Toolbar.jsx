import './Toolbar.css'

function Toolbar({
  tool,
  setTool,
  selectedElement,
  onDeleteElement,
  zoom,
  onResetZoom,
  onClearAll
}) {
  const tools = [
    { id: 'select', label: 'Select', icon: '➤', description: 'Select and move elements, drag from edges to connect' },
    { id: 'entity', label: 'Entity', icon: '▭', description: 'Rectangle - Entity' },
    { id: 'attribute', label: 'Attribute', icon: '○', description: 'Oval - Attribute' },
    { id: 'keyAttribute', label: 'Key Attribute', icon: '⊙', description: 'Underlined Oval - Key Attribute' },
    { id: 'relationship', label: 'Relationship', icon: '◇', description: 'Diamond - Relationship' },
  ]

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Tools</h3>
        <div className="tool-buttons">
          {tools.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={t.description}
            >
              <span className={`tool-icon ${t.icon.length > 1 ? 'text-icon' : ''}`}>{t.icon}</span>
              <span className="tool-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Zoom</h3>
        <div className="file-buttons">
          <button
            className="action-btn reset-zoom"
            onClick={onResetZoom}
            title="Reset zoom to 100%"
            style={{ background: zoom !== 1 ? '#fff3cd' : 'white' }}
          >
            <span>{Math.round(zoom * 100)}%</span>
            <span style={{ fontSize: '0.65rem' }}>Reset</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Canvas</h3>
        <div className="file-buttons">
          <button
            className="action-btn danger"
            onClick={onClearAll}
            title="Clear all elements and connections"
          >
            <span>🗑️</span>
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {selectedElement && (
        <div className="toolbar-section">
          <h3>Selected</h3>
          <div className="selected-info">
            <p><strong>Type:</strong> {selectedElement.type}</p>
            <p><strong>Text:</strong> {selectedElement.text}</p>
            <button
              className="action-btn danger"
              onClick={() => onDeleteElement(selectedElement.id)}
              title="Delete (or press Delete key)"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
            <p style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
              Press DELETE key
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Toolbar
