import { forwardRef, useState, useEffect } from 'react'
import './Canvas.css'
import Entity from './Entity'
import Attribute from './Attribute'
import Relationship from './Relationship'
import Connection, { ConnectionEditPanel } from './Connection'

const Canvas = forwardRef(({
  tool,
  setTool,
  elements,
  connections,
  selectedElement,
  setSelectedElement,
  addElement,
  updateElement,
  deleteElement,
  addConnection,
  updateConnection,
  deleteConnection,
  zoom,
  setZoom
}, ref) => {
  const [draggingElement, setDraggingElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [tempConnection, setTempConnection] = useState(null)
  const [hoveredElement, setHoveredElement] = useState(null)
  const [draggingConnection, setDraggingConnection] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [connectionConfig, setConnectionConfig] = useState({
    participation: 'mandatory',  // mandatory or optional - shows in center
    cardinality: '1'              // 1, M, or N
  })
  const [editingConnection, setEditingConnection] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 3000, height: 2000 })
  const [spacePressed, setSpacePressed] = useState(false)

  // Keyboard listeners for space key (pan mode) and delete key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpacePressed(true)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        // Check if not editing text (input or textarea focused)
        const activeElement = document.activeElement
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault()
          deleteElement(selectedElement.id)
        }
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setSpacePressed(false)
        setIsPanning(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedElement, deleteElement])

  // Handle zoom with Ctrl+Scroll (like draw.io)
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()

      const delta = e.deltaY
      const zoomSpeed = 0.02  // Reduced from 0.1 to 0.02 for smoother zoom

      if (delta < 0) {
        // Scroll up - zoom in
        setZoom(prevZoom => Math.min(prevZoom + zoomSpeed, 3))
      } else {
        // Scroll down - zoom out
        setZoom(prevZoom => Math.max(prevZoom - zoomSpeed, 0.3))
      }
    }
  }

  const handleCanvasMouseDown = (e) => {
    // Start panning with middle mouse button or space + left click
    if (e.button === 1 || (spacePressed && e.button === 0)) {
      e.preventDefault()
      setIsPanning(true)
      const parent = e.currentTarget.parentElement
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: parent.scrollLeft,
        scrollTop: parent.scrollTop
      })
    }
  }

  const handleCanvasClick = (e) => {
    // Only handle clicks on canvas background, not on elements
    const isCanvasBackground = e.target.classList.contains('canvas') ||
                               e.target.classList.contains('connections-layer') ||
                               e.target.tagName === 'svg'

    if (isCanvasBackground && !isPanning) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

      if (tool === 'entity') {
        const newElement = {
          type: 'entity',
          x: x - 60,
          y: y - 30,
          width: 120,
          height: 60,
          text: 'Entity'
        }
        addElement(newElement)
        // Auto-switch to select mode after placing
        setTool('select')
      } else if (tool === 'attribute') {
        const newElement = {
          type: 'attribute',
          x: x - 50,
          y: y - 25,
          width: 100,
          height: 50,
          text: 'Attribute',
          isKey: false
        }
        addElement(newElement)
        // Auto-switch to select mode after placing
        setTool('select')
      } else if (tool === 'keyAttribute') {
        const newElement = {
          type: 'attribute',
          x: x - 50,
          y: y - 25,
          width: 100,
          height: 50,
          text: 'Attribute',
          isKey: true
        }
        addElement(newElement)
        // Auto-switch to select mode after placing
        setTool('select')
      } else if (tool === 'relationship') {
        const newElement = {
          type: 'relationship',
          x: x - 60,
          y: y - 40,
          width: 120,
          height: 80,
          text: 'Relationship'
        }
        addElement(newElement)
        // Auto-switch to select mode after placing
        setTool('select')
      } else if (tool === 'select') {
        setSelectedElement(null)
      }
    }
  }

  const handleElementMouseDown = (e, element) => {
    e.stopPropagation()

    if (tool === 'select' && !spacePressed) {
      setSelectedElement(element)
      setDraggingElement(element)
      
      const canvasEl = e.currentTarget.closest('.canvas')
      const rect = canvasEl.getBoundingClientRect()
      
      setDragOffset({
        x: (e.clientX - rect.left) / zoom - element.x,
        y: (e.clientY - rect.top) / zoom - element.y
      })
    } else if (tool === 'connection') {
      // Don't handle connection in mouseDown, handle it in click
      e.preventDefault()
    }
  }

  const handleElementClick = (e, element) => {
    e.stopPropagation()

    if (tool === 'connection') {
      if (connectingFrom && connectingFrom.id !== element.id) {
        // Second click - validate and create connection
        if (validateConnection(connectingFrom, element)) {
          addConnection({
            from: connectingFrom.id,
            to: element.id,
            cardinality: { from: '1', to: '1' },
            participation: { from: 'mandatory', to: 'mandatory' }
          })
          setConnectingFrom(null)
          setTempConnection(null)
        } else {
          setConnectingFrom(null)
          setTempConnection(null)
        }
      } else if (!connectingFrom) {
        // First click - start connection
        setConnectingFrom(element)
        setSelectedElement(element)
      } else {
        // Clicked same element - cancel
        setConnectingFrom(null)
        setTempConnection(null)
      }
    } else {
      setSelectedElement(element)
    }
  }

  const handleConnectionHandleMouseDown = (e, element, handlePosition) => {
    e.stopPropagation()
    setDraggingConnection(true)
    setConnectingFrom({ element, handlePosition })

    // Reset connection configuration to defaults
    setConnectionConfig({
      participation: 'mandatory',
      cardinality: '1'
    })

    const rect = e.currentTarget.getBoundingClientRect()
    const handlePos = getHandlePosition(element, handlePosition)
    setTempConnection({
      x1: handlePos.x,
      y1: handlePos.y,
      x2: e.clientX - rect.left,
      y2: e.clientY - rect.top
    })
  }

  const getHandlePosition = (element, position) => {
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2

    switch (position) {
      case 'top':
        return { x: centerX, y: element.y }
      case 'right':
        return { x: element.x + element.width, y: centerY }
      case 'bottom':
        return { x: centerX, y: element.y + element.height }
      case 'left':
        return { x: element.x, y: centerY }
      default:
        return { x: centerX, y: centerY }
    }
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      const parent = e.currentTarget.parentElement
      parent.scrollLeft = panStart.scrollLeft - deltaX
      parent.scrollTop = panStart.scrollTop - deltaY
    } else if (draggingElement && !draggingConnection) {
      const rect = e.currentTarget.getBoundingClientRect()
      const newX = (e.clientX - rect.left) / zoom
      const newY = (e.clientY - rect.top) / zoom

      updateElement(draggingElement.id, {
        x: newX - dragOffset.x,
        y: newY - dragOffset.y
      })
    } else if (draggingConnection && connectingFrom) {
      const rect = e.currentTarget.getBoundingClientRect()
      const handlePos = getHandlePosition(connectingFrom.element, connectingFrom.handlePosition)
      setTempConnection({
        x1: handlePos.x,
        y1: handlePos.y,
        x2: (e.clientX - rect.left) / zoom,
        y2: (e.clientY - rect.top) / zoom
      })
    } else if (connectingFrom && tool === 'connection') {
      const rect = e.currentTarget.getBoundingClientRect()
      setTempConnection({
        x1: connectingFrom.x + connectingFrom.width / 2,
        y1: connectingFrom.y + connectingFrom.height / 2,
        x2: (e.clientX - rect.left) / zoom,
        y2: (e.clientY - rect.top) / zoom
      })
    }
  }

  const validateConnection = (fromElement, toElement) => {
    // Rule 1: Entities cannot connect directly to other entities
    if (fromElement.type === 'entity' && toElement.type === 'entity') {
      alert('⚠️ Invalid Connection\n\nEntities cannot connect directly to other entities.\nPlease connect entities through relationships.')
      return false
    }

    // Rule 2: Relationships can only connect to entities
    if (fromElement.type === 'relationship' && toElement.type !== 'entity') {
      alert('⚠️ Invalid Connection\n\nRelationships can only connect to entities.\nPlease connect relationships to entities only.')
      return false
    }

    if (toElement.type === 'relationship' && fromElement.type !== 'entity') {
      alert('⚠️ Invalid Connection\n\nRelationships can only connect to entities.\nPlease connect relationships to entities only.')
      return false
    }

    return true
  }

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false)
    } else if (draggingConnection && connectingFrom && hoveredElement) {
      // Complete the connection with user-configured settings
      if (connectingFrom.element.id !== hoveredElement.id) {
        if (validateConnection(connectingFrom.element, hoveredElement)) {
          addConnection({
            from: connectingFrom.element.id,
            to: hoveredElement.id,
            cardinality: connectionConfig.cardinality,    // Single cardinality
            participation: connectionConfig.participation  // Shows in center
          })
        }
      }
    }
    setDraggingElement(null)
    setDraggingConnection(false)
    setConnectingFrom(null)
    setTempConnection(null)
  }

  const handleTextChange = (element, newText) => {
    updateElement(element.id, { text: newText })
  }

  const getElementCenter = (element) => {
    return {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2
    }
  }

  return (
    <div
      ref={ref}
      className={`canvas ${tool} ${spacePressed ? 'pan-mode' : ''} ${isPanning ? 'panning' : ''}`}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="canvas-zoom-wrapper"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`
        }}
      >
        <svg className="connections-layer" style={{ width: '100%', height: '100%' }}>
        {connections.map(conn => {
          const fromEl = elements.find(el => el.id === conn.from)
          const toEl = elements.find(el => el.id === conn.to)
          if (!fromEl || !toEl) return null

          const from = getElementCenter(fromEl)
          const to = getElementCenter(toEl)

          return (
            <Connection
              key={conn.id}
              connection={conn}
              from={from}
              to={to}
              updateConnection={updateConnection}
              deleteConnection={deleteConnection}
              onClick={() => setEditingConnection(conn)}
              isSelected={editingConnection?.id === conn.id}
            />
          )
        })}

        {tempConnection && (
          <line
            x1={tempConnection.x1}
            y1={tempConnection.y1}
            x2={tempConnection.x2}
            y2={tempConnection.y2}
            stroke="#999"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      <div className="elements-layer">
        {elements.map(element => {
          const isSelected = selectedElement?.id === element.id
          const isHovered = hoveredElement?.id === element.id
          const showHandles = (isSelected || isHovered) && tool === 'select'

          const renderElement = () => {
            if (element.type === 'entity') {
              return (
                <Entity
                  key={element.id}
                  element={element}
                  isSelected={isSelected}
                  onMouseDown={(e) => handleElementMouseDown(e, element)}
                  onClick={(e) => handleElementClick(e, element)}
                  onTextChange={(text) => handleTextChange(element, text)}
                />
              )
            } else if (element.type === 'attribute') {
              return (
                <Attribute
                  key={element.id}
                  element={element}
                  isSelected={isSelected}
                  onMouseDown={(e) => handleElementMouseDown(e, element)}
                  onClick={(e) => handleElementClick(e, element)}
                  onTextChange={(text) => handleTextChange(element, text)}
                />
              )
            } else if (element.type === 'relationship') {
              return (
                <Relationship
                  key={element.id}
                  element={element}
                  isSelected={isSelected}
                  onMouseDown={(e) => handleElementMouseDown(e, element)}
                  onClick={(e) => handleElementClick(e, element)}
                  onTextChange={(text) => handleTextChange(element, text)}
                />
              )
            }
            return null
          }

          const renderConnectionHandles = () => {
            if (!showHandles) return null

            const handles = ['top', 'right', 'bottom', 'left']
            return handles.map(position => {
              const handlePos = getHandlePosition(element, position)
              return (
                <div
                  key={`${element.id}-${position}`}
                  className="connection-handle"
                  style={{
                    left: handlePos.x - 4,
                    top: handlePos.y - 4,
                    width: 8,
                    height: 8
                  }}
                  onMouseDown={(e) => handleConnectionHandleMouseDown(e, element, position)}
                  onMouseEnter={() => setHoveredElement(element)}
                />
              )
            })
          }

          return (
            <div
              key={element.id}
              onMouseEnter={() => setHoveredElement(element)}
              onMouseLeave={() => setHoveredElement(null)}
            >
              {renderElement()}
              {renderConnectionHandles()}
            </div>
          )
        })}
      </div>
      </div>

      {tool === 'connection' && connectingFrom && (
        <div className="connection-hint">
          Click on another element to create a connection
        </div>
      )}

      {draggingConnection && (
        <div className="connection-config-panel">
          <h4>Connection Settings</h4>

          <div className="config-section">
            <label>Participation (Center)</label>
            <div className="button-group">
              <button
                className={connectionConfig.participation === 'mandatory' ? 'active' : ''}
                onClick={() => setConnectionConfig({...connectionConfig, participation: 'mandatory'})}
              >
                ─|─ Mandatory
              </button>
              <button
                className={connectionConfig.participation === 'optional' ? 'active' : ''}
                onClick={() => setConnectionConfig({...connectionConfig, participation: 'optional'})}
              >
                ─○─ Optional
              </button>
            </div>
          </div>

          <div className="config-section">
            <label>Cardinality</label>
            <div className="button-group cardinality-group">
              <button
                className={connectionConfig.cardinality === '1' ? 'active' : ''}
                onClick={() => setConnectionConfig({...connectionConfig, cardinality: '1'})}
              >
                1
              </button>
              <button
                className={connectionConfig.cardinality === 'M' ? 'active' : ''}
                onClick={() => setConnectionConfig({...connectionConfig, cardinality: 'M'})}
              >
                M
              </button>
              <button
                className={connectionConfig.cardinality === 'N' ? 'active' : ''}
                onClick={() => setConnectionConfig({...connectionConfig, cardinality: 'N'})}
              >
                N
              </button>
            </div>
          </div>

          <div className="config-instruction">
            Drag to target element
          </div>
        </div>
      )}

      {editingConnection && (
        <ConnectionEditPanel
          connection={editingConnection}
          updateConnection={updateConnection}
          deleteConnection={deleteConnection}
          onClose={() => setEditingConnection(null)}
        />
      )}
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
