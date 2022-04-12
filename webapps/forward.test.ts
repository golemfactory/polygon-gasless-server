import { assertEquals } from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import web3, { glm } from '../config.ts';
import { TransferArgs } from '../sci/transfer-tx-decoder.ts';
import { validateTransferMetaTxArguments } from './forward.ts';

const IS_OFFLINE = (await Deno.permissions.query({ name: 'net' })).state !== 'granted';

Deno.test({
    name: 'zero tokens',
    ignore: IS_OFFLINE,
    async fn() {
        const args: TransferArgs = { recipient: '0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD', amount: '0' };
        const sender = '0x26C80CC193B27d73D2C40943Acec77F4DA2c5bd8';

        const error_details = await validateTransferMetaTxArguments(sender, args, 'latest');
        assertEquals(error_details, 'Cannot transfer 0 tokens');
    },
});

Deno.test({
    name: 'sender and recipient are the same',
    ignore: IS_OFFLINE,
    async fn() {
        const address = '0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD';
        const args: TransferArgs = { recipient: address, amount: '1' };
        const sender = address;

        let error_details = await validateTransferMetaTxArguments(sender, args, 'latest');
        assertEquals(error_details, 'Sender and recipient addresses must differ');

        error_details = await validateTransferMetaTxArguments('4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD', args, 'latest');
        assertEquals(error_details, 'Sender and recipient addresses must differ');

        error_details = await validateTransferMetaTxArguments('4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD'.toUpperCase(), args, 'latest');
        assertEquals(error_details, 'Sender and recipient addresses must differ');
    },
});

Deno.test({
    name: 'block too old',
    ignore: IS_OFFLINE,
    async fn() {
        const block_number = '0xaa4676e812653c037ec88233b8a405a6679ac12222f01744b63996c098438208';
        const args: TransferArgs = { recipient: '0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD', amount: '1' };
        const sender = '0xFeaED3f817169C012D040F05C6c52bCE5740Fc37';

        const error_details = await validateTransferMetaTxArguments(sender, args, block_number);
        assertEquals(error_details, 'Provided block is too old and can contain stale data');
    },
});

Deno.test({
    name: 'not full withdrawal',
    ignore: IS_OFFLINE,
    async fn() {
        const args: TransferArgs = {
            recipient: '0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD',
            amount: web3.utils.toWei('0.001'),
        };
        const sender = '0xFeaED3f817169C012D040F05C6c52bCE5740Fc37';
        const block_hash = await web3.eth.getBlock('latest').then((block) => block.hash);

        const error_details = await validateTransferMetaTxArguments(sender, args, block_hash);
        assertEquals(error_details, `Only full withdrawals are supported`);
    },
});

Deno.test({
    name: 'valid call',
    ignore: IS_OFFLINE,
    async fn() {
        const sender = '0xFeaED3f817169C012D040F05C6c52bCE5740Fc37';
        const block_hash = await web3.eth.getBlock('latest').then((block) => block.hash);
        const balance = await web3.eth.call({
            data: glm.methods.balanceOf(sender).encodeABI(),
            to: glm.options.address,
        }, block_hash).then((res) => web3.utils.toBN(res));
        const args: TransferArgs = { recipient: '0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD', amount: balance.toString() };

        const error_details = await validateTransferMetaTxArguments(sender, args, block_hash);
        assertEquals(error_details, undefined);
    },
});
