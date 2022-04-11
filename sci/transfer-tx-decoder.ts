import { abi, AbiItem, utils } from '../sci.ts';

type TransferArgs = {
    recipient: string;
    amount: string;
};

const ABI: AbiItem = {
    name: 'transfer',
    type: 'function',
    inputs: [{ name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }],
};

const TRANSFER_SIGNATURE = abi.encodeFunctionSignature(ABI);

export function decodeTransfer(hexBytes: string): TransferArgs | undefined {
    const bytes = utils.hexToBytes(hexBytes);
    const functionSignature = utils.bytesToHex(bytes.splice(0, 4));
    if (functionSignature === TRANSFER_SIGNATURE) {
        try {
            const { '0': recipient, '1': amount } = abi.decodeParameters(['address', 'uint256'], utils.bytesToHex(bytes));
            return {
                recipient,
                amount,
            };
        } catch (e) {
            if (e instanceof Error) {
                return undefined;
            }
            throw e;
        }
    }
}
