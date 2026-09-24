// Rspress publishes its type entry as ESM; this package follows the CJS format
// used by the existing buyfakett Rspress plugins.
// @ts-ignore
import type { RspressPlugin } from '@rspress/core';
import path from 'node:path';

/** Register the AISummary component globally in Rspress MDX pages. */
export function pluginAISummary(): RspressPlugin {
    return {
        name: 'rspress-plugin-ai-summary',
        markdown: {
            globalComponents: [
                path.join(__dirname, 'components', 'AISummary.js'),
            ],
        },
    };
}

export default pluginAISummary;
