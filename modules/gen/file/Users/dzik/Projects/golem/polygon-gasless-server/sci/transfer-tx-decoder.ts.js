import { abi, utils } from '../sci.ts';
const ABI = {
    name: 'transfer',
    type: 'function',
    inputs: [
        {
            name: 'recipient',
            type: 'address'
        },
        {
            name: 'amount',
            type: 'uint256'
        }
    ]
};
const TRANSFER_SIGNATURE = abi.encodeFunctionSignature(ABI);
export function decodeTransfer(hexBytes) {
    const bytes = utils.hexToBytes(hexBytes);
    const functionSignature = utils.bytesToHex(bytes.splice(0, 4));
    if (functionSignature === TRANSFER_SIGNATURE) {
        try {
            const { '0': recipient , '1': amount  } = abi.decodeParameters([
                'address',
                'uint256'
            ], utils.bytesToHex(bytes));
            return {
                recipient,
                amount
            };
        } catch (e) {
            if (e instanceof Error) {
                return undefined;
            }
            throw e;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NjaS90cmFuc2Zlci10eC1kZWNvZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFiaSwgQWJpSXRlbSwgdXRpbHMgfSBmcm9tICcuLi9zY2kudHMnO1xuXG5leHBvcnQgdHlwZSBUcmFuc2ZlckFyZ3MgPSB7XG4gICAgcmVjaXBpZW50OiBzdHJpbmc7XG4gICAgYW1vdW50OiBzdHJpbmc7XG59O1xuXG5jb25zdCBBQkk6IEFiaUl0ZW0gPSB7XG4gICAgbmFtZTogJ3RyYW5zZmVyJyxcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGlucHV0czogW3sgbmFtZTogJ3JlY2lwaWVudCcsIHR5cGU6ICdhZGRyZXNzJyB9LCB7IG5hbWU6ICdhbW91bnQnLCB0eXBlOiAndWludDI1NicgfV0sXG59O1xuXG5jb25zdCBUUkFOU0ZFUl9TSUdOQVRVUkUgPSBhYmkuZW5jb2RlRnVuY3Rpb25TaWduYXR1cmUoQUJJKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVRyYW5zZmVyKGhleEJ5dGVzOiBzdHJpbmcpOiBUcmFuc2ZlckFyZ3MgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGJ5dGVzID0gdXRpbHMuaGV4VG9CeXRlcyhoZXhCeXRlcyk7XG4gICAgY29uc3QgZnVuY3Rpb25TaWduYXR1cmUgPSB1dGlscy5ieXRlc1RvSGV4KGJ5dGVzLnNwbGljZSgwLCA0KSk7XG4gICAgaWYgKGZ1bmN0aW9uU2lnbmF0dXJlID09PSBUUkFOU0ZFUl9TSUdOQVRVUkUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgJzAnOiByZWNpcGllbnQsICcxJzogYW1vdW50IH0gPSBhYmkuZGVjb2RlUGFyYW1ldGVycyhbJ2FkZHJlc3MnLCAndWludDI1NiddLCB1dGlscy5ieXRlc1RvSGV4KGJ5dGVzKSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHJlY2lwaWVudCxcbiAgICAgICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxHQUFHLEVBQVcsS0FBSyxRQUFRLFlBQVk7QUFPaEQsTUFBTSxNQUFlO0lBQ2pCLE1BQU07SUFDTixNQUFNO0lBQ04sUUFBUTtRQUFDO1lBQUUsTUFBTTtZQUFhLE1BQU07UUFBVTtRQUFHO1lBQUUsTUFBTTtZQUFVLE1BQU07UUFBVTtLQUFFO0FBQ3pGO0FBRUEsTUFBTSxxQkFBcUIsSUFBSSx3QkFBd0I7QUFFdkQsT0FBTyxTQUFTLGVBQWUsUUFBZ0I7SUFDM0MsTUFBTSxRQUFRLE1BQU0sV0FBVztJQUMvQixNQUFNLG9CQUFvQixNQUFNLFdBQVcsTUFBTSxPQUFPLEdBQUc7SUFDM0QsSUFBSSxzQkFBc0Isb0JBQW9CO1FBQzFDLElBQUk7WUFDQSxNQUFNLEVBQUUsS0FBSyxVQUFTLEVBQUUsS0FBSyxPQUFNLEVBQUUsR0FBRyxJQUFJLGlCQUFpQjtnQkFBQztnQkFBVzthQUFVLEVBQUUsTUFBTSxXQUFXO1lBQ3RHLE9BQU87Z0JBQ0g7Z0JBQ0E7WUFDSjtRQUNKLEVBQUUsT0FBTyxHQUFHO1lBQ1IsSUFBSSxhQUFhLE9BQU87Z0JBQ3BCLE9BQU87WUFDWDtZQUNBLE1BQU07UUFDVjtJQUNKO0FBQ0oifQ==