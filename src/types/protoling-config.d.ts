declare module 'virtual:protoling/config' {
  const config: {
    /** "full": everything. "share": only the prototypes, for clients. */
    mode: 'full' | 'share'
    /** Projects mounted as mini apps. */
    projects: string[]
    /** Where `/` and unknown URLs go in a share build. */
    start: string
  }
  export default config
}
