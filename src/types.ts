export interface AISummaryPluginOptions {
    /**
     * Delay before the first character appears, in milliseconds.
     *
     * `true` uses a delay based on the summary length, a number uses a fixed
     * delay, and `false` disables the initial delay.
     *
     * @default true
     */
    firstCharDelay?: boolean | number;
}
