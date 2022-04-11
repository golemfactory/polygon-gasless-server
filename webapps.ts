export { Application, Context, Router, Status } from 'https://deno.land/x/oak/mod.ts';
import { Router } from 'https://deno.land/x/oak/mod.ts';

import timeService from './webapps/time-service.ts';
import forwardService from './webapps/forward.ts';

const router = new Router()
    .use(
        '/api/check-time-sync',
        timeService.routes(),
        timeService.allowedMethods(),
    )
    .use('/api/forward', forwardService.routes(), forwardService.allowedMethods())
    .get('/', (ctx) => {
        ctx.response.status = 200;
        ctx.response.body = { status: 'working' };
    });

export default router;
