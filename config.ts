import { setupWeb3Api } from './sci.ts';
import { dotenv } from './deps.ts';

let _dotenvCfg: dotenv.DotenvConfig | undefined = undefined;

async function getDotEnv(key: string, ask?: boolean) {
    if (_dotenvCfg) {
        return _dotenvCfg[key];
    }
    let d = await Deno.permissions.query({ name: 'read', path: '.env' });
    if (d.state == 'prompt' && ask) {
        console.warn('ask for', key, 'ask=', ask);
        d = await Deno.permissions.request({ name: 'read', path: '.env' });
    }
    if (d.state === 'granted') {
        _dotenvCfg = await dotenv.config({ defaults: undefined, export: false });
    }
    if (_dotenvCfg) {
        return _dotenvCfg[key];
    }
    return undefined;
}

async function getEnv(key: string, options?: { ask?: boolean; required?: boolean }): Promise<string | undefined> {
    let dotenvValue = getDotEnv(key);

    let permissionStatus = await Deno.permissions.query({ name: 'env', variable: key });
    if (permissionStatus.state === 'prompt' && (options?.ask || options?.required)) {
        dotenvValue = getDotEnv(key, options?.ask);
        if (!dotenvValue) {
            permissionStatus = await Deno.permissions.request({ name: 'env', variable: key });
        }
    }
    if (permissionStatus.state === 'granted') {
        const value = Deno.env.get(key);
        if (value) {
            return value;
        }
    }
    if (dotenvValue) {
        return dotenvValue;
    }
    if (options?.required) {
        throw new Error(`missing ${key} environment variable`);
    }
    return undefined;
}

async function getIntEnv(key: string, options?: { ask?: boolean; required?: boolean }): Promise<number | undefined> {
    const value = await getEnv(key, options);
    if (value) {
        return parseInt(value);
    }
}

export const config = {
    secret: await getEnv('ERC20_PRIVATE_KEY', { required: true }),
    rpc: await getEnv('WEB3_RPC') || 'https://polygon-rpc.com/',
    contractAddress: await getEnv('ERC20_CONTRACT_ADDRESS'),
};

export const port = await getIntEnv('BACKEND_SERVICE_PORT') || 8000;

export const gracePeriodMs = await getIntEnv('GRACE_PERIOD_MS');

export default setupWeb3Api(config.rpc);
