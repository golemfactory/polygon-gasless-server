import logger from 'https://deno.land/x/oak_logger/mod.ts';
import webapps, { Application } from './webapps.ts';

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

await app.listen({ port: 8000 });
