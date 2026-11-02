import { defineBoard } from '@/runtime'

/** Three takes on the Today list side by side, then where it leads. */
export default defineBoard({
  name: 'Home explorations',
  description: 'Three takes on how the Today list arrives.',
  frames: [
    { url: '/orbit/today', label: 'Today · Default' },
    { url: '/orbit/today?v=today:soft-spring', label: 'Today · Soft spring' },
    { url: '/orbit/today?v=today:quick-fade', label: 'Today · Quick fade' },
    { url: '/orbit/today/detail?task=sprint' },
    { url: '/orbit/me' },
  ],
})
