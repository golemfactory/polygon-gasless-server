import { Web3 } from '../sci.ts';
import { delay, log } from '../deps.ts';

const GAS_LIMIT = 800 * 1000;
const logger = log.getLogger();

export type Transaction = {
    to: string;
    data: string;
    gasLimit?: string;
};

type QueuedTransaction = {
    transaction: Transaction;
    callback: (txHash: string) => void;
};

type PendingTransaction = QueuedTransaction & {
    txId: string;
};

class Queue<T> {
    private headIdx = 0;
    private heads: T[] = [];
    private tails: T[] = [];

    get length(): number {
        return this.heads.length + this.tails.length - this.headIdx;
    }

    push(item: T) {
        this.tails.push(item);
    }

    pop(): T | null {
        if (this.headIdx >= this.heads.length) {
            this.heads = this.tails;
            this.headIdx = 0;
            this.tails = [];
            if (this.heads.length === 0) {
                return null;
            }
        }

        return this.heads[this.headIdx++];
    }
}

export class TransactionSender {
    private readonly web3: any;
    private readonly sender: string;
    private pendingTransaction: PendingTransaction | null = null;
    private queuedTransactions: Queue<QueuedTransaction> = new Queue();
    private readonly gasPrice: string;
    private _lock = false;
    private _started?: number;

    constructor(provider: any, secretKey: string) {
        this.web3 = provider;
        const addedAccount = provider.eth.accounts.wallet.add(secretKey);
        this.sender = addedAccount.address;

        this.gasPrice = Web3.utils.toHex(this.web3.utils.toWei('31.1', 'gwei'));
    }

    public get address() {
        return this.sender;
    }

    async sendTx(tx: Transaction): Promise<string> {
        if (!this._started) {
            throw new Error(`sender is not started`);
        }
        return await new Promise((resolve, _reject) => {
            this.queuedTransactions.push({
                transaction: tx,
                callback: resolve,
            });
            this._notify();
        });
    }

    public start() {
        if (this._started) {
            clearInterval(this._started);
        }
        this._started = setInterval(() => {
            const _ = this._notify();
        }, 30000);
    }

    public async stop() {
        while (this.queuedTransactions.length > 0) {
            logger.warning(`got ${this.queuedTransactions.length} transactions`);
            await delay(10000);
        }
        const started = this._started;
        this._started = undefined;
        clearInterval(started);
    }

    private async _notify() {
        if (this._lock) {
            logger.debug('transaction sender locked');
            return;
        }
        try {
            this._lock = true;
            logger.info('enter');
            const web3 = this.web3;

            if (this.pendingTransaction) {
                const txId = this.pendingTransaction.txId;
                const bcTransaction = await web3.eth.getTransaction(txId);

                if (bcTransaction && bcTransaction.blockNumber) {
                    logger.info(
                        `transaction ${txId} confirmed in block ${bcTransaction.blockNumber}`,
                    );
                    this.pendingTransaction = null;
                } else {
                    return;
                }
            }
            if (this.queuedTransactions.length === 0) {
                return;
            }
            const [nonce, pendingNonce] = await Promise.all([
                web3.eth.getTransactionCount(this.sender, 'latest'),
                web3.eth.getTransactionCount(this.sender, 'pending'),
            ]);
            if (nonce !== pendingNonce) {
                logger.warning(`unexpected pending transaction on ${this.sender}`);
                await delay(1000);
                return;
            }
            const queuedTransaction = this.queuedTransactions.pop();
            if (!queuedTransaction) {
                return;
            }
            const { transaction, callback } = queuedTransaction;

            const txObject = {
                nonce: this.web3.utils.toHex(nonce),
                gasLimit: transaction.gasLimit || this.web3.utils.toHex(GAS_LIMIT),
                // Keep gas price hardcoded, prevents from spending too much in case if chain is under artificial heavy load
                gasPrice: this.gasPrice,
                // Address inserted in the wallet
                from: this.sender,
                to: transaction.to,
                data: transaction.data,
                common: {
                    // Values taken from Common.default.custom(Common.CustomChain.PolygonMainnet);
                    customChain: {
                        name: 'polygon-mainnet',
                        chainId: 137,
                        networkId: 137,
                    },
                },
            };
            try {
                const txId: string = await new Promise((resolve, reject) => {
                    this.web3.eth.sendTransaction(txObject)
                        .on('transactionHash', (hash_returned: string) => resolve(hash_returned))
                        .on('error', (err: any) => {
                            reject(err);
                        }).then(() => this._notify());
                });

                logger.info(`send tx_id=${txId}`);
                this.pendingTransaction = {
                    txId,
                    ...queuedTransaction,
                };
                callback(txId);
            } catch (e) {
                logger.error(`fatal ${e.message}`, e);
                callback('xx');
            }
        } finally {
            this._lock = false;
            logger.info('left');
        }
    }
}
