import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const UI_SELECTORS = '.size-slider-container, .connection-hint, .connection-config-panel, .connection-edit-panel, .connection-handle, .selection-rect'

export const exportToPNG = async (canvasElement, options = {}) => {
  const { scale = 2, elements = [], elementScale = 1 } = options

  if (!canvasElement) {
    alert('Canvas not found')
    return
  }

  let originalTransform, originalTransition, originalOverflow

  let selectedEls = []
  let relationshipPolygons = []
  let originalStrokes = []
  let originalStrokeWidths = []

  const restore = () => {
    const wrapper = canvasElement.querySelector('.canvas-zoom-wrapper')
    if (wrapper) {
      wrapper.style.transform = originalTransform ?? ''
      wrapper.style.transition = originalTransition ?? ''
    }
    canvasElement.style.overflow = originalOverflow ?? ''
    canvasElement.querySelectorAll(UI_SELECTORS).forEach(el => el.style.display = '')
    // Restore selection styling
    selectedEls.forEach(el => el.classList.add('selected'))
    relationshipPolygons.forEach((poly, i) => {
      poly.setAttribute('stroke', originalStrokes[i])
      poly.setAttribute('stroke-width', originalStrokeWidths[i])
    })
  }

  try {
    // Hide UI overlays and selection artifacts
    canvasElement.querySelectorAll(UI_SELECTORS).forEach(el => el.style.display = 'none')

    // Temporarily remove selection styling so exported image has all black borders
    selectedEls = canvasElement.querySelectorAll('.element.selected')
    selectedEls.forEach(el => el.classList.remove('selected'))
    // Reset relationship SVG strokes that were blue due to selection
    relationshipPolygons = canvasElement.querySelectorAll('.element.relationship polygon')
    relationshipPolygons.forEach(poly => {
      originalStrokes.push(poly.getAttribute('stroke'))
      originalStrokeWidths.push(poly.getAttribute('stroke-width'))
      poly.setAttribute('stroke', '#333')
      poly.setAttribute('stroke-width', '2')
    })

    // Get the zoom wrapper and temporarily reset zoom
    const wrapper = canvasElement.querySelector('.canvas-zoom-wrapper')
    if (!wrapper) {
      restore()
      alert('Canvas structure not found')
      return
    }

    originalTransform = wrapper.style.transform
    originalTransition = wrapper.style.transition
    originalOverflow = canvasElement.style.overflow

    wrapper.style.transform = 'scale(1)'
    wrapper.style.transition = 'none'
    canvasElement.style.overflow = 'visible'

    // Calculate bounding box of all elements to crop the output
    const padding = 40
    let cropOptions = {}

    if (elements.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      elements.forEach(el => {
        const w = el.width * elementScale
        const h = el.height * elementScale
        minX = Math.min(minX, el.x)
        minY = Math.min(minY, el.y)
        maxX = Math.max(maxX, el.x + w)
        maxY = Math.max(maxY, el.y + h)
      })
      const rawX = minX - padding
      const rawY = minY - padding
      cropOptions = {
        x: Math.max(0, rawX),
        y: Math.max(0, rawY),
        width: (maxX - minX) + padding * 2 - Math.max(0, -rawX),
        height: (maxY - minY) + padding * 2 - Math.max(0, -rawY)
      }
    }

    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#ffffff',
      scale,
      logging: false,
      ...cropOptions
    })

    restore()

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to generate PNG image')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `er-diagram-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  } catch (error) {
    restore()
    alert('Error exporting to PNG: ' + error.message)
  }
}

export const exportToPDF = async (canvasElement) => {
  if (!canvasElement) {
    alert('Canvas not found')
    return
  }

  // Temporarily remove selection styling
  const selectedEls = canvasElement.querySelectorAll('.element.selected')
  selectedEls.forEach(el => el.classList.remove('selected'))
  const relationshipPolygons = canvasElement.querySelectorAll('.element.relationship polygon')
  const origStrokes = []
  const origStrokeWidths = []
  relationshipPolygons.forEach(poly => {
    origStrokes.push(poly.getAttribute('stroke'))
    origStrokeWidths.push(poly.getAttribute('stroke-width'))
    poly.setAttribute('stroke', '#333')
    poly.setAttribute('stroke-width', '2')
  })

  const restorePdf = () => {
    selectedEls.forEach(el => el.classList.add('selected'))
    relationshipPolygons.forEach((poly, i) => {
      poly.setAttribute('stroke', origStrokes[i])
      poly.setAttribute('stroke-width', origStrokeWidths[i])
    })
  }

  try {
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    })

    restorePdf()

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`er-diagram-${Date.now()}.pdf`)
  } catch (error) {
    restorePdf()
    alert('Error exporting to PDF: ' + error.message)
  }
}
