import { assertEquals } from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import { setupWeb3Api, utils } from '../sci.ts';
import { contract } from './golem-polygon-contract.ts';
import { decodeTransfer } from './transfer-tx-decoder.ts';

const web3 = setupWeb3Api('');

Deno.test('decodeTransfer', () => {
    const glm = contract(web3);
    const bytes = glm.methods.transfer('0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD', utils.toWei('5.5')).encodeABI();
    const data = decodeTransfer(bytes);
    assertEquals(data?.recipient, '0x4DCeBf483fA7f31FfCee6e4EAffC1D78308Ec2cD');
    assertEquals(data?.amount, utils.toWei('5.5'));
});
