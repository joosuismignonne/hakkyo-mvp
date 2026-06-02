import type { Editor } from '@tiptap/core'
import type { MutableRefObject } from 'react'
import ContentRichEditor from './ContentRichEditor'

type BodyLang = 'ko' | 'en' | 'fr'

type Props = {
  ko: string
  en: string
  fr: string
  onChange: (key: string, value: string) => void
  editorRefs: MutableRefObject<Record<BodyLang, Editor | null>>
}

function field(
  lang: BodyLang,
  label: string,
  value: string,
  key: string,
  onChange: Props['onChange'],
  editorRefs: Props['editorRefs'],
) {
  return (
    <div>
      <label className="label">{label}</label>
      <ContentRichEditor
        value={value}
        onChange={html => onChange(key, html)}
        onEditorReady={ed => { editorRefs.current[lang] = ed }}
        placeholder={`${label} article body…`}
      />
    </div>
  )
}

export default function ContentBodyRichEditors({ ko, en, fr, onChange, editorRefs }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {field('ko', 'KO', ko, 'body_ko', onChange, editorRefs)}
      {field('en', 'EN', en, 'body_en', onChange, editorRefs)}
      {field('fr', 'FR', fr, 'body_fr', onChange, editorRefs)}
    </div>
  )
}
