// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { deferred } from "../async/deferred.ts";
/**
 * Merge multiple streams into a single one, not taking order into account.
 * If a stream ends before other ones, the other will continue adding data,
 * and the finished one will not add any more data.
 */ export function mergeReadableStreams(...streams) {
    const resolvePromises = streams.map(()=>deferred());
    return new ReadableStream({
        start (controller) {
            let mustClose = false;
            Promise.all(resolvePromises).then(()=>{
                controller.close();
            }).catch((error)=>{
                mustClose = true;
                controller.error(error);
            });
            for (const [key, stream] of Object.entries(streams)){
                (async ()=>{
                    try {
                        for await (const data of stream){
                            if (mustClose) {
                                break;
                            }
                            controller.enqueue(data);
                        }
                        resolvePromises[+key].resolve();
                    } catch (error) {
                        resolvePromises[+key].reject(error);
                    }
                })();
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvbWVyZ2VfcmVhZGFibGVfc3RyZWFtcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBkZWZlcnJlZCB9IGZyb20gXCIuLi9hc3luYy9kZWZlcnJlZC50c1wiO1xuXG4vKipcbiAqIE1lcmdlIG11bHRpcGxlIHN0cmVhbXMgaW50byBhIHNpbmdsZSBvbmUsIG5vdCB0YWtpbmcgb3JkZXIgaW50byBhY2NvdW50LlxuICogSWYgYSBzdHJlYW0gZW5kcyBiZWZvcmUgb3RoZXIgb25lcywgdGhlIG90aGVyIHdpbGwgY29udGludWUgYWRkaW5nIGRhdGEsXG4gKiBhbmQgdGhlIGZpbmlzaGVkIG9uZSB3aWxsIG5vdCBhZGQgYW55IG1vcmUgZGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlUmVhZGFibGVTdHJlYW1zPFQ+KFxuICAuLi5zdHJlYW1zOiBSZWFkYWJsZVN0cmVhbTxUPltdXG4pOiBSZWFkYWJsZVN0cmVhbTxUPiB7XG4gIGNvbnN0IHJlc29sdmVQcm9taXNlcyA9IHN0cmVhbXMubWFwKCgpID0+IGRlZmVycmVkPHZvaWQ+KCkpO1xuICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtPFQ+KHtcbiAgICBzdGFydChjb250cm9sbGVyKSB7XG4gICAgICBsZXQgbXVzdENsb3NlID0gZmFsc2U7XG4gICAgICBQcm9taXNlLmFsbChyZXNvbHZlUHJvbWlzZXMpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBtdXN0Q2xvc2UgPSB0cnVlO1xuICAgICAgICAgIGNvbnRyb2xsZXIuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgc3RyZWFtXSBvZiBPYmplY3QuZW50cmllcyhzdHJlYW1zKSkge1xuICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGRhdGEgb2Ygc3RyZWFtKSB7XG4gICAgICAgICAgICAgIGlmIChtdXN0Q2xvc2UpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlUHJvbWlzZXNbK2tleV0ucmVzb2x2ZSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXNvbHZlUHJvbWlzZXNbK2tleV0ucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQVMsUUFBUSxRQUFRLHVCQUF1QjtBQUVoRDs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLHFCQUNkLEdBQUcsT0FBNEI7SUFFL0IsTUFBTSxrQkFBa0IsUUFBUSxJQUFJLElBQU07SUFDMUMsT0FBTyxJQUFJLGVBQWtCO1FBQzNCLE9BQU0sVUFBVTtZQUNkLElBQUksWUFBWTtZQUNoQixRQUFRLElBQUksaUJBQ1QsS0FBSztnQkFDSixXQUFXO1lBQ2IsR0FDQyxNQUFNLENBQUM7Z0JBQ04sWUFBWTtnQkFDWixXQUFXLE1BQU07WUFDbkI7WUFDRixLQUFLLE1BQU0sQ0FBQyxLQUFLLE9BQU8sSUFBSSxPQUFPLFFBQVEsU0FBVTtnQkFDbEQsQ0FBQTtvQkFDQyxJQUFJO3dCQUNGLFdBQVcsTUFBTSxRQUFRLE9BQVE7NEJBQy9CLElBQUksV0FBVztnQ0FDYjs0QkFDRjs0QkFDQSxXQUFXLFFBQVE7d0JBQ3JCO3dCQUNBLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDeEIsRUFBRSxPQUFPLE9BQU87d0JBQ2QsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU87b0JBQy9CO2dCQUNGLENBQUE7WUFDRjtRQUNGO0lBQ0Y7QUFDRiJ9