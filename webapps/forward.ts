import { Context, log, Router, Status } from '../deps.ts';
import { z } from '../deps.ts';
import { utils } from '../sci.ts';
import web3, { blockMaxAgeS, config, glm, gracePeriodMs } from '../config.ts';
import { TransactionSender } from '../sci/transaction-sender.ts';
import { decodeTransfer, TransferArgs } from '../sci/transfer-tx-decoder.ts';

const HexString = () => z.string().refine(utils.isHexStrict, 'expected hex string');
const Address = () => z.string().refine(utils.isAddress, 'expected eth address');

const ForwardRequest = z.object({
    r: HexString(),
    s: HexString(),
    v: HexString(),
    sender: Address(),
    abiFunctionCall: HexString(),
    signedRequest: HexString().optional(),
    blockHash: HexString().optional(),
});

const sender = new TransactionSender(web3, config.gasPrice, config.secret!);

sender.start();

const pendingSenders = new Set<string>();

export default new Router()
    .post('/transfer', async (ctx: Context) => {
        const logger = log.getLogger('webapps');

        try {
            const input = ForwardRequest.parse(await ctx.request.body({ type: 'json' }).value);

            // checking if this is transfer
            const decoded_arguments = decodeTransfer(input.abiFunctionCall);
            if (!decoded_arguments) {
                ctx.response.status = 400;
                ctx.response.body = {
                    message: 'unable to decode transaction',
                };
                return;
            }

            const error_details = await validateTransferMetaTxArguments(input.sender, decoded_arguments, input.blockHash || 'latest');

            if (error_details) {
                ctx.response.status = 400;
                ctx.response.body = {
                    message: error_details,
                };
                return;
            }

            logger.info(() => `Forwarding transfer from ${input.sender} to ${decoded_arguments.recipient} of ${utils.fromWei(decoded_arguments.amount)}`);
            logger.debug(() => `input=${JSON.stringify(input)}`);

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
                    logger.debug(() => `check gracePeriodMs=${gracePeriodMs}, for ${storageKey}, prev=${prev}`);
                    if (prev && (now - parseInt(prev)) < gracePeriodMs) {
                        const retryAfter = new Date(parseInt(prev) + gracePeriodMs);
                        ctx.response.status = 429;
                        ctx.response.headers.set('Retry-After', retryAfter.toUTCString());
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
            log.error(`transfer endpoint failed: ${e}`);

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

            ctx.response.status = 500;
            ctx.response.body = e.message;
            return;
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
            blockMaxAgeS,
        };
    });

export async function validateTransferMetaTxArguments(sender: string, transfer_details: TransferArgs, block_hash: string): Promise<string | undefined> {
    const requested_amount = web3.utils.toBN(transfer_details.amount);

    if (requested_amount.isZero()) {
        return 'Cannot transfer 0 tokens';
    }

    let from = sender.toLocaleLowerCase();
    if (!from.startsWith('0x')) {
        from = '0x' + from;
    }

    let to = transfer_details.recipient.toLowerCase();
    if (!to.startsWith('0x')) {
        to = '0x' + to;
    }

    if (from === to) {
        return 'Sender and recipient addresses must differ';
    }

    let block;
    try {
        block = await web3.eth.getBlock(block_hash);
    } catch (_error) {
        return `Block ${block_hash} is too old`;
    }

    if (!block.nonce) {
        return `Block ${block_hash} is still pending`;
    }

    const now_seconds = Date.now() / 1000;
    if (now_seconds - +block.timestamp > blockMaxAgeS) {
        return 'Provided block is too old and can contain stale data';
    }

    const balance = await web3.eth.call({ data: glm.methods.balanceOf(from).encodeABI(), to: glm.options.address }, block_hash).then((res) => web3.utils.toBN(res));

    if (!requested_amount.eq(balance)) {
        return 'Only full withdrawals are supported';
    }

    return undefined;
}
