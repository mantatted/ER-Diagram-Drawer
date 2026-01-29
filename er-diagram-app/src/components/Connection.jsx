import { useState } from 'react'
import './Connection.css'

function Connection({ connection, from, to, updateConnection, deleteConnection, onClick, isSelected }) {
  const [isHovered, setIsHovered] = useState(false)

  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2

  const handleLineClick = (e) => {
    e.stopPropagation()
    onClick()
  }

  const updateCardinality = (value) => {
    updateConnection(connection.id, {
      cardinality: value
    })
  }

  const updateParticipation = (value) => {
    updateConnection(connection.id, {
      participation: value
    })
  }

  // Calculate offset for labels
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const unitX = dx / length
  const unitY = dy / length
  const normalX = -unitY
  const normalY = unitX

  const labelOffset = 20 // Distance from center to cardinality label

  // Get cardinality and participation with backward compatibility
  const cardinality = typeof connection.cardinality === 'object'
    ? connection.cardinality.from || '1'
    : connection.cardinality || '1'

  const participation = typeof connection.participation === 'object'
    ? connection.participation.from || 'mandatory'
    : connection.participation || 'mandatory'

  return (
    <g>
      {/* Connection line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isSelected ? '#667eea' : (isHovered ? '#2196F3' : '#333')}
        strokeWidth={isSelected ? '4' : (isHovered ? '3' : '2')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleLineClick}
        style={{ cursor: 'pointer' }}
      />

      {/* Participation constraint at CENTER */}
      {participation === 'mandatory' ? (
        <line
          x1={midX + normalX * 10}
          y1={midY + normalY * 10}
          x2={midX - normalX * 10}
          y2={midY - normalY * 10}
          stroke="#333"
          strokeWidth="4"
        />
      ) : (
        <circle
          cx={midX}
          cy={midY}
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="3"
        />
      )}

      {/* Cardinality label */}
      <text
        x={midX + normalX * labelOffset}
        y={midY + normalY * labelOffset}
        fontSize="16"
        fontWeight="bold"
        fill="#333"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {cardinality}
      </text>

    </g>
  )
}

// Render edit panel outside SVG as a fixed panel
export function ConnectionEditPanel({ connection, updateConnection, deleteConnection, onClose }) {
  if (!connection) return null

  const cardinality = typeof connection.cardinality === 'object'
    ? connection.cardinality.from || '1'
    : connection.cardinality || '1'

  const participation = typeof connection.participation === 'object'
    ? connection.participation.from || 'mandatory'
    : connection.participation || 'mandatory'

  return (
    <div className="connection-edit-panel">
      <h4>Edit Connection</h4>

      <div className="config-section">
        <label>Participation (Center)</label>
        <div className="button-group">
          <button
            className={participation === 'mandatory' ? 'active' : ''}
            onClick={() => updateConnection(connection.id, { participation: 'mandatory' })}
          >
            ─|─ Mandatory
          </button>
          <button
            className={participation === 'optional' ? 'active' : ''}
            onClick={() => updateConnection(connection.id, { participation: 'optional' })}
          >
            ─○─ Optional
          </button>
        </div>
      </div>

      <div className="config-section">
        <label>Cardinality</label>
        <div className="button-group cardinality-group">
          <button
            className={cardinality === '1' ? 'active' : ''}
            onClick={() => updateConnection(connection.id, { cardinality: '1' })}
          >
            1
          </button>
          <button
            className={cardinality === 'M' ? 'active' : ''}
            onClick={() => updateConnection(connection.id, { cardinality: 'M' })}
          >
            M
          </button>
          <button
            className={cardinality === 'N' ? 'active' : ''}
            onClick={() => updateConnection(connection.id, { cardinality: 'N' })}
          >
            N
          </button>
        </div>
      </div>

      <div className="config-section">
        <button
          className="delete-btn"
          onClick={() => {
            deleteConnection(connection.id)
            onClose()
          }}
        >
          🗑️ Delete Connection
        </button>
      </div>

      <button className="close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  )
}

export default Connection
