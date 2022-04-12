import { Router } from '../deps.ts';

export default new Router()
    .get('/', (ctx) => {
        ctx.response.body = 'ok';
    })
    .get('/:time', (ctx) => {
        const time: number = parseInt(ctx.params['time']);
        if (isNaN(time)) {
            ctx.response.status = 400;
            ctx.response.body = {
                'error': 'Invalid timestamp',
            };
        } else {
            const serverTime = Date.now();
            const diff = Math.abs(serverTime - time);
            ctx.response.headers.set('cache-control', 'no-cache');
            ctx.response.body = {
                serverTime,
                diff,
            };
        }
    });
