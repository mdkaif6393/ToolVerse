# PDF Merge Tool

A complete PDF merging tool with both backend API and frontend interface.

## 📁 Structure

```
merge-tool/
├── backend/
│   └── index.js          # Express.js backend API
├── frontend/
│   └── MergeTool.tsx     # React frontend component
├── package.json          # Tool configuration and dependencies
└── README.md            # This file
```

## 🚀 Features

- **Multiple PDF Upload**: Support for up to 10 PDF files
- **Drag & Drop Interface**: Easy file selection
- **File Validation**: Automatic PDF format validation
- **Progress Tracking**: Real-time merge progress
- **Automatic Download**: Merged PDF auto-download
- **Error Handling**: Comprehensive error management
- **Responsive Design**: Works on all devices

## 🛠️ Backend API

### Endpoints

- `POST /merge` - Merge multiple PDF files
- `GET /info` - Get tool information
- `GET /health` - Health check

### Usage

```javascript
// Merge PDFs
const formData = new FormData();
files.forEach(file => formData.append('files', file));

const response = await fetch('/api/tools/merge-tool/merge', {
  method: 'POST',
  body: formData
});
```

## 🎨 Frontend Component

### Props

```typescript
interface MergeToolProps {
  onClose?: () => void;  // Optional close callback
}
```

### Usage

```jsx
import MergeTool from './frontend/MergeTool';

function App() {
  return (
    <MergeTool onClose={() => console.log('Tool closed')} />
  );
}
```

## 📦 Dependencies

### Backend
- `express` - Web framework
- `multer` - File upload handling
- `pdf-lib` - PDF manipulation

### Frontend
- `react` - UI framework
- `lucide-react` - Icons
- Custom UI components

## 🔧 Configuration

Tool configuration is stored in `package.json` under `toolConfig`:

```json
{
  "toolConfig": {
    "name": "PDF Merger",
    "category": "PDF Tools",
    "maxFiles": 10,
    "maxFileSize": "50MB",
    "supportedFormats": ["application/pdf"]
  }
}
```

## 🚦 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "PDF files merged successfully",
  "fileSize": 1234567,
  "pageCount": 25
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## 🔒 Security Features

- File type validation
- File size limits
- Rate limiting
- Input sanitization
- Temporary file cleanup

## 📊 Monitoring

- Audit logging for all operations
- Performance metrics
- Error tracking
- Usage statistics

## 🧪 Testing

```bash
npm test
```

## 🚀 Deployment

1. Install dependencies: `npm install`
2. Start server: `npm start`
3. For development: `npm run dev`

## 📝 License

MIT License - see LICENSE file for details.
