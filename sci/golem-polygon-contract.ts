import contractData from './golem-polygon-contract.json' assert {
    type: 'json',
};
import { AbiItem, Contract, Web3 } from '../sci.ts';
import { log } from '../deps.ts';

const _logger = log.getLogger();

export function contract(web3: Web3, address?: string): Contract {
    return new web3.eth.Contract(
        contractData!.abi as AbiItem[],
        address,
    );
}
