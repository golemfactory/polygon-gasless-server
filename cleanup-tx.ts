import web3, { config } from './config.ts';

const { secret } = config;
const addedAccount = web3.eth.accounts.wallet.add(secret!);
const gasPrice = web3.utils.toHex(web3.utils.toWei('70', 'gwei'));
const gasLimit = web3.utils.toHex(800 * 1000);
const [nonce, pendingNonce] = await Promise.all([
    web3.eth.getTransactionCount(addedAccount.address, 'latest'),
    web3.eth.getTransactionCount(addedAccount.address, 'pending'),
]);

if (nonce !== pendingNonce) {
    console.log('nonce=', nonce, 'pending=', pendingNonce);
    const customChain = {
        name: 'Polygon',
        chainId: 137,
        networkId: 137,
    };

    const txObject = {
        nonce: nonce,
        gasLimit,
        // Keep gas price hardcoded, prevents from spending too much in case if chain is under artificial heavy load
        gasPrice,
        // Address inserted in the wallet
        from: addedAccount.address,
        to: addedAccount.address,
        common: {
            customChain,
        },
    };

    await web3.eth.sendTransaction(txObject)
        .on('transactionHash', (hash_returned: string) => console.log('tx=', hash_returned));
} else {
    console.warn('nonce==pendingNonce', nonce, pendingNonce);
}
