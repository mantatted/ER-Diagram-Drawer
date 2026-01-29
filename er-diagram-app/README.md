# HKDSE ER Diagram Drawer

A web-based tool for designing Entity-Relationship (ER) diagrams following the HKDSE ICT C&A Guide standards.

## Features

- **HKDSE Standard Compliant**: Follows the official HKDSE ICT C&A Guide for ER diagram notation
- **Interactive Drawing**: Click to add elements, drag to move, double-click to edit text
- **Full ER Support**:
  - Entities (Rectangle)
  - Attributes (Oval)
  - Key Attributes (Underlined Oval)
  - Relationships (Diamond)
  - Connections with cardinality (1, M, N)
  - Participation constraints (Mandatory |, Optional ○)
- **Save/Load**: Save your diagrams as JSON files and load them later
- **Export**: Export diagrams to PNG or PDF format
- **Responsive Design**: Works on desktop and tablet devices

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

### Creating Elements

1. **Select a Tool**: Click on a tool button in the toolbar (Entity, Attribute, Key Attribute, Relationship)
2. **Place Element**: Click on the canvas where you want to place the element
3. **Edit Text**: Double-click on any element to edit its text

### Connecting Elements

1. **Select Connection Tool**: Click the "Connection" button in the toolbar
2. **Click First Element**: Click on the element you want to connect from
3. **Click Second Element**: Click on the element you want to connect to
4. **Configure Connection**: Click on the connection line to configure:
   - Cardinality (1, M, N) for both ends
   - Participation constraints (Mandatory or Optional) for both ends

### Moving Elements

1. **Select Tool**: Click the "Select" button in the toolbar
2. **Drag Element**: Click and drag any element to move it
3. **Delete Element**: Select an element and click the "Delete" button in the toolbar

### Saving and Loading

- **Save**: Click the "💾 Save" button to download your diagram as a JSON file
- **Load**: Click the "📁 Load" button to load a previously saved diagram
- **Clear**: Click the "🗑️ Clear" button to clear the entire canvas

### Exporting

- **PNG**: Click the "🖼️ PNG" button to export your diagram as a PNG image
- **PDF**: Click the "📄 PDF" button to export your diagram as a PDF document

## HKDSE ER Diagram Standards

This tool implements the ER diagram notation specified in the HKDSE ICT C&A Guide:

| Element | Symbol | Description |
|---------|--------|-------------|
| Entity | Rectangle | Represents an entity type |
| Attribute | Oval | Represents an attribute |
| Key Attribute | Underlined Oval | Represents a key/primary attribute |
| Relationship | Diamond | Represents a relationship between entities |
| Cardinality | 1, M, N | Indicates one-to-one, one-to-many, or many-to-many relationships |
| Mandatory Participation | \| (vertical line) | Entity must participate in relationship |
| Optional Participation | ○ (circle) | Entity may or may not participate in relationship |

## Keyboard Shortcuts

- **Double-click** on any element to edit its text
- **Click** on a connection line to configure its properties
- **Drag** elements to reposition them

## Technologies Used

- **React**: Frontend framework
- **Vite**: Build tool and development server
- **html2canvas**: Canvas rendering for image export
- **jsPDF**: PDF generation

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Tips for Students

1. **Plan First**: Sketch your ER diagram on paper before using the tool
2. **Use Meaningful Names**: Name your entities, attributes, and relationships clearly
3. **Check Cardinality**: Verify that your cardinality and participation constraints match the problem requirements
4. **Save Frequently**: Use the Save button to backup your work regularly
5. **Export Before Submission**: Export your diagram to PNG or PDF for assignment submission

## License

MIT License

## Support

For issues or questions, please refer to the HKDSE ICT C&A Guide or consult your ICT instructor.
