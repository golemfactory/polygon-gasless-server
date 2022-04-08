import contractData from './golem-polygon-contract.json' assert {
    type: 'json',
};
import { Web3 } from '../sci.ts';
import { log } from '../deps.ts';

const logger = log.getLogger();

export function contract(web3: any, address: string) {
    return new web3.eth.Contract(
        contractData.abi,
        address,
    );
}
