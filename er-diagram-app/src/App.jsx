import { useState, useRef, useEffect } from 'react'
import './App.css'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
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
  const [selectedElement, setSelectedElement] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [elementScale, setElementScale] = useState(() => {
    try {
      const saved = localStorage.getItem('er-diagram-element-scale')
      if (saved) return parseFloat(saved)
    } catch {}
    return 1
  })
  const canvasRef = useRef(null)

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
    setElements([...elements, { ...element, id: Date.now() }])
  }

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id))
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id))
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
  }

  const addConnection = (connection) => {
    setConnections([...connections, { ...connection, id: Date.now() }])
  }

  const updateConnection = (id, updates) => {
    setConnections(connections.map(conn => conn.id === id ? { ...conn, ...updates } : conn))
  }

  const deleteConnection = (id) => {
    setConnections(connections.filter(conn => conn.id !== id))
  }

  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setElements([])
      setConnections([])
      setSelectedElement(null)
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
          setElements(data.elements || [])
          setConnections(data.connections || [])
          setSelectedElement(null)
        } catch (error) {
          alert('Error loading file: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportPNG = () => {
    exportToPNG(canvasRef.current)
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showExportDropdown])

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
                <button onClick={() => { handleExportPNG(); setShowExportDropdown(false); }}>
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

      <div className="app-main">
        <Toolbar
          tool={tool}
          setTool={setTool}
          selectedElement={selectedElement}
          onDeleteElement={deleteElement}
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
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          addElement={addElement}
          updateElement={updateElement}
          deleteElement={deleteElement}
          addConnection={addConnection}
          updateConnection={updateConnection}
          deleteConnection={deleteConnection}
          zoom={zoom}
          setZoom={setZoom}
          elementScale={elementScale}
          setElementScale={setElementScale}
        />
      </div>
    </div>
  )
}

export default App
