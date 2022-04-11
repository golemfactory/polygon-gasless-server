import { Context, Router, Status } from '../webapps.ts';
import { z } from '../deps.ts';
import { utils } from '../sci.ts';
import web3, { config } from '../config.ts';
import { TransactionSender } from '../sci/transaction-sender.ts';

const HexString = () => z.string().refine(utils.isHex, 'expected hex string');
const Address = () => z.string().refine(utils.isAddress, 'expected eth address');

const ForwardRequest = z.object({
    r: HexString(),
    s: HexString(),
    v: HexString(),
    sender: Address(),
    abiFunctionCall: HexString(),
    signedRequest: HexString().optional(),
});

const sender = new TransactionSender(web3, config.secret!);

export default new Router()
    .post('/', async (ctx: Context) => {
        try {
            const input = ForwardRequest.parse(await ctx.request.body({ type: 'json' }).value);
            ctx.response.type = 'json';
            ctx.response.body = input;
        } catch (e) {
            if (e instanceof z.ZodError) {
                ctx.response.status = 400;
                ctx.response.body = {
                    message: 'invalid request body',
                    issues: e.issues,
                };
                return;
            }
            if (e instanceof SyntaxError) {
                ctx.response.status = 400;
                ctx.response.body = {
                    message: e.message,
                };
                return;
            }
            throw e;
        }
    })
    .get('/status', async (ctx: Context) => {
        const networkId = await web3.eth.net.getId();
        const address = sender.address;
        const gas = utils.fromWei(await web3.eth.getBalance(address));
        const queueSize = sender.queueSize;
        const contractAddress = config.contractAddress;
        ctx.response.status = Status.OK;
        ctx.response.type = 'json';
        ctx.response.body = {
            networkId,
            address,
            gas,
            queueSize,
            contractAddress,
        };
    });
