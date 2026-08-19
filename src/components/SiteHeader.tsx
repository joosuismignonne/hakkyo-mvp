import { useEffect, useState } from 'react'

function LanguagePicker() {
  function choose(code: 'ko' | 'en' | 'fr') {
    if (code === 'ko') {
      for (const domain of ['', location.hostname, `.${location.hostname}`])
        document.cookie = `googtrans=;path=/;max-age=0${domain ? `;domain=${domain}` : ''}`
    } else {
      document.cookie = `googtrans=/ko/${code};path=/`
      document.cookie = `googtrans=/ko/${code};path=/;domain=${location.hostname}`
    }
    location.reload()
  }
  return (
    <div className="language-picker notranslate" translate="no" aria-label="언어 선택">
      <button onClick={() => choose('ko')}>한국어</button>
      <button onClick={() => choose('fr')}>FRANÇAIS</button>
      <button onClick={() => choose('en')}>ENGLISH</button>
      <div id="google_translate_element" />
    </div>
  )
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const w = window as any
    w.googleTranslateElementInit = () =>
      new w.google.translate.TranslateElement(
        { pageLanguage: 'ko', includedLanguages: 'ko,en,fr', autoDisplay: false },
        'google_translate_element'
      )
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    } else if (w.google?.translate) {
      w.googleTranslateElementInit()
    }
  }, [])

  return (
    <header className="header" style={{ display: 'flex', alignItems: 'center' }}>
      <a className="logo" href="/">
        HAKKYO<span>MTL</span>
      </a>
      <button className="menu" onClick={() => setOpen(!open)} aria-expanded={open}>
        MENU
      </button>
      <nav className={open ? 'nav open' : 'nav'} style={{ marginLeft: 'auto', display: 'flex' }}>
        <a href="/programs">프로그램</a>
        <a href="/activities">Mini</a>
        <a href="/school">우리 이야기</a>
        <a href="/gallery">갤러리</a>
        <a href="/settling">몬트리올 정착</a>
        <a href="/board">소식</a>
        <a href="/qna">Q&amp;A</a>
        <LanguagePicker />
      </nav>
    </header>
  )
}
