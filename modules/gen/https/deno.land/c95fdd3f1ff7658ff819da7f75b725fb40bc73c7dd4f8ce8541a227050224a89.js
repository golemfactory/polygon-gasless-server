export var errorUtil;
(function(errorUtil) {
    var errToObj = errorUtil.errToObj = (message)=>typeof message === "string" ? {
            message
        } : message || {};
    var toString = errorUtil.toString = (message)=>typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvem9kQHYzLjE0LjQvaGVscGVycy9lcnJvclV0aWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IG5hbWVzcGFjZSBlcnJvclV0aWwge1xuICBleHBvcnQgdHlwZSBFcnJNZXNzYWdlID0gc3RyaW5nIHwgeyBtZXNzYWdlPzogc3RyaW5nIH07XG4gIGV4cG9ydCBjb25zdCBlcnJUb09iaiA9IChtZXNzYWdlPzogRXJyTWVzc2FnZSkgPT5cbiAgICB0eXBlb2YgbWVzc2FnZSA9PT0gXCJzdHJpbmdcIiA/IHsgbWVzc2FnZSB9IDogbWVzc2FnZSB8fCB7fTtcbiAgZXhwb3J0IGNvbnN0IHRvU3RyaW5nID0gKG1lc3NhZ2U/OiBFcnJNZXNzYWdlKTogc3RyaW5nIHwgdW5kZWZpbmVkID0+XG4gICAgdHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIgPyBtZXNzYWdlIDogbWVzc2FnZT8ubWVzc2FnZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLElBQVUsVUFNaEI7O1FBSmMscUJBQUEsV0FBVyxDQUFDLFVBQ3ZCLE9BQU8sWUFBWSxXQUFXO1lBQUU7UUFBUSxJQUFJLFdBQVcsQ0FBQztRQUM3QyxxQkFBQSxXQUFXLENBQUMsVUFDdkIsT0FBTyxZQUFZLFdBQVcsVUFBVSxTQUFTO0dBTHBDLGNBQUEifQ==