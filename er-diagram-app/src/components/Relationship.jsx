import { useState } from 'react'
import './Element.css'

function Relationship({ element, isSelected, onMouseDown, onClick, onTextChange }) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(element.text)

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onTextChange(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
    }
  }

  const centerX = element.width / 2
  const centerY = element.height / 2

  return (
    <div
      className={`element relationship ${isSelected ? 'selected' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        background: 'transparent',
        border: 'none'
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        width={element.width}
        height={element.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <polygon
          points={`${centerX},0 ${element.width},${centerY} ${centerX},${element.height} 0,${centerY}`}
          fill="white"
          stroke={isSelected ? '#2196F3' : '#333'}
          strokeWidth={isSelected ? '3' : '2'}
          style={{ pointerEvents: 'all' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: isEditing ? 'all' : 'none'
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="element-input"
            style={{ pointerEvents: 'all' }}
          />
        ) : (
          <span className="element-text" style={{ pointerEvents: 'none' }}>
            {element.text}
          </span>
        )}
      </div>
    </div>
  )
}

export default Relationship
