import { useState } from 'react'
import './Element.css'

function Attribute({ element, isSelected, onMouseDown, onClick, onTextChange }) {
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

  return (
    <div
      className={`element attribute ${isSelected ? 'selected' : ''} ${element.isKey ? 'key' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
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
        />
      ) : (
        <span className={`element-text ${element.isKey ? 'underline' : ''}`}>
          {element.text}
        </span>
      )}
    </div>
  )
}

export default Attribute
