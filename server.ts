import { Application, log } from './deps.ts';

await log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler('DEBUG', { formatter: '{levelName} - {msg}' }),
    },
    loggers: {
        default: { level: 'INFO', handlers: ['console'] },
        webapps: { level: 'DEBUG', handlers: ['console'] },
        sci: { level: 'DEBUG', handlers: ['console'] },
    },
});
log.info('started');
if (localStorage.length > 0) {
    log.info(`${localStorage.length} keys stored`);
}

import logger from 'https://deno.land/x/oak_logger/mod.ts';
import webapps from './webapps.ts';
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
