import { useEffect, useState } from 'react'

export default function SiteDetails() {
  const [cursor, setCursor] = useState({ x: -60, y: -60 })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    document.body.classList.add('has-custom-cursor')
    const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', move)
    }
  }, [])

  useEffect(() => {
    const over = (e: Event) => {
      const t = (e.target as HTMLElement)?.closest<HTMLElement>('a,button,input,select,textarea,[data-cursor]')
      setHovering(!!t)
    }
    document.addEventListener('pointerover', over)
    return () => document.removeEventListener('pointerover', over)
  }, [])

  return (
    <div
      className={`custom-cursor${hovering ? ' is-hovering' : ''}`}
      style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
      aria-hidden="true"
    />
  )
}
