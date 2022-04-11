import { log } from '../deps.ts';
import { Context, Router, Status } from '../webapps.ts';
import { z } from '../deps.ts';
import { utils } from '../sci.ts';
import web3, { config, gracePeriodMs } from '../config.ts';
import { contract } from '../sci/golem-polygon-contract.ts';
import { TransactionSender } from '../sci/transaction-sender.ts';
import { decodeTransfer } from '../sci/transfer-tx-decoder.ts';
const logger = log.getLogger('webapps::forward');
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
/*
  Mainnet = "0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf";
  Mumbai = "0x2036807B0B3aaf5b1858EE822D0e111fDdac7018";
*/
const glm = contract(web3, '0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf');

sender.start();

const pendingSenders = new Set<string>();

export default new Router()
    .post('/transfer', async (ctx: Context) => {
        try {
            const input = ForwardRequest.parse(await ctx.request.body({ type: 'json' }).value);
            // checking if this is transfer
            const decoded = decodeTransfer(input.abiFunctionCall);
            if (!decoded) {
                ctx.response.status = 400;
                ctx.response.body = {
                    message: 'unable to decode transaction',
                };
                return;
            }
            logger.info(() => `Forwarding transfer from ${input.sender} to ${decoded.recipient} of ${utils.fromWei(decoded.amount)}`);
            logger.debug('input', input);

            const data = glm.methods.executeMetaTransaction(input.sender, input.abiFunctionCall, input.r, input.s, input.v).encodeABI();

            if (pendingSenders.has(input.sender)) {
                ctx.response.status = 429;
                ctx.response.body = {
                    'message': 'processing concurrent transaction',
                };
                return;
            }
            try {
                pendingSenders.add(input.sender);
                const now = new Date().getTime();
                const storageKey = `sender.${input.sender}`;
                if (gracePeriodMs) {
                    const prev = localStorage.getItem(storageKey);
                    if (prev && (now - parseInt(prev)) > gracePeriodMs) {
                        const retryAfter = new Date(parseInt(prev) + gracePeriodMs);
                        ctx.response.status = 429;
                        ctx.response.headers.set('Retry-After', retryAfter.toISOString());
                        ctx.response.body = {
                            'message': 'Grace period did not pass for this address',
                        };
                        return;
                    }
                }

                const txId = await sender.sendTx({ to: glm.options.address, data });

                localStorage.setItem(storageKey, now.toString());
                ctx.response.type = 'json';
                ctx.response.body = { txId };
            } finally {
                pendingSenders.delete(input.sender);
            }
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
            gracePeriodMs,
        };
    });
