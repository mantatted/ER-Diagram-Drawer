import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const exportToPNG = async (canvasElement) => {
  if (!canvasElement) {
    alert('Canvas not found')
    return
  }

  try {
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    })

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `er-diagram-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  } catch (error) {
    alert('Error exporting to PNG: ' + error.message)
  }
}

export const exportToPDF = async (canvasElement) => {
  if (!canvasElement) {
    alert('Canvas not found')
    return
  }

  try {
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`er-diagram-${Date.now()}.pdf`)
  } catch (error) {
    alert('Error exporting to PDF: ' + error.message)
  }
}
