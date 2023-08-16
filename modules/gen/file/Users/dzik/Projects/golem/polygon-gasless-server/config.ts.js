import { setupWeb3Api } from "./sci.ts";
import { dotenv } from "./deps.ts";
import { contract } from "./sci/golem-polygon-contract.ts";
let _dotenvCfg = undefined;
async function getDotEnv(key, ask) {
    if (_dotenvCfg) {
        return _dotenvCfg[key];
    }
    let d = await Deno.permissions.query({
        name: "read",
        path: ".env"
    });
    if (d.state == "prompt" && ask) {
        d = await Deno.permissions.request({
            name: "read",
            path: ".env"
        });
    }
    if (d.state === "granted") {
        _dotenvCfg = await dotenv.config({
            defaults: undefined,
            export: false
        });
    }
    if (_dotenvCfg) {
        return _dotenvCfg[key];
    }
    return undefined;
}
async function getEnv(key, options) {
    let dotenvValue = await getDotEnv(key);
    let permissionStatus = await Deno.permissions.query({
        name: "env",
        variable: key
    });
    if (permissionStatus.state === "prompt" && (options?.ask || options?.required)) {
        dotenvValue = await getDotEnv(key, options?.ask);
        if (!dotenvValue) {
            permissionStatus = await Deno.permissions.request({
                name: "env",
                variable: key
            });
        }
    }
    if (permissionStatus.state === "granted") {
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
async function getIntEnv(key, options) {
    const value = await getEnv(key, options);
    if (value) {
        return parseInt(value);
    }
}
export const config = {
    secret: await getEnv("ERC20_PRIVATE_KEY", {
        required: true
    }),
    rpc: await getEnv("WEB3_RPC") || "https://polygon-rpc.com/",
    /*
  Mainnet = "0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf";
  Mumbai = "0x2036807B0B3aaf5b1858EE822D0e111fDdac7018";
*/ contractAddress: await getEnv("ERC20_CONTRACT_ADDRESS") || "0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf",
    gasPrice: await getEnv("ERC20_GAS_PRICE") || "30.1",
    gasPriceUpperLimit: await getEnv("ERC20_GAS_PRICE_UPPER_LIMIT") || "180.1"
};
export const port = await getIntEnv("BACKEND_SERVICE_PORT") || 8000;
export const allowedOrigins = (await getEnv("ALLOWED_ORIGINS"))?.split(",");
export const gracePeriodMs = await getIntEnv("GRACE_PERIOD_MS");
export const blockMaxAgeS = await getIntEnv("BLOCK_MAX_AGE") || 5 * 60;
const web3 = setupWeb3Api(config.rpc);
export const glm = contract(web3, config.contractAddress);
export default web3;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL2NvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZXR1cFdlYjNBcGkgfSBmcm9tIFwiLi9zY2kudHNcIjtcbmltcG9ydCB7IGRvdGVudiB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IGNvbnRyYWN0IH0gZnJvbSBcIi4vc2NpL2dvbGVtLXBvbHlnb24tY29udHJhY3QudHNcIjtcblxubGV0IF9kb3RlbnZDZmc6IGRvdGVudi5Eb3RlbnZDb25maWcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbmFzeW5jIGZ1bmN0aW9uIGdldERvdEVudihrZXk6IHN0cmluZywgYXNrPzogYm9vbGVhbikge1xuICBpZiAoX2RvdGVudkNmZykge1xuICAgIHJldHVybiBfZG90ZW52Q2ZnW2tleV07XG4gIH1cbiAgbGV0IGQgPSBhd2FpdCBEZW5vLnBlcm1pc3Npb25zLnF1ZXJ5KHsgbmFtZTogXCJyZWFkXCIsIHBhdGg6IFwiLmVudlwiIH0pO1xuICBpZiAoZC5zdGF0ZSA9PSBcInByb21wdFwiICYmIGFzaykge1xuICAgIGQgPSBhd2FpdCBEZW5vLnBlcm1pc3Npb25zLnJlcXVlc3QoeyBuYW1lOiBcInJlYWRcIiwgcGF0aDogXCIuZW52XCIgfSk7XG4gIH1cbiAgaWYgKGQuc3RhdGUgPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgX2RvdGVudkNmZyA9IGF3YWl0IGRvdGVudi5jb25maWcoeyBkZWZhdWx0czogdW5kZWZpbmVkLCBleHBvcnQ6IGZhbHNlIH0pO1xuICB9XG4gIGlmIChfZG90ZW52Q2ZnKSB7XG4gICAgcmV0dXJuIF9kb3RlbnZDZmdba2V5XTtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRFbnYoXG4gIGtleTogc3RyaW5nLFxuICBvcHRpb25zPzogeyBhc2s/OiBib29sZWFuOyByZXF1aXJlZD86IGJvb2xlYW4gfVxuKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgbGV0IGRvdGVudlZhbHVlID0gYXdhaXQgZ2V0RG90RW52KGtleSk7XG4gIGxldCBwZXJtaXNzaW9uU3RhdHVzID0gYXdhaXQgRGVuby5wZXJtaXNzaW9ucy5xdWVyeSh7XG4gICAgbmFtZTogXCJlbnZcIixcbiAgICB2YXJpYWJsZToga2V5LFxuICB9KTtcblxuICBpZiAoXG4gICAgcGVybWlzc2lvblN0YXR1cy5zdGF0ZSA9PT0gXCJwcm9tcHRcIiAmJlxuICAgIChvcHRpb25zPy5hc2sgfHwgb3B0aW9ucz8ucmVxdWlyZWQpXG4gICkge1xuICAgIGRvdGVudlZhbHVlID0gYXdhaXQgZ2V0RG90RW52KGtleSwgb3B0aW9ucz8uYXNrKTtcbiAgICBpZiAoIWRvdGVudlZhbHVlKSB7XG4gICAgICBwZXJtaXNzaW9uU3RhdHVzID0gYXdhaXQgRGVuby5wZXJtaXNzaW9ucy5yZXF1ZXN0KHtcbiAgICAgICAgbmFtZTogXCJlbnZcIixcbiAgICAgICAgdmFyaWFibGU6IGtleSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAocGVybWlzc2lvblN0YXR1cy5zdGF0ZSA9PT0gXCJncmFudGVkXCIpIHtcbiAgICBjb25zdCB2YWx1ZSA9IERlbm8uZW52LmdldChrZXkpO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuICBpZiAoZG90ZW52VmFsdWUpIHtcbiAgICByZXR1cm4gZG90ZW52VmFsdWU7XG4gIH1cbiAgaWYgKG9wdGlvbnM/LnJlcXVpcmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBtaXNzaW5nICR7a2V5fSBlbnZpcm9ubWVudCB2YXJpYWJsZWApO1xuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEludEVudihcbiAga2V5OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiB7IGFzaz86IGJvb2xlYW47IHJlcXVpcmVkPzogYm9vbGVhbiB9XG4pOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4ge1xuICBjb25zdCB2YWx1ZSA9IGF3YWl0IGdldEVudihrZXksIG9wdGlvbnMpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gcGFyc2VJbnQodmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIHNlY3JldDogYXdhaXQgZ2V0RW52KFwiRVJDMjBfUFJJVkFURV9LRVlcIiwgeyByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgcnBjOiAoYXdhaXQgZ2V0RW52KFwiV0VCM19SUENcIikpIHx8IFwiaHR0cHM6Ly9wb2x5Z29uLXJwYy5jb20vXCIsXG5cbiAgLypcbiAgTWFpbm5ldCA9IFwiMHgwYjIyMGI4MmYzZWEzYjdmNmQ5YTFkOGFiNTg5MzBjMDY0YTJiNWJmXCI7XG4gIE11bWJhaSA9IFwiMHgyMDM2ODA3QjBCM2FhZjViMTg1OEVFODIyRDBlMTExZkRkYWM3MDE4XCI7XG4qL1xuXG4gIGNvbnRyYWN0QWRkcmVzczpcbiAgICAoYXdhaXQgZ2V0RW52KFwiRVJDMjBfQ09OVFJBQ1RfQUREUkVTU1wiKSkgfHxcbiAgICBcIjB4MGIyMjBiODJmM2VhM2I3ZjZkOWExZDhhYjU4OTMwYzA2NGEyYjViZlwiLFxuICBnYXNQcmljZTogKGF3YWl0IGdldEVudihcIkVSQzIwX0dBU19QUklDRVwiKSkgfHwgXCIzMC4xXCIsXG4gIGdhc1ByaWNlVXBwZXJMaW1pdDogKGF3YWl0IGdldEVudihcIkVSQzIwX0dBU19QUklDRV9VUFBFUl9MSU1JVFwiKSkgfHwgXCIxODAuMVwiLFxufTtcblxuZXhwb3J0IGNvbnN0IHBvcnQgPSAoYXdhaXQgZ2V0SW50RW52KFwiQkFDS0VORF9TRVJWSUNFX1BPUlRcIikpIHx8IDgwMDA7XG5cbmV4cG9ydCBjb25zdCBhbGxvd2VkT3JpZ2lucyA9IChhd2FpdCBnZXRFbnYoXCJBTExPV0VEX09SSUdJTlNcIikpPy5zcGxpdChcIixcIik7XG5cbmV4cG9ydCBjb25zdCBncmFjZVBlcmlvZE1zID0gYXdhaXQgZ2V0SW50RW52KFwiR1JBQ0VfUEVSSU9EX01TXCIpO1xuXG5leHBvcnQgY29uc3QgYmxvY2tNYXhBZ2VTID0gKGF3YWl0IGdldEludEVudihcIkJMT0NLX01BWF9BR0VcIikpIHx8IDUgKiA2MDtcblxuY29uc3Qgd2ViMyA9IHNldHVwV2ViM0FwaShjb25maWcucnBjKTtcblxuZXhwb3J0IGNvbnN0IGdsbSA9IGNvbnRyYWN0KHdlYjMsIGNvbmZpZy5jb250cmFjdEFkZHJlc3MpO1xuXG5leHBvcnQgZGVmYXVsdCB3ZWIzO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsWUFBWSxRQUFRLFdBQVc7QUFDeEMsU0FBUyxNQUFNLFFBQVEsWUFBWTtBQUNuQyxTQUFTLFFBQVEsUUFBUSxrQ0FBa0M7QUFFM0QsSUFBSSxhQUE4QztBQUVsRCxlQUFlLFVBQVUsR0FBVyxFQUFFLEdBQWE7SUFDakQsSUFBSSxZQUFZO1FBQ2QsT0FBTyxVQUFVLENBQUMsSUFBSTtJQUN4QjtJQUNBLElBQUksSUFBSSxNQUFNLEtBQUssWUFBWSxNQUFNO1FBQUUsTUFBTTtRQUFRLE1BQU07SUFBTztJQUNsRSxJQUFJLEVBQUUsU0FBUyxZQUFZLEtBQUs7UUFDOUIsSUFBSSxNQUFNLEtBQUssWUFBWSxRQUFRO1lBQUUsTUFBTTtZQUFRLE1BQU07UUFBTztJQUNsRTtJQUNBLElBQUksRUFBRSxVQUFVLFdBQVc7UUFDekIsYUFBYSxNQUFNLE9BQU8sT0FBTztZQUFFLFVBQVU7WUFBVyxRQUFRO1FBQU07SUFDeEU7SUFDQSxJQUFJLFlBQVk7UUFDZCxPQUFPLFVBQVUsQ0FBQyxJQUFJO0lBQ3hCO0lBQ0EsT0FBTztBQUNUO0FBRUEsZUFBZSxPQUNiLEdBQVcsRUFDWCxPQUErQztJQUUvQyxJQUFJLGNBQWMsTUFBTSxVQUFVO0lBQ2xDLElBQUksbUJBQW1CLE1BQU0sS0FBSyxZQUFZLE1BQU07UUFDbEQsTUFBTTtRQUNOLFVBQVU7SUFDWjtJQUVBLElBQ0UsaUJBQWlCLFVBQVUsWUFDM0IsQ0FBQyxTQUFTLE9BQU8sU0FBUyxRQUFRLEdBQ2xDO1FBQ0EsY0FBYyxNQUFNLFVBQVUsS0FBSyxTQUFTO1FBQzVDLElBQUksQ0FBQyxhQUFhO1lBQ2hCLG1CQUFtQixNQUFNLEtBQUssWUFBWSxRQUFRO2dCQUNoRCxNQUFNO2dCQUNOLFVBQVU7WUFDWjtRQUNGO0lBQ0Y7SUFDQSxJQUFJLGlCQUFpQixVQUFVLFdBQVc7UUFDeEMsTUFBTSxRQUFRLEtBQUssSUFBSSxJQUFJO1FBQzNCLElBQUksT0FBTztZQUNULE9BQU87UUFDVDtJQUNGO0lBQ0EsSUFBSSxhQUFhO1FBQ2YsT0FBTztJQUNUO0lBQ0EsSUFBSSxTQUFTLFVBQVU7UUFDckIsTUFBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxxQkFBcUIsQ0FBQztJQUN2RDtJQUNBLE9BQU87QUFDVDtBQUVBLGVBQWUsVUFDYixHQUFXLEVBQ1gsT0FBK0M7SUFFL0MsTUFBTSxRQUFRLE1BQU0sT0FBTyxLQUFLO0lBQ2hDLElBQUksT0FBTztRQUNULE9BQU8sU0FBUztJQUNsQjtBQUNGO0FBRUEsT0FBTyxNQUFNLFNBQVM7SUFDcEIsUUFBUSxNQUFNLE9BQU8scUJBQXFCO1FBQUUsVUFBVTtJQUFLO0lBQzNELEtBQUssQUFBQyxNQUFNLE9BQU8sZUFBZ0I7SUFFbkM7OztBQUdGLEdBRUUsaUJBQ0UsQUFBQyxNQUFNLE9BQU8sNkJBQ2Q7SUFDRixVQUFVLEFBQUMsTUFBTSxPQUFPLHNCQUF1QjtJQUMvQyxvQkFBb0IsQUFBQyxNQUFNLE9BQU8sa0NBQW1DO0FBQ3ZFLEVBQUU7QUFFRixPQUFPLE1BQU0sT0FBTyxBQUFDLE1BQU0sVUFBVSwyQkFBNEIsS0FBSztBQUV0RSxPQUFPLE1BQU0saUJBQWlCLENBQUMsTUFBTSxPQUFPLGtCQUFrQixHQUFHLE1BQU0sS0FBSztBQUU1RSxPQUFPLE1BQU0sZ0JBQWdCLE1BQU0sVUFBVSxtQkFBbUI7QUFFaEUsT0FBTyxNQUFNLGVBQWUsQUFBQyxNQUFNLFVBQVUsb0JBQXFCLElBQUksR0FBRztBQUV6RSxNQUFNLE9BQU8sYUFBYSxPQUFPO0FBRWpDLE9BQU8sTUFBTSxNQUFNLFNBQVMsTUFBTSxPQUFPLGlCQUFpQjtBQUUxRCxlQUFlLEtBQUsifQ==