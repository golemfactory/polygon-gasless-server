// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Reader utility for combining multiple readers */ export class MultiReader {
    #readers;
    #currentIndex = 0;
    constructor(readers){
        this.#readers = [
            ...readers
        ];
    }
    async read(p) {
        const r = this.#readers[this.#currentIndex];
        if (!r) return null;
        const result = await r.read(p);
        if (result === null) {
            this.#currentIndex++;
            return 0;
        }
        return result;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL211bHRpX3JlYWRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgdHlwZSB7IFJlYWRlciB9IGZyb20gXCIuLi90eXBlcy5kLnRzXCI7XG5cbi8qKiBSZWFkZXIgdXRpbGl0eSBmb3IgY29tYmluaW5nIG11bHRpcGxlIHJlYWRlcnMgKi9cbmV4cG9ydCBjbGFzcyBNdWx0aVJlYWRlciBpbXBsZW1lbnRzIFJlYWRlciB7XG4gIHJlYWRvbmx5ICNyZWFkZXJzOiBSZWFkZXJbXTtcbiAgI2N1cnJlbnRJbmRleCA9IDA7XG5cbiAgY29uc3RydWN0b3IocmVhZGVyczogUmVhZGVyW10pIHtcbiAgICB0aGlzLiNyZWFkZXJzID0gWy4uLnJlYWRlcnNdO1xuICB9XG5cbiAgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgY29uc3QgciA9IHRoaXMuI3JlYWRlcnNbdGhpcy4jY3VycmVudEluZGV4XTtcbiAgICBpZiAoIXIpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHIucmVhZChwKTtcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICB0aGlzLiNjdXJyZW50SW5kZXgrKztcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUlyQyxrREFBa0QsR0FDbEQsT0FBTyxNQUFNO0lBQ0YsQ0FBQyxPQUFPLENBQVc7SUFDNUIsQ0FBQyxZQUFZLEdBQUcsRUFBRTtJQUVsQixZQUFZLE9BQWlCLENBQUU7UUFDN0IsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHO2VBQUk7U0FBUTtJQUM5QjtJQUVBLE1BQU0sS0FBSyxDQUFhLEVBQTBCO1FBQ2hELE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsWUFBWSxDQUFDO1FBQzNDLElBQUksQ0FBQyxHQUFHLE9BQU87UUFDZixNQUFNLFNBQVMsTUFBTSxFQUFFLEtBQUs7UUFDNUIsSUFBSSxXQUFXLE1BQU07WUFDbkIsSUFBSSxDQUFDLENBQUMsWUFBWTtZQUNsQixPQUFPO1FBQ1Q7UUFDQSxPQUFPO0lBQ1Q7QUFDRiJ9