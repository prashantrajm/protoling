export interface BoardFrame {
  /** App URL to show, e.g. "/orbit/today?v=today:soft-spring". */
  url: string
  /** Label above the frame. Defaults to the screen's name. */
  label?: string
}

export interface BoardDefinition {
  name: string
  description?: string
  frames: BoardFrame[]
}

/**
 * A curated board: a set of app states side by side. Put it in
 * projects/<project>/boards/<name>.ts and default-export it.
 */
export function defineBoard(board: BoardDefinition): BoardDefinition {
  return board
}
