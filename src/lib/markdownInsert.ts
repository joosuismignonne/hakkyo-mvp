export function imageMarkdown(url: string): string {
  return `![image](${url})`
}

export type TextSelection = { start: number; end: number }

export function insertAtSelection(
  text: string,
  snippet: string,
  selection: TextSelection | null,
): { value: string; selectionStart: number; selectionEnd: number } {
  const start = selection?.start ?? text.length
  const end = selection?.end ?? start
  const value = text.slice(0, start) + snippet + text.slice(end)
  const pos = start + snippet.length
  return { value, selectionStart: pos, selectionEnd: pos }
}
