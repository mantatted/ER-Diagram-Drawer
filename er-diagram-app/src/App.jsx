import { useState, useRef, useEffect } from 'react'
import './App.css'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import PropertiesBar from './components/PropertiesBar'
import { exportToPNG, exportToPDF } from './utils/export'

function App() {
  const [tool, setTool] = useState('select') // select, entity, attribute, keyAttribute, relationship
  const [elements, setElements] = useState(() => {
    try {
      const saved = localStorage.getItem('er-diagram-autosave')
      if (saved) {
        const data = JSON.parse(saved)
        return data.elements || []
      }
    } catch {}
    return []
  })
  const [connections, setConnections] = useState(() => {
    try {
      const saved = localStorage.getItem('er-diagram-autosave')
      if (saved) {
        const data = JSON.parse(saved)
        return data.connections || []
      }
    } catch {}
    return []
  })
  const [selectedElements, setSelectedElements] = useState([])
  const [zoom, setZoom] = useState(1)
  const [elementScale, setElementScale] = useState(() => {
    try {
      const saved = localStorage.getItem('er-diagram-element-scale')
      if (saved) return parseFloat(saved)
    } catch {}
    return 1
  })
  const canvasRef = useRef(null)

  // Undo history stack (snapshots of { elements, connections })
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const isRestoringRef = useRef(false)

  // Clipboard for copy/paste
  const clipboardRef = useRef(null)

  const pushHistory = (els, conns) => {
    // Truncate any forward history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push({
      elements: JSON.parse(JSON.stringify(els)),
      connections: JSON.parse(JSON.stringify(conns))
    })
    // Cap at 50 entries
    if (historyRef.current.length > 50) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }
  }

  const undo = () => {
    if (historyIndexRef.current < 0) return
    const snapshot = historyRef.current[historyIndexRef.current]
    historyIndexRef.current--
    isRestoringRef.current = true
    setElements(snapshot.elements)
    setConnections(snapshot.connections)
    setSelectedElements([])
    // Reset restoring flag after state update
    setTimeout(() => { isRestoringRef.current = false }, 0)
  }

  const copySelected = () => {
    if (selectedElements.length === 0) return
    const selectedSet = new Set(selectedElements)
    const copiedElements = elements.filter(el => selectedSet.has(el.id)).map(el => ({ ...el }))
    const copiedConnections = connections.filter(
      conn => selectedSet.has(conn.from) && selectedSet.has(conn.to)
    ).map(conn => ({ ...conn }))
    clipboardRef.current = {
      elements: JSON.parse(JSON.stringify(copiedElements)),
      connections: JSON.parse(JSON.stringify(copiedConnections))
    }
  }

  const pasteClipboard = () => {
    if (!clipboardRef.current) return
    const { elements: clipEls, connections: clipConns } = clipboardRef.current

    // Generate new IDs and build old-to-new mapping
    const idMap = {}
    const now = Date.now()
    const newElements = clipEls.map((el, i) => {
      const newId = now + i
      idMap[el.id] = newId
      return { ...el, id: newId, x: el.x + 20, y: el.y + 20 }
    })

    const newConnections = clipConns.map((conn, i) => ({
      ...conn,
      id: now + clipEls.length + i,
      from: idMap[conn.from],
      to: idMap[conn.to]
    }))

    // Push history before mutation
    pushHistory(elements, connections)

    setElements(prev => [...prev, ...newElements])
    setConnections(prev => [...prev, ...newConnections])
    setSelectedElements(newElements.map(el => el.id))
  }

  // Auto-save to localStorage
  useEffect(() => {
    const data = { elements, connections, version: '1.0' }
    localStorage.setItem('er-diagram-autosave', JSON.stringify(data))
  }, [elements, connections])

  // Save element scale
  useEffect(() => {
    localStorage.setItem('er-diagram-element-scale', String(elementScale))
  }, [elementScale])

  const addElement = (element) => {
    pushHistory(elements, connections)
    setElements(prev => [...prev, { ...element, id: Date.now() }])
  }

  const updateElement = (id, updates) => {
    if (!isRestoringRef.current) pushHistory(elements, connections)
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const updateElements = (updates) => {
    // updates: [{ id, changes }, ...]
    if (!isRestoringRef.current) pushHistory(elements, connections)
    setElements(prev => prev.map(el => {
      const u = updates.find(up => up.id === el.id)
      return u ? { ...el, ...u.changes } : el
    }))
  }

  const deleteElement = (id) => {
    pushHistory(elements, connections)
    setElements(prev => prev.filter(el => el.id !== id))
    setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id))
    setSelectedElements(prev => prev.filter(eid => eid !== id))
  }

  const deleteElements = (ids) => {
    pushHistory(elements, connections)
    const idSet = new Set(ids)
    setElements(prev => prev.filter(el => !idSet.has(el.id)))
    setConnections(prev => prev.filter(conn => !idSet.has(conn.from) && !idSet.has(conn.to)))
    setSelectedElements(prev => prev.filter(eid => !idSet.has(eid)))
  }

  const addConnection = (connection) => {
    pushHistory(elements, connections)
    setConnections(prev => [...prev, { ...connection, id: Date.now() }])
  }

  const updateConnection = (id, updates) => {
    pushHistory(elements, connections)
    setConnections(prev => prev.map(conn => conn.id === id ? { ...conn, ...updates } : conn))
  }

  const deleteConnection = (id) => {
    pushHistory(elements, connections)
    setConnections(prev => prev.filter(conn => conn.id !== id))
  }

  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      pushHistory(elements, connections)
      setElements([])
      setConnections([])
      setSelectedElements([])
      localStorage.removeItem('er-diagram-autosave')
    }
  }

  const saveToFile = () => {
    const data = {
      elements,
      connections,
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `er-diagram-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadFromFile = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          pushHistory(elements, connections)
          setElements(data.elements || [])
          setConnections(data.connections || [])
          setSelectedElements([])
        } catch (error) {
          alert('Error loading file: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportPNG = (scale) => {
    setShowResolutionModal(false)
    exportToPNG(canvasRef.current, { scale, elements, elementScale })
  }

  const handleExportPDF = () => {
    exportToPDF(canvasRef.current)
  }

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.3))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showResolutionModal, setShowResolutionModal] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showExportDropdown])

  useEffect(() => {
    if (!showResolutionModal) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowResolutionModal(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [showResolutionModal])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1>HKDSE ER Diagram Drawer</h1>
          <p>Design ER Diagrams following HKDSE ICT Standards</p>
        </div>
        <div className="app-header-actions">
          <button className="header-btn" onClick={saveToFile} title="Save diagram">
            <img src="/save.png" alt="Save" className="header-icon" />
          </button>
          <label className="header-btn" style={{ cursor: 'pointer' }} title="Load diagram">
            <img src="/import.png" alt="Import" className="header-icon" />
            <input
              type="file"
              accept=".json"
              onChange={loadFromFile}
              style={{ display: 'none' }}
            />
          </label>
          <div className="export-dropdown-container">
            <button
              className="header-btn"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              title="Export diagram"
            >
              <img src="/downloads.png" alt="Export" className="header-icon" />
            </button>
            {showExportDropdown && (
              <div className="export-dropdown">
                <button onClick={() => { setShowResolutionModal(true); setShowExportDropdown(false); }}>
                  🖼️ PNG
                </button>
                <button onClick={() => { handleExportPDF(); setShowExportDropdown(false); }}>
                  📄 PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <PropertiesBar
        elements={elements}
        selectedElements={selectedElements}
        updateElement={updateElement}
        updateElements={updateElements}
        deleteElement={deleteElement}
        deleteElements={deleteElements}
      />

      <div className="app-main">
        <Toolbar
          tool={tool}
          setTool={setTool}
          zoom={zoom}
          onResetZoom={handleResetZoom}
          onClearAll={clearCanvas}
        />

        <Canvas
          ref={canvasRef}
          tool={tool}
          setTool={setTool}
          elements={elements}
          connections={connections}
          selectedElements={selectedElements}
          setSelectedElements={setSelectedElements}
          addElement={addElement}
          updateElement={updateElement}
          updateElements={updateElements}
          deleteElement={deleteElement}
          deleteElements={deleteElements}
          addConnection={addConnection}
          updateConnection={updateConnection}
          deleteConnection={deleteConnection}
          zoom={zoom}
          setZoom={setZoom}
          elementScale={elementScale}
          setElementScale={setElementScale}
          undo={undo}
          copySelected={copySelected}
          pasteClipboard={pasteClipboard}
        />
      </div>

      {showResolutionModal && (
        <div className="modal-overlay" onClick={() => setShowResolutionModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Export PNG</h3>
            <p>Select resolution quality:</p>
            <div className="resolution-options">
              <button className="resolution-btn high" onClick={() => handleExportPNG(3)}>
                <span className="resolution-label">High</span>
                <span className="resolution-desc">3x - Best quality</span>
              </button>
              <button className="resolution-btn average" onClick={() => handleExportPNG(2)}>
                <span className="resolution-label">Average</span>
                <span className="resolution-desc">2x - Balanced</span>
              </button>
              <button className="resolution-btn low" onClick={() => handleExportPNG(1)}>
                <span className="resolution-label">Low</span>
                <span className="resolution-desc">1x - Smaller file</span>
              </button>
            </div>
            <button className="modal-cancel-btn" onClick={() => setShowResolutionModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
