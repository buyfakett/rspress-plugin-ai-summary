// Rspress publishes its type entry as ESM; this package follows the CJS format
// used by the existing buyfakett Rspress plugins.
// @ts-ignore
import type { RspressPlugin } from '@rspress/core';
import path from 'node:path';
import type { AISummaryPluginOptions } from './types';

export type { AISummaryPluginOptions } from './types';

const RUNTIME_OPTIONS_KEY = '__RSPRESS_AI_SUMMARY_OPTIONS__';

/** Register the AISummary component globally in Rspress MDX pages. */
export function pluginAISummary(
    options: AISummaryPluginOptions = {},
): RspressPlugin {
    const configuredFirstCharDelay = options.firstCharDelay;
    const firstCharDelay = typeof configuredFirstCharDelay === 'number'
        && Number.isFinite(configuredFirstCharDelay)
        ? Math.max(0, configuredFirstCharDelay)
        : typeof configuredFirstCharDelay === 'boolean'
            ? configuredFirstCharDelay
            : true;

    return {
        name: 'rspress-plugin-ai-summary',
        markdown: {
            globalComponents: [
                path.join(__dirname, 'components', 'AISummary.js'),
            ],
        },
        builderConfig: {
            source: {
                define: {
                    [RUNTIME_OPTIONS_KEY]: JSON.stringify({firstCharDelay}),
                },
            },
        },
    };
}

export default pluginAISummary;
