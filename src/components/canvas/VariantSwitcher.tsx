import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { padIndex, type VariantOption } from '@/lib/variants'

/** "01 / 03 ⌄" — matches the variant switcher in the canvas concepts. */
export function VariantSwitcher({
  options,
  value,
  onChange,
  className,
  align = 'start',
}: {
  options: VariantOption[]
  value: string
  onChange: (id: string) => void
  className?: string
  align?: 'start' | 'end'
}) {
  const current = options.find((o) => o.id === value) ?? options[0]
  if (!current || options.length < 2) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'nodrag flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] tabular-nums text-frame-label outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand',
          className,
        )}
        aria-label={`Variant ${padIndex(current.index)} of ${options.length}: ${current.name}`}
      >
        {padIndex(current.index)} / {padIndex(options.length - 1)}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onSelect={() => onChange(option.id)}
            className="gap-3"
          >
            <span className="w-5 tabular-nums text-muted-foreground">
              {padIndex(option.index)}
            </span>
            <span className="flex-1">{option.name}</span>
            {option.id === current.id && <Check className="size-4 text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
