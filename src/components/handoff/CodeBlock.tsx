import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { HighlighterCore } from 'shiki/core'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Lang = 'tsx' | 'swift' | 'kotlin'

let highlighter: Promise<HighlighterCore> | null = null

/** Loads Shiki once, with only the three languages and two themes we show. */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
      await Promise.all([import('shiki/core'), import('shiki/engine/javascript')])
    return createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark'),
      ],
      langs: [
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/swift'),
        import('@shikijs/langs/kotlin'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighter
}

export function CodeBlock({
  code,
  lang,
  className,
}: {
  code: string
  lang: Lang
  className?: string
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((h) => {
      if (cancelled) return
      setHtml(
        h.codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        }),
      )
    })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn('group relative rounded-lg border bg-muted/40', className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1.5 z-10 bg-background/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={copy}
        aria-label="Copy code"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
      {html ? (
        <div
          className="pl-code overflow-x-auto p-3 text-[12px] leading-[1.55]"
          // Shiki output is generated from our own strings, not user HTML.
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted highlighter output
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-[1.55]">
          {code}
        </pre>
      )}
    </div>
  )
}
