import { setupWeb3Api } from './sci.ts';

// ERC20_PRIVATE_KEY
// WEB3_RPC
// ERC20_CONTRACT_ADDRESS

async function getEnv(key: string, options?: { ask?: boolean; required?: boolean }): Promise<string | undefined> {
    let permissionStatus = await Deno.permissions.query({ name: 'env', variable: key });
    if (permissionStatus.state === 'prompt' && (options?.ask || options?.required)) {
        permissionStatus = await Deno.permissions.request({ name: 'env', variable: key });
    }
    if (permissionStatus.state === 'granted') {
        const value = Deno.env.get(key);
        if (value) {
            return value;
        }
    }
    if (options?.required) {
        throw new Error(`missing ${key} environment variable`);
    }
    return undefined;
}

export const config = {
    secret: await getEnv('ERC20_PRIVATE_KEY', { required: true }),
    rpc: await getEnv('WEB3_RPC') || 'https://polygon-rpc.com/',
    contractAddress: await getEnv('ERC20_CONTRACT_ADDRESS'),
};

export const port = await getEnv('BACKEND_SERVICE_PORT') || 8000;

export default setupWeb3Api(config.rpc);
