type Props = {
  embedUrl: string
  title?: string
}

/** Responsive 16:9 embed; no autoplay, native player controls. */
export default function VideoEmbed({ embedUrl, title = 'Video' }: Props) {
  return (
    <div className="my-10 aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
      <iframe
        className="h-full w-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
