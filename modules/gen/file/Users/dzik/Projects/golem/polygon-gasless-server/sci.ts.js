// Smart Contract Interface
import Web3Api from 'https://deno.land/x/web3@v0.10.0/mod.ts';
export function setupWeb3Api(providerUrl) {
    return new Web3Api(providerUrl);
}
export const utils = Web3Api.utils;
export const abi = new Web3Api().eth.abi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NjaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTbWFydCBDb250cmFjdCBJbnRlcmZhY2VcbmltcG9ydCBXZWIzQXBpIGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvd2ViM0B2MC4xMC4wL21vZC50cyc7XG5pbXBvcnQgKiBhcyB3ZWIzX3V0aWxzIGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvd2ViM0B2MC45LjIvcGFja2FnZXMvd2ViMy11dGlscy90eXBlcy9pbmRleC5kLnRzJztcbmltcG9ydCAqIGFzIHdlYjNfZXRoX2NvbnRyYWN0IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvd2ViM0B2MC45LjIvcGFja2FnZXMvd2ViMy1ldGgtY29udHJhY3QvdHlwZXMvaW5kZXguZC50cyc7XG5pbXBvcnQgKiBhcyB3ZWIzX2NvcmUgZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC93ZWIzQHYwLjkuMi9wYWNrYWdlcy93ZWIzLWNvcmUvdHlwZXMvaW5kZXguZC50cyc7XG5pbXBvcnQgV2ViM1R5cGUgZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC93ZWIzQHYwLjkuMi9wYWNrYWdlcy93ZWIzL3R5cGVzL2luZGV4LmQudHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBXZWIzQXBpKHByb3ZpZGVyVXJsOiBzdHJpbmcpOiBXZWIzIHtcbiAgICByZXR1cm4gbmV3IFdlYjNBcGkocHJvdmlkZXJVcmwpO1xufVxuXG5leHBvcnQgdHlwZSBQb2x5Z29uTmV0d29yayA9ICdtYWlubmV0JyB8ICd0ZXN0bmV0JztcbmV4cG9ydCB0eXBlIFdlYjMgPSBXZWIzVHlwZTtcbmV4cG9ydCB0eXBlIEFiaUl0ZW0gPSB3ZWIzX3V0aWxzLkFiaUl0ZW07XG5leHBvcnQgdHlwZSBDb250cmFjdCA9IHdlYjNfZXRoX2NvbnRyYWN0LkNvbnRyYWN0O1xuZXhwb3J0IHR5cGUgVHJhbnNhY3Rpb25SZWNlaXB0ID0gd2ViM19jb3JlLlRyYW5zYWN0aW9uUmVjZWlwdDtcbmV4cG9ydCBjb25zdCB1dGlscyA9IFdlYjNBcGkudXRpbHM7XG5leHBvcnQgY29uc3QgYWJpID0gbmV3IFdlYjNBcGkoKS5ldGguYWJpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDJCQUEyQjtBQUMzQixPQUFPLGFBQWEsMENBQTBDO0FBTTlELE9BQU8sU0FBUyxhQUFhLFdBQW1CO0lBQzVDLE9BQU8sSUFBSSxRQUFRO0FBQ3ZCO0FBT0EsT0FBTyxNQUFNLFFBQVEsUUFBUSxNQUFNO0FBQ25DLE9BQU8sTUFBTSxNQUFNLElBQUksVUFBVSxJQUFJLElBQUkifQ==