export var util;
(function(util) {
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    var arrayToEnum = util.arrayToEnum = (items)=>{
        const obj = {};
        for (const item of items){
            obj[item] = item;
        }
        return obj;
    };
    var getValidEnumValues = util.getValidEnumValues = (obj)=>{
        const validKeys = objectKeys(obj).filter((k)=>typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys){
            filtered[k] = obj[k];
        }
        return objectValues(filtered);
    };
    var objectValues = util.objectValues = (obj)=>{
        return objectKeys(obj).map(function(e) {
            return obj[e];
        });
    };
    var objectKeys = util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
     ? (obj)=>Object.keys(obj) // eslint-disable-line ban/ban
     : (object)=>{
        const keys = [];
        for(const key in object){
            if (Object.prototype.hasOwnProperty.call(object, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
    var find = util.find = (arr, checker)=>{
        for (const item of arr){
            if (checker(item)) return item;
        }
        return undefined;
    };
    var isInteger = util.isInteger = typeof Number.isInteger === "function" ? (val)=>Number.isInteger(val) // eslint-disable-line ban/ban
     : (val)=>typeof val === "number" && isFinite(val) && Math.floor(val) === val;
})(util || (util = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvem9kQHYzLjE0LjQvaGVscGVycy91dGlsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBuYW1lc3BhY2UgdXRpbCB7XG4gIGV4cG9ydCB0eXBlIEFzc2VydEVxdWFsPFQsIEV4cGVjdGVkPiA9IFtUXSBleHRlbmRzIFtFeHBlY3RlZF1cbiAgICA/IFtFeHBlY3RlZF0gZXh0ZW5kcyBbVF1cbiAgICAgID8gdHJ1ZVxuICAgICAgOiBmYWxzZVxuICAgIDogZmFsc2U7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5ldmVyKF94OiBuZXZlcik6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfVxuXG4gIGV4cG9ydCB0eXBlIE9taXQ8VCwgSyBleHRlbmRzIGtleW9mIFQ+ID0gUGljazxULCBFeGNsdWRlPGtleW9mIFQsIEs+PjtcbiAgZXhwb3J0IHR5cGUgT21pdEtleXM8VCwgSyBleHRlbmRzIHN0cmluZz4gPSBQaWNrPFQsIEV4Y2x1ZGU8a2V5b2YgVCwgSz4+O1xuICBleHBvcnQgdHlwZSBNYWtlUGFydGlhbDxULCBLIGV4dGVuZHMga2V5b2YgVD4gPSBPbWl0PFQsIEs+ICZcbiAgICBQYXJ0aWFsPFBpY2s8VCwgSz4+O1xuXG4gIGV4cG9ydCBjb25zdCBhcnJheVRvRW51bSA9IDxUIGV4dGVuZHMgc3RyaW5nLCBVIGV4dGVuZHMgW1QsIC4uLlRbXV0+KFxuICAgIGl0ZW1zOiBVXG4gICk6IHsgW2sgaW4gVVtudW1iZXJdXTogayB9ID0+IHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgb2JqW2l0ZW1dID0gaXRlbTtcbiAgICB9XG4gICAgcmV0dXJuIG9iaiBhcyBhbnk7XG4gIH07XG5cbiAgZXhwb3J0IGNvbnN0IGdldFZhbGlkRW51bVZhbHVlcyA9IChvYmo6IGFueSkgPT4ge1xuICAgIGNvbnN0IHZhbGlkS2V5cyA9IG9iamVjdEtleXMob2JqKS5maWx0ZXIoXG4gICAgICAoazogYW55KSA9PiB0eXBlb2Ygb2JqW29ialtrXV0gIT09IFwibnVtYmVyXCJcbiAgICApO1xuICAgIGNvbnN0IGZpbHRlcmVkOiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgb2YgdmFsaWRLZXlzKSB7XG4gICAgICBmaWx0ZXJlZFtrXSA9IG9ialtrXTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFZhbHVlcyhmaWx0ZXJlZCk7XG4gIH07XG5cbiAgZXhwb3J0IGNvbnN0IG9iamVjdFZhbHVlcyA9IChvYmo6IGFueSkgPT4ge1xuICAgIHJldHVybiBvYmplY3RLZXlzKG9iaikubWFwKGZ1bmN0aW9uIChlKSB7XG4gICAgICByZXR1cm4gb2JqW2VdO1xuICAgIH0pO1xuICB9O1xuXG4gIGV4cG9ydCBjb25zdCBvYmplY3RLZXlzOiBPYmplY3RDb25zdHJ1Y3RvcltcImtleXNcIl0gPVxuICAgIHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gXCJmdW5jdGlvblwiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFuL2JhblxuICAgICAgPyAob2JqOiBhbnkpID0+IE9iamVjdC5rZXlzKG9iaikgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYW4vYmFuXG4gICAgICA6IChvYmplY3Q6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgICAgfTtcblxuICBleHBvcnQgY29uc3QgZmluZCA9IDxUPihcbiAgICBhcnI6IFRbXSxcbiAgICBjaGVja2VyOiAoYXJnOiBUKSA9PiBhbnlcbiAgKTogVCB8IHVuZGVmaW5lZCA9PiB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGFycikge1xuICAgICAgaWYgKGNoZWNrZXIoaXRlbSkpIHJldHVybiBpdGVtO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIGV4cG9ydCB0eXBlIGlkZW50aXR5PFQ+ID0gVDtcbiAgZXhwb3J0IHR5cGUgZmxhdHRlbjxUIGV4dGVuZHMgb2JqZWN0PiA9IGlkZW50aXR5PHsgW2sgaW4ga2V5b2YgVF06IFRba10gfT47XG4gIGV4cG9ydCB0eXBlIG5vVW5kZWZpbmVkPFQ+ID0gVCBleHRlbmRzIHVuZGVmaW5lZCA/IG5ldmVyIDogVDtcblxuICBleHBvcnQgY29uc3QgaXNJbnRlZ2VyOiBOdW1iZXJDb25zdHJ1Y3RvcltcImlzSW50ZWdlclwiXSA9XG4gICAgdHlwZW9mIE51bWJlci5pc0ludGVnZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyAodmFsKSA9PiBOdW1iZXIuaXNJbnRlZ2VyKHZhbCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYW4vYmFuXG4gICAgICA6ICh2YWwpID0+XG4gICAgICAgICAgdHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIiAmJiBpc0Zpbml0ZSh2YWwpICYmIE1hdGguZmxvb3IodmFsKSA9PT0gdmFsO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBVSxLQTJFaEI7O0lBcEVRLFNBQVMsWUFBWSxFQUFTO1FBQ25DLE1BQU0sSUFBSTtJQUNaO1NBRmdCLGNBQUE7UUFTSCxtQkFBQSxjQUFjLENBQ3pCO1FBRUEsTUFBTSxNQUFXLENBQUM7UUFDbEIsS0FBSyxNQUFNLFFBQVEsTUFBTztZQUN4QixHQUFHLENBQUMsS0FBSyxHQUFHO1FBQ2Q7UUFDQSxPQUFPO0lBQ1Q7UUFFYSwwQkFBQSxxQkFBcUIsQ0FBQztRQUNqQyxNQUFNLFlBQVksV0FBVyxLQUFLLE9BQ2hDLENBQUMsSUFBVyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUs7UUFFckMsTUFBTSxXQUFnQixDQUFDO1FBQ3ZCLEtBQUssTUFBTSxLQUFLLFVBQVc7WUFDekIsUUFBUSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRTtRQUN0QjtRQUNBLE9BQU8sYUFBYTtJQUN0QjtRQUVhLG9CQUFBLGVBQWUsQ0FBQztRQUMzQixPQUFPLFdBQVcsS0FBSyxJQUFJLFNBQVUsQ0FBQztZQUNwQyxPQUFPLEdBQUcsQ0FBQyxFQUFFO1FBQ2Y7SUFDRjtRQUVhLGtCQUFBLGFBQ1gsT0FBTyxPQUFPLFNBQVMsV0FBVyw4QkFBOEI7T0FDNUQsQ0FBQyxNQUFhLE9BQU8sS0FBSyxLQUFLLDhCQUE4QjtPQUM3RCxDQUFDO1FBQ0MsTUFBTSxPQUFPLEVBQUU7UUFDZixJQUFLLE1BQU0sT0FBTyxPQUFRO1lBQ3hCLElBQUksT0FBTyxVQUFVLGVBQWUsS0FBSyxRQUFRLE1BQU07Z0JBQ3JELEtBQUssS0FBSztZQUNaO1FBQ0Y7UUFDQSxPQUFPO0lBQ1Q7UUFFTyxZQUFBLE9BQU8sQ0FDbEIsS0FDQTtRQUVBLEtBQUssTUFBTSxRQUFRLElBQUs7WUFDdEIsSUFBSSxRQUFRLE9BQU8sT0FBTztRQUM1QjtRQUNBLE9BQU87SUFDVDtRQU1hLGlCQUFBLFlBQ1gsT0FBTyxPQUFPLGNBQWMsYUFDeEIsQ0FBQyxNQUFRLE9BQU8sVUFBVSxLQUFLLDhCQUE4QjtPQUM3RCxDQUFDLE1BQ0MsT0FBTyxRQUFRLFlBQVksU0FBUyxRQUFRLEtBQUssTUFBTSxTQUFTO0dBMUV6RCxTQUFBIn0=