import React, { useRef, useState } from 'react'
import { Upload, X, File } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useTranslation } from 'react-i18next'

export default function FileUpload({
  label,
  accept,
  multiple = false,
  onChange,
  error,
  maxSizeMB = 5,
  className,
}) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState([])

  const handleFiles = (fileList) => {
    const selected = Array.from(fileList)
    const valid = selected.filter((f) => f.size <= maxSizeMB * 1024 * 1024)
    setFiles(multiple ? [...files, ...valid] : valid)
    onChange?.(multiple ? [...files, ...valid] : valid[0])
  }

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onChange?.(multiple ? updated : updated[0])
  }

  return (
    <div className={cn('form-group', className)}>
      {label && <label className="label">{label}</label>}

      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Drag and drop or <span className="text-primary-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Max {maxSizeMB}MB per file</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{file.name}</span>
              <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)}KB</span>
              <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  )
}
