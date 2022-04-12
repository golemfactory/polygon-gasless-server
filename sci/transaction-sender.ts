import { PolygonNetwork, utils, Web3 } from '../sci.ts';
import { delay, log } from '../deps.ts';

const GAS_LIMIT = 800 * 1000;

export type Transaction = {
    to: string;
    data: string;
    gasLimit?: string;
};

type QueuedTransaction = {
    transaction: Transaction;
    callback: (txHash: string) => void;
    error: (e: Error) => void;
};

type PendingTransaction = QueuedTransaction & {
    txId: string;
};

class Queue<T> {
    private headIdx = 0;
    private heads: T[] = [];
    private tails: T[] = [];

    public get length(): number {
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
    private readonly web3: Web3;
    private readonly sender: string;
    private readonly network: PolygonNetwork;
    private pendingTransaction: PendingTransaction | null = null;
    private queuedTransactions: Queue<QueuedTransaction> = new Queue();
    private readonly gasPrice: string;
    private _lock = false;
    private _started?: number;
    private readonly logger = log.getLogger('sci');

    constructor(provider: Web3, secretKey: string, network: PolygonNetwork = 'mainnet', gasPrice: string = '31.1') {
        this.web3 = provider;
        this.network = network;
        const addedAccount = provider.eth.accounts.wallet.add(secretKey);
        this.sender = addedAccount.address;
        this.gasPrice = utils.toHex(this.web3.utils.toWei(gasPrice, 'gwei'));
    }

    public get address(): string {
        return this.sender;
    }

    public get queueSize(): number {
        return this.queuedTransactions.length;
    }

    public async sendTx(tx: Transaction): Promise<string> {
        if (!this._started) {
            throw new Error(`sender is not started`);
        }
        return await new Promise((resolve, reject) => {
            this.queuedTransactions.push({
                transaction: tx,
                callback: resolve,
                error: reject,
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
            this.logger.warning(`got ${this.queuedTransactions.length} transactions`);
            await delay(10000);
        }
        const started = this._started;
        this._started = undefined;
        clearInterval(started);
    }

    private async _notify() {
        const { logger } = this;

        if (this._lock) {
            logger.debug('transaction sender locked');
            return;
        }
        try {
            this._lock = true;
            logger.debug('enter');
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
            const { transaction, callback, error } = queuedTransaction;
            const gasLimit = transaction.gasLimit || this.web3.utils.toHex(GAS_LIMIT);
            try {
                const estimatedGas = await web3.eth.estimateGas({
                    to: transaction.to,
                    from: this.sender,
                    data: transaction.data,
                });

                if (estimatedGas > utils.toNumber(gasLimit)) {
                    queuedTransaction.error(new Error(`failed to process transaction estimatedGas=${utils.fromWei(gasLimit, 'Gwei')}`));
                    setTimeout(() => this._notify(), 100);
                    return;
                }
            } catch (e) {
                logger.error(`failed to estimate gas: ${e}`);
                queuedTransaction.error(e);
                setTimeout(() => this._notify(), 100);
                return;
            }

            const customChain = this.network == 'mainnet'
                ? {
                    name: 'Polygon',
                    chainId: 137,
                    networkId: 137,
                }
                : {
                    name: 'Mumbai',
                    chainId: 80001,
                    networkId: 80001,
                };

            const txObject = {
                nonce: nonce,
                gasLimit,
                // Keep gas price hardcoded, prevents from spending too much in case if chain is under artificial heavy load
                gasPrice: this.gasPrice,
                // Address inserted in the wallet
                from: this.sender,
                to: transaction.to,
                data: transaction.data,
                common: {
                    customChain,
                },
            };
            try {
                const txId: string = await new Promise((resolve, reject) => {
                    this.web3.eth.sendTransaction(txObject)
                        .on('transactionHash', (hash_returned: string) => resolve(hash_returned))
                        .on('error', (err: Error) => {
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
                error(e);
            }
        } finally {
            this._lock = false;
            logger.debug('left');
        }
    }
}
