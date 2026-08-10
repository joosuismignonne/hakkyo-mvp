import { useEffect, useState } from 'react'

export default function SiteDetails() {
  const [cursor, setCursor] = useState({ x: -40, y: -40 })
  const [scroll, setScroll] = useState(0)
  const [cursorLabel, setCursorLabel] = useState('HI')

  useEffect(() => {
    document.body.classList.add('has-custom-cursor')
    const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    const progress = () =>
      setScroll(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight))
    window.addEventListener('mousemove', move)
    window.addEventListener('scroll', progress, { passive: true })
    progress()
    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('scroll', progress)
    }
  }, [])

  useEffect(() => {
    const over = (e: Event) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>('a,button,input,select,textarea,[data-cursor]')
      setCursorLabel(
        target?.dataset.cursor ||
        (target?.matches('input,select,textarea') ? 'TYPE' : target ? 'OPEN' : 'HI')
      )
    }
    document.addEventListener('pointerover', over)
    return () => document.removeEventListener('pointerover', over)
  }, [])

  return (
    <>
      <div
        className={`custom-cursor ${cursorLabel !== 'HI' ? 'is-hovering' : ''}`}
        style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        aria-hidden="true"
      >
        <i />
        <span>{cursorLabel}</span>
      </div>
      <div
        className="cat-scroll"
        style={{ top: `calc(90px + ${scroll} * (100vh - 170px))` }}
        aria-hidden="true"
      >
        <img src="/mascot/mimi-poster-v3.png" alt="" />
      </div>
    </>
  )
}
