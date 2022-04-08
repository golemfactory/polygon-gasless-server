import logger from 'https://deno.land/x/oak_logger/mod.ts';
import webapps, { Application } from './webapps.ts';

await new Application()
    .use(logger.logger)
    .use(logger.responseTime)
    .use(webapps.routes())
    .listen({ port: 8000 });
