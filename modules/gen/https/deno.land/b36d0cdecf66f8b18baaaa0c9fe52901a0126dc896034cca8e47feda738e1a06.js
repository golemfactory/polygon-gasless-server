/*!
 * Adapted directly from media-typer at https://github.com/jshttp/media-typer/
 * which is licensed as follows:
 *
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */ const SUBTYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/;
const TYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/;
const TYPE_REGEXP = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
class MediaType {
    type;
    subtype;
    suffix;
    constructor(type, subtype, suffix){
        this.type = type;
        this.subtype = subtype;
        this.suffix = suffix;
    }
}
/** Given a media type object, return a media type string.
 *
 *       format({
 *         type: "text",
 *         subtype: "html"
 *       }); // returns "text/html"
 */ export function format(obj) {
    const { subtype , suffix , type  } = obj;
    if (!TYPE_NAME_REGEXP.test(type)) {
        throw new TypeError("Invalid type.");
    }
    if (!SUBTYPE_NAME_REGEXP.test(subtype)) {
        throw new TypeError("Invalid subtype.");
    }
    let str = `${type}/${subtype}`;
    if (suffix) {
        if (!TYPE_NAME_REGEXP.test(suffix)) {
            throw new TypeError("Invalid suffix.");
        }
        str += `+${suffix}`;
    }
    return str;
}
/** Given a media type string, return a media type object.
 *
 *       parse("application/json-patch+json");
 *       // returns {
 *       //   type: "application",
 *       //   subtype: "json-patch",
 *       //   suffix: "json"
 *       // }
 */ export function parse(str) {
    const match = TYPE_REGEXP.exec(str.toLowerCase());
    if (!match) {
        throw new TypeError("Invalid media type.");
    }
    let [, type, subtype] = match;
    let suffix;
    const idx = subtype.lastIndexOf("+");
    if (idx !== -1) {
        suffix = subtype.substr(idx + 1);
        subtype = subtype.substr(0, idx);
    }
    return new MediaType(type, subtype, suffix);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvbWVkaWFUeXBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEFkYXB0ZWQgZGlyZWN0bHkgZnJvbSBtZWRpYS10eXBlciBhdCBodHRwczovL2dpdGh1Yi5jb20vanNodHRwL21lZGlhLXR5cGVyL1xuICogd2hpY2ggaXMgbGljZW5zZWQgYXMgZm9sbG93czpcbiAqXG4gKiBtZWRpYS10eXBlclxuICogQ29weXJpZ2h0KGMpIDIwMTQtMjAxNyBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuY29uc3QgU1VCVFlQRV9OQU1FX1JFR0VYUCA9IC9eW0EtWmEtejAtOV1bQS1aYS16MC05ISMkJl5fLi1dezAsMTI2fSQvO1xuY29uc3QgVFlQRV9OQU1FX1JFR0VYUCA9IC9eW0EtWmEtejAtOV1bQS1aYS16MC05ISMkJl5fLV17MCwxMjZ9JC87XG5jb25zdCBUWVBFX1JFR0VYUCA9XG4gIC9eICooW0EtWmEtejAtOV1bQS1aYS16MC05ISMkJl5fLV17MCwxMjZ9KVxcLyhbQS1aYS16MC05XVtBLVphLXowLTkhIyQmXl8uKy1dezAsMTI2fSkgKiQvO1xuXG5jbGFzcyBNZWRpYVR5cGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogVGhlIHR5cGUgb2YgdGhlIG1lZGlhIHR5cGUuICovXG4gICAgcHVibGljIHR5cGU6IHN0cmluZyxcbiAgICAvKiogVGhlIHN1YnR5cGUgb2YgdGhlIG1lZGlhIHR5cGUuICovXG4gICAgcHVibGljIHN1YnR5cGU6IHN0cmluZyxcbiAgICAvKiogVGhlIG9wdGlvbmFsIHN1ZmZpeCBvZiB0aGUgbWVkaWEgdHlwZS4gKi9cbiAgICBwdWJsaWMgc3VmZml4Pzogc3RyaW5nLFxuICApIHt9XG59XG5cbi8qKiBHaXZlbiBhIG1lZGlhIHR5cGUgb2JqZWN0LCByZXR1cm4gYSBtZWRpYSB0eXBlIHN0cmluZy5cbiAqXG4gKiAgICAgICBmb3JtYXQoe1xuICogICAgICAgICB0eXBlOiBcInRleHRcIixcbiAqICAgICAgICAgc3VidHlwZTogXCJodG1sXCJcbiAqICAgICAgIH0pOyAvLyByZXR1cm5zIFwidGV4dC9odG1sXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChvYmo6IE1lZGlhVHlwZSk6IHN0cmluZyB7XG4gIGNvbnN0IHsgc3VidHlwZSwgc3VmZml4LCB0eXBlIH0gPSBvYmo7XG5cbiAgaWYgKCFUWVBFX05BTUVfUkVHRVhQLnRlc3QodHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCB0eXBlLlwiKTtcbiAgfVxuICBpZiAoIVNVQlRZUEVfTkFNRV9SRUdFWFAudGVzdChzdWJ0eXBlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHN1YnR5cGUuXCIpO1xuICB9XG5cbiAgbGV0IHN0ciA9IGAke3R5cGV9LyR7c3VidHlwZX1gO1xuXG4gIGlmIChzdWZmaXgpIHtcbiAgICBpZiAoIVRZUEVfTkFNRV9SRUdFWFAudGVzdChzdWZmaXgpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBzdWZmaXguXCIpO1xuICAgIH1cblxuICAgIHN0ciArPSBgKyR7c3VmZml4fWA7XG4gIH1cblxuICByZXR1cm4gc3RyO1xufVxuXG4vKiogR2l2ZW4gYSBtZWRpYSB0eXBlIHN0cmluZywgcmV0dXJuIGEgbWVkaWEgdHlwZSBvYmplY3QuXG4gKlxuICogICAgICAgcGFyc2UoXCJhcHBsaWNhdGlvbi9qc29uLXBhdGNoK2pzb25cIik7XG4gKiAgICAgICAvLyByZXR1cm5zIHtcbiAqICAgICAgIC8vICAgdHlwZTogXCJhcHBsaWNhdGlvblwiLFxuICogICAgICAgLy8gICBzdWJ0eXBlOiBcImpzb24tcGF0Y2hcIixcbiAqICAgICAgIC8vICAgc3VmZml4OiBcImpzb25cIlxuICogICAgICAgLy8gfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2Uoc3RyOiBzdHJpbmcpOiBNZWRpYVR5cGUge1xuICBjb25zdCBtYXRjaCA9IFRZUEVfUkVHRVhQLmV4ZWMoc3RyLnRvTG93ZXJDYXNlKCkpO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBtZWRpYSB0eXBlLlwiKTtcbiAgfVxuXG4gIGxldCBbLCB0eXBlLCBzdWJ0eXBlXSA9IG1hdGNoO1xuICBsZXQgc3VmZml4OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3QgaWR4ID0gc3VidHlwZS5sYXN0SW5kZXhPZihcIitcIik7XG4gIGlmIChpZHggIT09IC0xKSB7XG4gICAgc3VmZml4ID0gc3VidHlwZS5zdWJzdHIoaWR4ICsgMSk7XG4gICAgc3VidHlwZSA9IHN1YnR5cGUuc3Vic3RyKDAsIGlkeCk7XG4gIH1cblxuICByZXR1cm4gbmV3IE1lZGlhVHlwZSh0eXBlLCBzdWJ0eXBlLCBzdWZmaXgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0NBT0MsR0FFRCxNQUFNLHNCQUFzQjtBQUM1QixNQUFNLG1CQUFtQjtBQUN6QixNQUFNLGNBQ0o7QUFFRixNQUFNO0lBR0s7SUFFQTtJQUVBO0lBTlQsWUFFUyxNQUVBLFNBRUEsT0FDUDtvQkFMTzt1QkFFQTtzQkFFQTtJQUNOO0FBQ0w7QUFFQTs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFjO0lBQ25DLE1BQU0sRUFBRSxRQUFPLEVBQUUsT0FBTSxFQUFFLEtBQUksRUFBRSxHQUFHO0lBRWxDLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxPQUFPO1FBQ2hDLE1BQU0sSUFBSSxVQUFVO0lBQ3RCO0lBQ0EsSUFBSSxDQUFDLG9CQUFvQixLQUFLLFVBQVU7UUFDdEMsTUFBTSxJQUFJLFVBQVU7SUFDdEI7SUFFQSxJQUFJLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQztJQUU5QixJQUFJLFFBQVE7UUFDVixJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUztZQUNsQyxNQUFNLElBQUksVUFBVTtRQUN0QjtRQUVBLE9BQU8sQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3JCO0lBRUEsT0FBTztBQUNUO0FBRUE7Ozs7Ozs7O0NBUUMsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0lBQy9CLE1BQU0sUUFBUSxZQUFZLEtBQUssSUFBSTtJQUVuQyxJQUFJLENBQUMsT0FBTztRQUNWLE1BQU0sSUFBSSxVQUFVO0lBQ3RCO0lBRUEsSUFBSSxHQUFHLE1BQU0sUUFBUSxHQUFHO0lBQ3hCLElBQUk7SUFFSixNQUFNLE1BQU0sUUFBUSxZQUFZO0lBQ2hDLElBQUksUUFBUSxDQUFDLEdBQUc7UUFDZCxTQUFTLFFBQVEsT0FBTyxNQUFNO1FBQzlCLFVBQVUsUUFBUSxPQUFPLEdBQUc7SUFDOUI7SUFFQSxPQUFPLElBQUksVUFBVSxNQUFNLFNBQVM7QUFDdEMifQ==