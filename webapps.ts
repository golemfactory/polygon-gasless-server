export { Application, Router } from 'https://deno.land/x/oak/mod.ts';

import timeService from './webapps/time-service.ts';
import { Router } from 'https://deno.land/x/oak@v10.5.1/router.ts';

const router = new Router()
    .use(
        '/api/check-time-sync',
        timeService.routes(),
        timeService.allowedMethods(),
    )
    .get('/', (ctx) => {
        ctx.response.status = 200;
        ctx.response.body = { status: 'working' };
    });

export default router;
