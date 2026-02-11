import { forwardRef, useState, useEffect, useRef } from 'react'
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
  selectedElements,
  setSelectedElements,
  addElement,
  updateElement,
  updateElements,
  deleteElement,
  deleteElements,
  addConnection,
  updateConnection,
  deleteConnection,
  zoom,
  setZoom,
  elementScale,
  setElementScale,
  undo,
  copySelected,
  pasteClipboard
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
  const [selectionRect, setSelectionRect] = useState(null)
  const justFinishedMarquee = useRef(false)

  // Compute scaled elements for rendering
  const scaledElements = elements.map(el => ({
    ...el,
    width: el.width * elementScale,
    height: el.height * elementScale
  }))

  // Keyboard listeners for space key (pan mode) and delete key
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement
      const isEditing = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA'

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpacePressed(true)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
        if (!isEditing) {
          e.preventDefault()
          deleteElements(selectedElements)
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !isEditing) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isEditing) {
        e.preventDefault()
        copySelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y' && !isEditing) {
        e.preventDefault()
        pasteClipboard()
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
  }, [selectedElements, deleteElements, undo, copySelected, pasteClipboard])

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
    } else if (tool === 'select' && e.button === 0 && !spacePressed) {
      // Check if clicking on canvas background (not on an element)
      const isCanvasBackground = e.target.classList.contains('canvas') ||
                                 e.target.classList.contains('connections-layer') ||
                                 e.target.tagName === 'svg'
      if (isCanvasBackground) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / zoom
        const y = (e.clientY - rect.top) / zoom
        setSelectionRect({ startX: x, startY: y, endX: x, endY: y })
      }
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
        const w = 120, h = 60
        const newElement = {
          type: 'entity',
          x: x - (w * elementScale) / 2,
          y: y - (h * elementScale) / 2,
          width: w,
          height: h,
          text: 'Entity',
          fontSize: 16
        }
        addElement(newElement)
        setTool('select')
      } else if (tool === 'attribute') {
        const w = 100, h = 50
        const newElement = {
          type: 'attribute',
          x: x - (w * elementScale) / 2,
          y: y - (h * elementScale) / 2,
          width: w,
          height: h,
          text: 'Attribute',
          isKey: false,
          fontSize: 16
        }
        addElement(newElement)
        setTool('select')
      } else if (tool === 'keyAttribute') {
        const w = 100, h = 50
        const newElement = {
          type: 'attribute',
          x: x - (w * elementScale) / 2,
          y: y - (h * elementScale) / 2,
          width: w,
          height: h,
          text: 'Attribute',
          isKey: true,
          fontSize: 16
        }
        addElement(newElement)
        setTool('select')
      } else if (tool === 'relationship') {
        const w = 120, h = 80
        const newElement = {
          type: 'relationship',
          x: x - (w * elementScale) / 2,
          y: y - (h * elementScale) / 2,
          width: w,
          height: h,
          text: 'Relationship',
          fontSize: 16
        }
        addElement(newElement)
        setTool('select')
      } else if (tool === 'select') {
        if (!justFinishedMarquee.current) {
          setSelectedElements([])
        }
      }
    }
  }

  const handleElementMouseDown = (e, element) => {
    e.stopPropagation()

    if (tool === 'select' && !spacePressed) {
      // If the element is not already selected, select only it
      if (!selectedElements.includes(element.id)) {
        setSelectedElements([element.id])
      }
      // If already selected (part of multi-select), keep selection as-is for multi-drag
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
        setSelectedElements([element.id])
      } else {
        // Clicked same element - cancel
        setConnectingFrom(null)
        setTempConnection(null)
      }
    } else {
      setSelectedElements([element.id])
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
    } else if (selectionRect) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom
      setSelectionRect(prev => ({ ...prev, endX: x, endY: y }))
    } else if (draggingElement && !draggingConnection) {
      const rect = e.currentTarget.getBoundingClientRect()
      const newX = (e.clientX - rect.left) / zoom
      const newY = (e.clientY - rect.top) / zoom

      const deltaX = (newX - dragOffset.x) - draggingElement.x
      const deltaY = (newY - dragOffset.y) - draggingElement.y

      // Move all selected elements together
      if (selectedElements.includes(draggingElement.id) && selectedElements.length > 1) {
        const updates = selectedElements
          .map(id => {
            const el = scaledElements.find(e => e.id === id)
            if (!el) return null
            return { id, changes: { x: el.x + deltaX, y: el.y + deltaY } }
          })
          .filter(Boolean)
        updateElements(updates)
      } else {
        updateElement(draggingElement.id, {
          x: newX - dragOffset.x,
          y: newY - dragOffset.y
        })
      }

      // Update draggingElement reference for next delta calculation
      setDraggingElement(prev => ({
        ...prev,
        x: newX - dragOffset.x,
        y: newY - dragOffset.y
      }))
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

    // Rule 2: Attributes can only connect to entities
    if (fromElement.type === 'attribute' && toElement.type !== 'entity') {
      alert('⚠️ Invalid Connection\n\nAttributes can only connect to entities.')
      return false
    }

    if (toElement.type === 'attribute' && fromElement.type !== 'entity') {
      alert('⚠️ Invalid Connection\n\nAttributes can only connect to entities.')
      return false
    }

    // Rule 3: Relationships can only connect to entities
    if (fromElement.type === 'relationship' && toElement.type !== 'entity') {
      alert('⚠️ Invalid Connection\n\nRelationships can only connect to entities.')
      return false
    }

    if (toElement.type === 'relationship' && fromElement.type !== 'entity') {
      alert('⚠️ Invalid Connection\n\nRelationships can only connect to entities.')
      return false
    }

    return true
  }

  const handleMouseUp = (e) => {
    if (selectionRect) {
      // Compute bounding box of selection rectangle
      const x1 = Math.min(selectionRect.startX, selectionRect.endX)
      const y1 = Math.min(selectionRect.startY, selectionRect.endY)
      const x2 = Math.max(selectionRect.startX, selectionRect.endX)
      const y2 = Math.max(selectionRect.startY, selectionRect.endY)

      // Only select if the rectangle is non-trivial (more than 5px drag)
      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const selected = scaledElements
          .filter(el => {
            const elRight = el.x + el.width
            const elBottom = el.y + el.height
            // Element overlaps with selection rectangle
            return el.x < x2 && elRight > x1 && el.y < y2 && elBottom > y1
          })
          .map(el => el.id)
        setSelectedElements(selected)
        justFinishedMarquee.current = true
        requestAnimationFrame(() => { justFinishedMarquee.current = false })
      }
      setSelectionRect(null)
      return
    }
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

  const measureTextWidth = (text, fontSize = 16) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `500 ${fontSize}px sans-serif`
    return ctx.measureText(text).width
  }

  const handleTextChange = (element, newText) => {
    const fontSize = element.fontSize || 16
    const textWidth = measureTextWidth(newText, fontSize)

    // Minimum rendered width needed per element type
    let neededRenderedWidth
    if (element.type === 'entity') {
      neededRenderedWidth = textWidth + 32
    } else if (element.type === 'attribute') {
      // Oval shape: text needs ~1.5x width to fit inside ellipse
      neededRenderedWidth = textWidth * 1.5 + 16
    } else if (element.type === 'relationship') {
      neededRenderedWidth = textWidth + 60
    } else {
      neededRenderedWidth = textWidth + 32
    }

    // Convert to base width (before elementScale)
    const neededBaseWidth = neededRenderedWidth / elementScale

    // Default minimum widths per type
    const defaultMin = { entity: 120, attribute: 100, relationship: 120 }
    const minWidth = defaultMin[element.type] || 100

    const newBaseWidth = Math.max(minWidth, neededBaseWidth)

    updateElement(element.id, { text: newText, width: newBaseWidth })
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
          const fromEl = scaledElements.find(el => el.id === conn.from)
          const toEl = scaledElements.find(el => el.id === conn.to)
          if (!fromEl || !toEl) return null

          const from = getElementCenter(fromEl)
          const to = getElementCenter(toEl)

          return (
            <Connection
              key={conn.id}
              connection={conn}
              from={from}
              to={to}
              fromType={fromEl.type}
              toType={toEl.type}
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
        {scaledElements.map(element => {
          const isSelected = selectedElements.includes(element.id)
          const isHovered = hoveredElement?.id === element.id
          const singleSelected = selectedElements.length === 1 && isSelected
          const showHandles = (singleSelected || isHovered) && tool === 'select'

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

      {selectionRect && (
        <div
          className="selection-rect"
          style={{
            left: Math.min(selectionRect.startX, selectionRect.endX),
            top: Math.min(selectionRect.startY, selectionRect.endY),
            width: Math.abs(selectionRect.endX - selectionRect.startX),
            height: Math.abs(selectionRect.endY - selectionRect.startY)
          }}
        />
      )}
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
          connection={connections.find(c => c.id === editingConnection.id) || editingConnection}
          updateConnection={updateConnection}
          deleteConnection={deleteConnection}
          onClose={() => setEditingConnection(null)}
        />
      )}

      <div className="size-slider-container">
        <label>Zoom</label>
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        />
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
