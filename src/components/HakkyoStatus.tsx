export default function Status({ children = 'UPCOMING' }: { children?: React.ReactNode }) {
  return (
    <span className="status">
      <i /> {children}
    </span>
  )
}

export function Arrow() {
  return <span aria-hidden="true">↗</span>
}
