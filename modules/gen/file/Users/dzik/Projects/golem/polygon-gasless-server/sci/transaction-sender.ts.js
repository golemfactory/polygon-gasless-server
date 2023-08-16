import { utils } from '../sci.ts';
import { delay, log } from '../deps.ts';
const GAS_LIMIT = 800 * 1000;
class Queue {
    headIdx = 0;
    heads = [];
    tails = [];
    get length() {
        return this.heads.length + this.tails.length - this.headIdx;
    }
    push(item) {
        this.tails.push(item);
    }
    pop() {
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
    web3;
    sender;
    network;
    pendingTransaction = null;
    queuedTransactions = new Queue();
    _gasPrice;
    _gasPriceUpperLimit;
    _lock = false;
    _started;
    logger = log.getLogger('sci');
    constructor(provider, gasPrice, gasPriceUpperLimit, secretKey, network = 'mainnet'){
        this.web3 = provider;
        this.network = network;
        const addedAccount = secretKey ? provider.eth.accounts.wallet.add(secretKey) : provider.eth.accounts.create();
        this.sender = addedAccount.address;
        this._gasPrice = this.web3.utils.toBN(this.web3.utils.toWei(gasPrice, 'gwei'));
        this._gasPriceUpperLimit = this.web3.utils.toBN(this.web3.utils.toWei(gasPriceUpperLimit, 'gwei'));
    }
    get address() {
        return this.sender;
    }
    get queueSize() {
        return this.queuedTransactions.length;
    }
    get gasPrice() {
        return this._gasPrice;
    }
    get gasPriceUpperLimit() {
        return this._gasPriceUpperLimit;
    }
    async sendTx(tx) {
        if (!this._started) {
            throw new Error(`sender is not started`);
        }
        return await new Promise((resolve, reject)=>{
            this.queuedTransactions.push({
                transaction: tx,
                callback: resolve,
                error: reject
            });
            this._notify();
        });
    }
    start() {
        if (this._started) {
            clearInterval(this._started);
        }
        this._started = setInterval(()=>{
            const _ = this._notify();
        }, 30000);
    }
    async stop() {
        while(this.queuedTransactions.length > 0){
            this.logger.warning(`got ${this.queuedTransactions.length} transactions`);
            await delay(10000);
        }
        const started = this._started;
        this._started = undefined;
        clearInterval(started);
    }
    async _notify() {
        const { logger  } = this;
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
                    logger.info(`transaction ${txId} confirmed in block ${bcTransaction.blockNumber}`);
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
                web3.eth.getTransactionCount(this.sender, 'pending')
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
            const { transaction , callback , error  } = queuedTransaction;
            const gasLimit = transaction.gasLimit || this.web3.utils.toHex(GAS_LIMIT);
            try {
                const estimatedGas = await web3.eth.estimateGas({
                    to: transaction.to,
                    from: this.sender,
                    data: transaction.data
                });
                if (estimatedGas > utils.toNumber(gasLimit)) {
                    queuedTransaction.error(new Error(`failed to process transaction estimatedGas=${utils.fromWei(gasLimit, 'Gwei')}`));
                    setTimeout(()=>this._notify(), 100);
                    return;
                }
            } catch (e) {
                logger.error(`failed to estimate gas: ${e}`);
                queuedTransaction.error(e);
                setTimeout(()=>this._notify(), 100);
                return;
            }
            const customChain = this.network == 'mainnet' ? {
                name: 'Polygon',
                chainId: 137,
                networkId: 137
            } : {
                name: 'Mumbai',
                chainId: 80001,
                networkId: 80001
            };
            const txObject = {
                nonce: nonce,
                type: '0x2',
                gasLimit,
                maxFeePerGas: utils.toHex(this.gasPriceUpperLimit),
                maxPriorityFeePerGas: utils.toHex(this.gasPrice),
                // Address inserted in the wallet
                from: this.sender,
                to: transaction.to,
                data: transaction.data,
                common: {
                    customChain
                }
            };
            try {
                const txId = await new Promise((resolve, reject)=>{
                    this.web3.eth.sendTransaction(txObject).on('transactionHash', (hash_returned)=>resolve(hash_returned)).on('error', (err)=>{
                        reject(err);
                    }).then(()=>this._notify()).catch((_e)=>{
                    // Exception is thrown despite the fact, .on(error) callback is called.
                    // Consume it here, since proper error handling happens in mentioned callback.
                    });
                });
                logger.info(`send tx_id=${txId}`);
                this.pendingTransaction = {
                    txId,
                    ...queuedTransaction
                };
                callback(txId);
            } catch (e) {
                logger.error(`fatal ${e.message}`, e);
                error(e);
            }
        } finally{
            this._lock = false;
            logger.debug('left');
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NjaS90cmFuc2FjdGlvbi1zZW5kZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9seWdvbk5ldHdvcmssIHV0aWxzLCBXZWIzIH0gZnJvbSAnLi4vc2NpLnRzJztcbmltcG9ydCB7IGRlbGF5LCBsb2cgfSBmcm9tICcuLi9kZXBzLnRzJztcbmltcG9ydCBCTiBmcm9tICdodHRwczovL2Rlbm8ubGFuZC94L3dlYjNAdjAuOS4yL3R5cGVzL2JuLmQudHMnO1xuXG5jb25zdCBHQVNfTElNSVQgPSA4MDAgKiAxMDAwO1xuZXhwb3J0IHR5cGUgVHJhbnNhY3Rpb24gPSB7XG4gICAgdG86IHN0cmluZztcbiAgICBkYXRhOiBzdHJpbmc7XG4gICAgZ2FzTGltaXQ/OiBzdHJpbmc7XG59O1xuXG50eXBlIFF1ZXVlZFRyYW5zYWN0aW9uID0ge1xuICAgIHRyYW5zYWN0aW9uOiBUcmFuc2FjdGlvbjtcbiAgICBjYWxsYmFjazogKHR4SGFzaDogc3RyaW5nKSA9PiB2b2lkO1xuICAgIGVycm9yOiAoZTogRXJyb3IpID0+IHZvaWQ7XG59O1xuXG50eXBlIFBlbmRpbmdUcmFuc2FjdGlvbiA9IFF1ZXVlZFRyYW5zYWN0aW9uICYge1xuICAgIHR4SWQ6IHN0cmluZztcbn07XG5cbmNsYXNzIFF1ZXVlPFQ+IHtcbiAgICBwcml2YXRlIGhlYWRJZHggPSAwO1xuICAgIHByaXZhdGUgaGVhZHM6IFRbXSA9IFtdO1xuICAgIHByaXZhdGUgdGFpbHM6IFRbXSA9IFtdO1xuXG4gICAgcHVibGljIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhZHMubGVuZ3RoICsgdGhpcy50YWlscy5sZW5ndGggLSB0aGlzLmhlYWRJZHg7XG4gICAgfVxuXG4gICAgcHVzaChpdGVtOiBUKSB7XG4gICAgICAgIHRoaXMudGFpbHMucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICBwb3AoKTogVCB8IG51bGwge1xuICAgICAgICBpZiAodGhpcy5oZWFkSWR4ID49IHRoaXMuaGVhZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRzID0gdGhpcy50YWlscztcbiAgICAgICAgICAgIHRoaXMuaGVhZElkeCA9IDA7XG4gICAgICAgICAgICB0aGlzLnRhaWxzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5oZWFkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmhlYWRzW3RoaXMuaGVhZElkeCsrXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFuc2FjdGlvblNlbmRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3ZWIzOiBXZWIzO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VuZGVyOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBuZXR3b3JrOiBQb2x5Z29uTmV0d29yaztcbiAgICBwcml2YXRlIHBlbmRpbmdUcmFuc2FjdGlvbjogUGVuZGluZ1RyYW5zYWN0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBxdWV1ZWRUcmFuc2FjdGlvbnM6IFF1ZXVlPFF1ZXVlZFRyYW5zYWN0aW9uPiA9IG5ldyBRdWV1ZSgpO1xuICAgIHByaXZhdGUgX2dhc1ByaWNlOiBCTjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9nYXNQcmljZVVwcGVyTGltaXQ6IEJOO1xuICAgIHByaXZhdGUgX2xvY2sgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9zdGFydGVkPzogbnVtYmVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbG9nLmdldExvZ2dlcignc2NpJyk7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJvdmlkZXI6IFdlYjMsXG4gICAgICAgIGdhc1ByaWNlOiBzdHJpbmcsXG4gICAgICAgIGdhc1ByaWNlVXBwZXJMaW1pdDogc3RyaW5nLFxuICAgICAgICBzZWNyZXRLZXk/OiBzdHJpbmcsXG4gICAgICAgIG5ldHdvcms6IFBvbHlnb25OZXR3b3JrID0gJ21haW5uZXQnLFxuICAgICkge1xuICAgICAgICB0aGlzLndlYjMgPSBwcm92aWRlcjtcbiAgICAgICAgdGhpcy5uZXR3b3JrID0gbmV0d29yaztcbiAgICAgICAgY29uc3QgYWRkZWRBY2NvdW50ID0gc2VjcmV0S2V5ID8gcHJvdmlkZXIuZXRoLmFjY291bnRzLndhbGxldC5hZGQoc2VjcmV0S2V5KSA6IHByb3ZpZGVyLmV0aC5hY2NvdW50cy5jcmVhdGUoKTtcbiAgICAgICAgdGhpcy5zZW5kZXIgPSBhZGRlZEFjY291bnQuYWRkcmVzcztcbiAgICAgICAgdGhpcy5fZ2FzUHJpY2UgPSB0aGlzLndlYjMudXRpbHMudG9CTih0aGlzLndlYjMudXRpbHMudG9XZWkoZ2FzUHJpY2UsICdnd2VpJykpO1xuICAgICAgICB0aGlzLl9nYXNQcmljZVVwcGVyTGltaXQgPSB0aGlzLndlYjMudXRpbHMudG9CTih0aGlzLndlYjMudXRpbHMudG9XZWkoZ2FzUHJpY2VVcHBlckxpbWl0LCAnZ3dlaScpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFkZHJlc3MoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VuZGVyO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgcXVldWVTaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXVlZFRyYW5zYWN0aW9ucy5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBnYXNQcmljZSgpOiBCTiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nYXNQcmljZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGdhc1ByaWNlVXBwZXJMaW1pdCgpOiBCTiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nYXNQcmljZVVwcGVyTGltaXQ7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHNlbmRUeCh0eDogVHJhbnNhY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBpZiAoIXRoaXMuX3N0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VuZGVyIGlzIG5vdCBzdGFydGVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMucXVldWVkVHJhbnNhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uOiB0eCxcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogcmVqZWN0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9ub3RpZnkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0KCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhcnRlZCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9zdGFydGVkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdGFydGVkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgXyA9IHRoaXMuX25vdGlmeSgpO1xuICAgICAgICB9LCAzMDAwMCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHN0b3AoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLnF1ZXVlZFRyYW5zYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuaW5nKGBnb3QgJHt0aGlzLnF1ZXVlZFRyYW5zYWN0aW9ucy5sZW5ndGh9IHRyYW5zYWN0aW9uc2ApO1xuICAgICAgICAgICAgYXdhaXQgZGVsYXkoMTAwMDApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXJ0ZWQgPSB0aGlzLl9zdGFydGVkO1xuICAgICAgICB0aGlzLl9zdGFydGVkID0gdW5kZWZpbmVkO1xuICAgICAgICBjbGVhckludGVydmFsKHN0YXJ0ZWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX25vdGlmeSgpIHtcbiAgICAgICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuX2xvY2spIHtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygndHJhbnNhY3Rpb24gc2VuZGVyIGxvY2tlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLl9sb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnZW50ZXInKTtcbiAgICAgICAgICAgIGNvbnN0IHdlYjMgPSB0aGlzLndlYjM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnBlbmRpbmdUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR4SWQgPSB0aGlzLnBlbmRpbmdUcmFuc2FjdGlvbi50eElkO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJjVHJhbnNhY3Rpb24gPSBhd2FpdCB3ZWIzLmV0aC5nZXRUcmFuc2FjdGlvbih0eElkKTtcblxuICAgICAgICAgICAgICAgIGlmIChiY1RyYW5zYWN0aW9uICYmIGJjVHJhbnNhY3Rpb24uYmxvY2tOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgICBgdHJhbnNhY3Rpb24gJHt0eElkfSBjb25maXJtZWQgaW4gYmxvY2sgJHtiY1RyYW5zYWN0aW9uLmJsb2NrTnVtYmVyfWAsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZ1RyYW5zYWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMucXVldWVkVHJhbnNhY3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IFtub25jZSwgcGVuZGluZ05vbmNlXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICB3ZWIzLmV0aC5nZXRUcmFuc2FjdGlvbkNvdW50KHRoaXMuc2VuZGVyLCAnbGF0ZXN0JyksXG4gICAgICAgICAgICAgICAgd2ViMy5ldGguZ2V0VHJhbnNhY3Rpb25Db3VudCh0aGlzLnNlbmRlciwgJ3BlbmRpbmcnKSxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgaWYgKG5vbmNlICE9PSBwZW5kaW5nTm9uY2UpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybmluZyhgdW5leHBlY3RlZCBwZW5kaW5nIHRyYW5zYWN0aW9uIG9uICR7dGhpcy5zZW5kZXJ9YCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsYXkoMTAwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBxdWV1ZWRUcmFuc2FjdGlvbiA9IHRoaXMucXVldWVkVHJhbnNhY3Rpb25zLnBvcCgpO1xuICAgICAgICAgICAgaWYgKCFxdWV1ZWRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgdHJhbnNhY3Rpb24sIGNhbGxiYWNrLCBlcnJvciB9ID0gcXVldWVkVHJhbnNhY3Rpb247XG4gICAgICAgICAgICBjb25zdCBnYXNMaW1pdCA9IHRyYW5zYWN0aW9uLmdhc0xpbWl0IHx8IHRoaXMud2ViMy51dGlscy50b0hleChHQVNfTElNSVQpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlc3RpbWF0ZWRHYXMgPSBhd2FpdCB3ZWIzLmV0aC5lc3RpbWF0ZUdhcyh7XG4gICAgICAgICAgICAgICAgICAgIHRvOiB0cmFuc2FjdGlvbi50byxcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogdGhpcy5zZW5kZXIsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRyYW5zYWN0aW9uLmRhdGEsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXN0aW1hdGVkR2FzID4gdXRpbHMudG9OdW1iZXIoZ2FzTGltaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlZFRyYW5zYWN0aW9uLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBmYWlsZWQgdG8gcHJvY2VzcyB0cmFuc2FjdGlvbiBlc3RpbWF0ZWRHYXM9JHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMuZnJvbVdlaShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhc0xpbWl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0d3ZWknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX25vdGlmeSgpLCAxMDApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgZmFpbGVkIHRvIGVzdGltYXRlIGdhczogJHtlfWApO1xuICAgICAgICAgICAgICAgIHF1ZXVlZFRyYW5zYWN0aW9uLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbm90aWZ5KCksIDEwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjdXN0b21DaGFpbiA9IHRoaXMubmV0d29yayA9PSAnbWFpbm5ldCdcbiAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ1BvbHlnb24nLFxuICAgICAgICAgICAgICAgICAgICBjaGFpbklkOiAxMzcsXG4gICAgICAgICAgICAgICAgICAgIG5ldHdvcmtJZDogMTM3LFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ011bWJhaScsXG4gICAgICAgICAgICAgICAgICAgIGNoYWluSWQ6IDgwMDAxLFxuICAgICAgICAgICAgICAgICAgICBuZXR3b3JrSWQ6IDgwMDAxLFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IHR4T2JqZWN0ID0ge1xuICAgICAgICAgICAgICAgIG5vbmNlOiBub25jZSxcbiAgICAgICAgICAgICAgICB0eXBlOiAnMHgyJyxcbiAgICAgICAgICAgICAgICBnYXNMaW1pdCxcbiAgICAgICAgICAgICAgICBtYXhGZWVQZXJHYXM6IHV0aWxzLnRvSGV4KHRoaXMuZ2FzUHJpY2VVcHBlckxpbWl0KSxcbiAgICAgICAgICAgICAgICBtYXhQcmlvcml0eUZlZVBlckdhczogdXRpbHMudG9IZXgodGhpcy5nYXNQcmljZSksXG4gICAgICAgICAgICAgICAgLy8gQWRkcmVzcyBpbnNlcnRlZCBpbiB0aGUgd2FsbGV0XG4gICAgICAgICAgICAgICAgZnJvbTogdGhpcy5zZW5kZXIsXG4gICAgICAgICAgICAgICAgdG86IHRyYW5zYWN0aW9uLnRvLFxuICAgICAgICAgICAgICAgIGRhdGE6IHRyYW5zYWN0aW9uLmRhdGEsXG4gICAgICAgICAgICAgICAgY29tbW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUNoYWluLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR4SWQ6IHN0cmluZyA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53ZWIzLmV0aFxuICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmRUcmFuc2FjdGlvbih0eE9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbigndHJhbnNhY3Rpb25IYXNoJywgKGhhc2hfcmV0dXJuZWQ6IHN0cmluZykgPT4gcmVzb2x2ZShoYXNoX3JldHVybmVkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbignZXJyb3InLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuX25vdGlmeSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChfZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4Y2VwdGlvbiBpcyB0aHJvd24gZGVzcGl0ZSB0aGUgZmFjdCwgLm9uKGVycm9yKSBjYWxsYmFjayBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29uc3VtZSBpdCBoZXJlLCBzaW5jZSBwcm9wZXIgZXJyb3IgaGFuZGxpbmcgaGFwcGVucyBpbiBtZW50aW9uZWQgY2FsbGJhY2suXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBzZW5kIHR4X2lkPSR7dHhJZH1gKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBlbmRpbmdUcmFuc2FjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHhJZCxcbiAgICAgICAgICAgICAgICAgICAgLi4ucXVldWVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0eElkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYGZhdGFsICR7ZS5tZXNzYWdlfWAsIGUpO1xuICAgICAgICAgICAgICAgIGVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5fbG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdsZWZ0Jyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBeUIsS0FBSyxRQUFjLFlBQVk7QUFDeEQsU0FBUyxLQUFLLEVBQUUsR0FBRyxRQUFRLGFBQWE7QUFHeEMsTUFBTSxZQUFZLE1BQU07QUFpQnhCLE1BQU07SUFDTSxVQUFVLEVBQUU7SUFDWixRQUFhLEVBQUUsQ0FBQztJQUNoQixRQUFhLEVBQUUsQ0FBQztJQUV4QixJQUFXLFNBQWlCO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLE1BQU0sU0FBUyxJQUFJLENBQUMsTUFBTSxTQUFTLElBQUksQ0FBQztJQUN4RDtJQUVBLEtBQUssSUFBTyxFQUFFO1FBQ1YsSUFBSSxDQUFDLE1BQU0sS0FBSztJQUNwQjtJQUVBLE1BQWdCO1FBQ1osSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsTUFBTSxRQUFRO1lBQ25DLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQztZQUNsQixJQUFJLENBQUMsVUFBVTtZQUNmLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDZixJQUFJLElBQUksQ0FBQyxNQUFNLFdBQVcsR0FBRztn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