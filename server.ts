import logger from 'https://deno.land/x/oak_logger/mod.ts';
import webapps, { Application } from './webapps.ts';
import { log } from './deps.ts';

log.setup({
    loggers: {
        default: { level: 'INFO' },
        'webapps::forward': { level: 'INFO' },
        'sci': { level: 'DEBUG' },
    },
});

import * as config from './config.ts';

const app = new Application()
    .use(logger.logger)
    .use(logger.responseTime)
    .use(webapps.routes());

app.addEventListener('listen', ({ hostname, port, secure }) => {
    console.log(
        `Listening on: ${secure ? 'https://' : 'http://'}${
            hostname ??
                'localhost'
        }:${port}`,
    );
});

await app.listen({ port: config.port });
