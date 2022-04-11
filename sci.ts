// Smart Contract Interface
import Web3Api from 'https://deno.land/x/web3@v0.10.0/mod.ts';
import * as web3_utils from 'https://deno.land/x/web3@v0.9.2/packages/web3-utils/types/index.d.ts';
import * as web3_eth_contract from 'https://deno.land/x/web3@v0.9.2/packages/web3-eth-contract/types/index.d.ts';
import * as web3_core from 'https://deno.land/x/web3@v0.9.2/packages/web3-core/types/index.d.ts';
import Web3Type from 'https://deno.land/x/web3@v0.9.2/packages/web3/types/index.d.ts';

export function setupWeb3Api(providerUrl: string): Web3 {
    return new Web3Api(providerUrl);
}

export type PolygonNetwork = 'mainnet' | 'testnet';

export type Web3 = Web3Type;
export type AbiItem = web3_utils.AbiItem;
export type Contract = web3_eth_contract.Contract;
export type TransactionReceipt = web3_core.TransactionReceipt;

export const utils = Web3Api.utils;
export const abi = new Web3Api().eth.abi;
