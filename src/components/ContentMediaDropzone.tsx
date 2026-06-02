import { useRef, useState, type DragEvent } from 'react'

type Props = {
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
}

export default function ContentMediaDropzone({ multiple = false, disabled, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function pickFiles(list: FileList | null) {
    if (!list?.length) return
    const files = Array.from(list)
    onFiles(multiple ? files : [files[0]])
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setDragOver(true)
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (disabled) return
    pickFiles(e.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      className={`rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        dragOver
          ? 'border-yellow bg-yellow/5'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={e => {
          pickFiles(e.target.files)
          e.target.value = ''
        }}
        onClick={e => e.stopPropagation()}
      />
      <p className="text-xs text-gray-500">
        {multiple
          ? 'Drag & drop images here, or click to choose files'
          : 'Drag & drop an image here, or click to choose a file'}
      </p>
      <p className="mt-1 text-[10px] text-gray-400">JPEG, PNG, GIF, WebP · uploads to content-images</p>
    </div>
  )
}
