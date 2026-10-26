const DEFAULT_FIRST_CHAR_DELAY_BASE = 240;
const DEFAULT_FIRST_CHAR_DELAY_PER_CHARACTER = 4;
const DEFAULT_FIRST_CHAR_DELAY_MAX = 900;
const TYPING_DURATION_MIN = 1600;
const TYPING_DURATION_MAX = 6000;
const TYPING_DURATION_PER_CHARACTER = 11;

export function getFirstCharDelay(
    firstCharDelay: boolean | number | undefined,
    totalLength: number,
): number {
    if (firstCharDelay === false) {
        return 0;
    }

    if (typeof firstCharDelay === 'number') {
        return Number.isFinite(firstCharDelay)
            ? Math.max(0, firstCharDelay)
            : 0;
    }

    return Math.min(
        DEFAULT_FIRST_CHAR_DELAY_MAX,
        DEFAULT_FIRST_CHAR_DELAY_BASE
            + totalLength * DEFAULT_FIRST_CHAR_DELAY_PER_CHARACTER,
    );
}

export function getTypingDuration(totalLength: number): number {
    return Math.min(
        TYPING_DURATION_MAX,
        Math.max(
            TYPING_DURATION_MIN,
            totalLength * TYPING_DURATION_PER_CHARACTER,
        ),
    );
}
