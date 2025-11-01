/**
 * Monaco Editor Component
 * Lightweight code editor for AI Code Feature V2
 */

'use client'

import { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface MonacoEditorProps {
  files: Array<{ path: string; content: string; type: string }>
  activeFile?: string
  onFileChange?: (path: string, content: string) => void
  onActiveFileChange?: (path: string) => void
  readOnly?: boolean
  height?: string
}

export default function MonacoEditor({
  files,
  activeFile,
  onFileChange,
  onActiveFileChange,
  readOnly = false,
  height = '600px'
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const currentFile = files.find(f => f.path === activeFile) || files[0]

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure editor
    editor.updateOptions({
      minimap: { enabled: files.length > 1 },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly,
      automaticLayout: true
    })

    // Setup keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save file (could trigger onFileChange)
      const content = editor.getValue()
      if (currentFile && onFileChange) {
        onFileChange(currentFile.path, content)
      }
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && currentFile && onFileChange) {
      onFileChange(currentFile.path, value)
    }
  }

  // Get language from file type
  const getLanguage = (type: string): string => {
    switch (type) {
      case 'typescript':
      case 'tsx':
        return 'typescript'
      case 'javascript':
      case 'jsx':
        return 'javascript'
      case 'css':
        return 'css'
      case 'json':
        return 'json'
      case 'html':
        return 'html'
      default:
        return 'plaintext'
    }
  }

  const language = currentFile ? getLanguage(currentFile.type) : 'typescript'

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* File tabs */}
      {files.length > 1 && (
        <div className="flex border-b border-gray-700 bg-gray-800">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => onActiveFileChange?.(file.path)}
              className={`
                px-4 py-2 text-sm font-medium transition-colors
                ${activeFile === file.path
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
            >
              {file.path.split('/').pop()}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1" style={{ height }}>
        <Editor
          height="100%"
          language={language}
          value={currentFile?.content || ''}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            readOnly,
            minimap: { enabled: files.length > 1 },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{currentFile?.path || 'No file selected'}</span>
          <span className="capitalize">{language}</span>
        </div>
        <div className="flex items-center gap-4">
          {readOnly && (
            <span className="text-yellow-500">Read-only</span>
          )}
          <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
