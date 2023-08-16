// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Contains the enum {@linkcode Status} which enumerates standard HTTP status
 * codes and provides several type guards for handling status codes with type
 * safety.
 *
 * @example
 * ```ts
 * import {
 *   Status,
 *   STATUS_TEXT,
 * } from "https://deno.land/std@$STD_VERSION/http/http_status.ts";
 *
 * console.log(Status.NotFound); //=> 404
 * console.log(STATUS_TEXT[Status.NotFound]); //=> "Not Found"
 * ```
 *
 * ```ts
 * import { isErrorStatus } from "https://deno.land/std@$STD_VERSION/http/http_status.ts";
 *
 * const res = await fetch("https://example.com/");
 *
 * if (isErrorStatus(res.status)) {
 *   // error handling here...
 * }
 * ```
 *
 * @module
 */ /** Standard HTTP status codes. */ export var Status;
(function(Status) {
    Status[Status[/** RFC 7231, 6.2.1 */ "Continue"] = 100] = "Continue";
    Status[Status[/** RFC 7231, 6.2.2 */ "SwitchingProtocols"] = 101] = "SwitchingProtocols";
    Status[Status[/** RFC 2518, 10.1 */ "Processing"] = 102] = "Processing";
    Status[Status[/** RFC 8297 **/ "EarlyHints"] = 103] = "EarlyHints";
    Status[Status[/** RFC 7231, 6.3.1 */ "OK"] = 200] = "OK";
    Status[Status[/** RFC 7231, 6.3.2 */ "Created"] = 201] = "Created";
    Status[Status[/** RFC 7231, 6.3.3 */ "Accepted"] = 202] = "Accepted";
    Status[Status[/** RFC 7231, 6.3.4 */ "NonAuthoritativeInfo"] = 203] = "NonAuthoritativeInfo";
    Status[Status[/** RFC 7231, 6.3.5 */ "NoContent"] = 204] = "NoContent";
    Status[Status[/** RFC 7231, 6.3.6 */ "ResetContent"] = 205] = "ResetContent";
    Status[Status[/** RFC 7233, 4.1 */ "PartialContent"] = 206] = "PartialContent";
    Status[Status[/** RFC 4918, 11.1 */ "MultiStatus"] = 207] = "MultiStatus";
    Status[Status[/** RFC 5842, 7.1 */ "AlreadyReported"] = 208] = "AlreadyReported";
    Status[Status[/** RFC 3229, 10.4.1 */ "IMUsed"] = 226] = "IMUsed";
    Status[Status[/** RFC 7231, 6.4.1 */ "MultipleChoices"] = 300] = "MultipleChoices";
    Status[Status[/** RFC 7231, 6.4.2 */ "MovedPermanently"] = 301] = "MovedPermanently";
    Status[Status[/** RFC 7231, 6.4.3 */ "Found"] = 302] = "Found";
    Status[Status[/** RFC 7231, 6.4.4 */ "SeeOther"] = 303] = "SeeOther";
    Status[Status[/** RFC 7232, 4.1 */ "NotModified"] = 304] = "NotModified";
    Status[Status[/** RFC 7231, 6.4.5 */ "UseProxy"] = 305] = "UseProxy";
    Status[Status[/** RFC 7231, 6.4.7 */ "TemporaryRedirect"] = 307] = "TemporaryRedirect";
    Status[Status[/** RFC 7538, 3 */ "PermanentRedirect"] = 308] = "PermanentRedirect";
    Status[Status[/** RFC 7231, 6.5.1 */ "BadRequest"] = 400] = "BadRequest";
    Status[Status[/** RFC 7235, 3.1 */ "Unauthorized"] = 401] = "Unauthorized";
    Status[Status[/** RFC 7231, 6.5.2 */ "PaymentRequired"] = 402] = "PaymentRequired";
    Status[Status[/** RFC 7231, 6.5.3 */ "Forbidden"] = 403] = "Forbidden";
    Status[Status[/** RFC 7231, 6.5.4 */ "NotFound"] = 404] = "NotFound";
    Status[Status[/** RFC 7231, 6.5.5 */ "MethodNotAllowed"] = 405] = "MethodNotAllowed";
    Status[Status[/** RFC 7231, 6.5.6 */ "NotAcceptable"] = 406] = "NotAcceptable";
    Status[Status[/** RFC 7235, 3.2 */ "ProxyAuthRequired"] = 407] = "ProxyAuthRequired";
    Status[Status[/** RFC 7231, 6.5.7 */ "RequestTimeout"] = 408] = "RequestTimeout";
    Status[Status[/** RFC 7231, 6.5.8 */ "Conflict"] = 409] = "Conflict";
    Status[Status[/** RFC 7231, 6.5.9 */ "Gone"] = 410] = "Gone";
    Status[Status[/** RFC 7231, 6.5.10 */ "LengthRequired"] = 411] = "LengthRequired";
    Status[Status[/** RFC 7232, 4.2 */ "PreconditionFailed"] = 412] = "PreconditionFailed";
    Status[Status[/** RFC 7231, 6.5.11 */ "RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
    Status[Status[/** RFC 7231, 6.5.12 */ "RequestURITooLong"] = 414] = "RequestURITooLong";
    Status[Status[/** RFC 7231, 6.5.13 */ "UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
    Status[Status[/** RFC 7233, 4.4 */ "RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
    Status[Status[/** RFC 7231, 6.5.14 */ "ExpectationFailed"] = 417] = "ExpectationFailed";
    Status[Status[/** RFC 7168, 2.3.3 */ "Teapot"] = 418] = "Teapot";
    Status[Status[/** RFC 7540, 9.1.2 */ "MisdirectedRequest"] = 421] = "MisdirectedRequest";
    Status[Status[/** RFC 4918, 11.2 */ "UnprocessableEntity"] = 422] = "UnprocessableEntity";
    Status[Status[/** RFC 4918, 11.3 */ "Locked"] = 423] = "Locked";
    Status[Status[/** RFC 4918, 11.4 */ "FailedDependency"] = 424] = "FailedDependency";
    Status[Status[/** RFC 8470, 5.2 */ "TooEarly"] = 425] = "TooEarly";
    Status[Status[/** RFC 7231, 6.5.15 */ "UpgradeRequired"] = 426] = "UpgradeRequired";
    Status[Status[/** RFC 6585, 3 */ "PreconditionRequired"] = 428] = "PreconditionRequired";
    Status[Status[/** RFC 6585, 4 */ "TooManyRequests"] = 429] = "TooManyRequests";
    Status[Status[/** RFC 6585, 5 */ "RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
    Status[Status[/** RFC 7725, 3 */ "UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
    Status[Status[/** RFC 7231, 6.6.1 */ "InternalServerError"] = 500] = "InternalServerError";
    Status[Status[/** RFC 7231, 6.6.2 */ "NotImplemented"] = 501] = "NotImplemented";
    Status[Status[/** RFC 7231, 6.6.3 */ "BadGateway"] = 502] = "BadGateway";
    Status[Status[/** RFC 7231, 6.6.4 */ "ServiceUnavailable"] = 503] = "ServiceUnavailable";
    Status[Status[/** RFC 7231, 6.6.5 */ "GatewayTimeout"] = 504] = "GatewayTimeout";
    Status[Status[/** RFC 7231, 6.6.6 */ "HTTPVersionNotSupported"] = 505] = "HTTPVersionNotSupported";
    Status[Status[/** RFC 2295, 8.1 */ "VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
    Status[Status[/** RFC 4918, 11.5 */ "InsufficientStorage"] = 507] = "InsufficientStorage";
    Status[Status[/** RFC 5842, 7.2 */ "LoopDetected"] = 508] = "LoopDetected";
    Status[Status[/** RFC 2774, 7 */ "NotExtended"] = 510] = "NotExtended";
    Status[Status[/** RFC 6585, 6 */ "NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(Status || (Status = {}));
/** A record of all the status codes text. */ export const STATUS_TEXT = {
    [Status.Accepted]: "Accepted",
    [Status.AlreadyReported]: "Already Reported",
    [Status.BadGateway]: "Bad Gateway",
    [Status.BadRequest]: "Bad Request",
    [Status.Conflict]: "Conflict",
    [Status.Continue]: "Continue",
    [Status.Created]: "Created",
    [Status.EarlyHints]: "Early Hints",
    [Status.ExpectationFailed]: "Expectation Failed",
    [Status.FailedDependency]: "Failed Dependency",
    [Status.Forbidden]: "Forbidden",
    [Status.Found]: "Found",
    [Status.GatewayTimeout]: "Gateway Timeout",
    [Status.Gone]: "Gone",
    [Status.HTTPVersionNotSupported]: "HTTP Version Not Supported",
    [Status.IMUsed]: "IM Used",
    [Status.InsufficientStorage]: "Insufficient Storage",
    [Status.InternalServerError]: "Internal Server Error",
    [Status.LengthRequired]: "Length Required",
    [Status.Locked]: "Locked",
    [Status.LoopDetected]: "Loop Detected",
    [Status.MethodNotAllowed]: "Method Not Allowed",
    [Status.MisdirectedRequest]: "Misdirected Request",
    [Status.MovedPermanently]: "Moved Permanently",
    [Status.MultiStatus]: "Multi Status",
    [Status.MultipleChoices]: "Multiple Choices",
    [Status.NetworkAuthenticationRequired]: "Network Authentication Required",
    [Status.NoContent]: "No Content",
    [Status.NonAuthoritativeInfo]: "Non Authoritative Info",
    [Status.NotAcceptable]: "Not Acceptable",
    [Status.NotExtended]: "Not Extended",
    [Status.NotFound]: "Not Found",
    [Status.NotImplemented]: "Not Implemented",
    [Status.NotModified]: "Not Modified",
    [Status.OK]: "OK",
    [Status.PartialContent]: "Partial Content",
    [Status.PaymentRequired]: "Payment Required",
    [Status.PermanentRedirect]: "Permanent Redirect",
    [Status.PreconditionFailed]: "Precondition Failed",
    [Status.PreconditionRequired]: "Precondition Required",
    [Status.Processing]: "Processing",
    [Status.ProxyAuthRequired]: "Proxy Auth Required",
    [Status.RequestEntityTooLarge]: "Request Entity Too Large",
    [Status.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
    [Status.RequestTimeout]: "Request Timeout",
    [Status.RequestURITooLong]: "Request URI Too Long",
    [Status.RequestedRangeNotSatisfiable]: "Requested Range Not Satisfiable",
    [Status.ResetContent]: "Reset Content",
    [Status.SeeOther]: "See Other",
    [Status.ServiceUnavailable]: "Service Unavailable",
    [Status.SwitchingProtocols]: "Switching Protocols",
    [Status.Teapot]: "I'm a teapot",
    [Status.TemporaryRedirect]: "Temporary Redirect",
    [Status.TooEarly]: "Too Early",
    [Status.TooManyRequests]: "Too Many Requests",
    [Status.Unauthorized]: "Unauthorized",
    [Status.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
    [Status.UnprocessableEntity]: "Unprocessable Entity",
    [Status.UnsupportedMediaType]: "Unsupported Media Type",
    [Status.UpgradeRequired]: "Upgrade Required",
    [Status.UseProxy]: "Use Proxy",
    [Status.VariantAlsoNegotiates]: "Variant Also Negotiates"
};
/** A type guard that determines if the status code is informational. */ export function isInformationalStatus(status) {
    return status >= 100 && status < 200;
}
/** A type guard that determines if the status code is successful. */ export function isSuccessfulStatus(status) {
    return status >= 200 && status < 300;
}
/** A type guard that determines if the status code is a redirection. */ export function isRedirectStatus(status) {
    return status >= 300 && status < 400;
}
/** A type guard that determines if the status code is a client error. */ export function isClientErrorStatus(status) {
    return status >= 400 && status < 500;
}
/** A type guard that determines if the status code is a server error. */ export function isServerErrorStatus(status) {
    return status >= 500 && status < 600;
}
/** A type guard that determines if the status code is an error. */ export function isErrorStatus(status) {
    return status >= 400 && status < 600;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2h0dHAvaHR0cF9zdGF0dXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBDb250YWlucyB0aGUgZW51bSB7QGxpbmtjb2RlIFN0YXR1c30gd2hpY2ggZW51bWVyYXRlcyBzdGFuZGFyZCBIVFRQIHN0YXR1c1xuICogY29kZXMgYW5kIHByb3ZpZGVzIHNldmVyYWwgdHlwZSBndWFyZHMgZm9yIGhhbmRsaW5nIHN0YXR1cyBjb2RlcyB3aXRoIHR5cGVcbiAqIHNhZmV0eS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIFN0YXR1cyxcbiAqICAgU1RBVFVTX1RFWFQsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvaHR0cF9zdGF0dXMudHNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhTdGF0dXMuTm90Rm91bmQpOyAvLz0+IDQwNFxuICogY29uc29sZS5sb2coU1RBVFVTX1RFWFRbU3RhdHVzLk5vdEZvdW5kXSk7IC8vPT4gXCJOb3QgRm91bmRcIlxuICogYGBgXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGlzRXJyb3JTdGF0dXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL2h0dHBfc3RhdHVzLnRzXCI7XG4gKlxuICogY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2V4YW1wbGUuY29tL1wiKTtcbiAqXG4gKiBpZiAoaXNFcnJvclN0YXR1cyhyZXMuc3RhdHVzKSkge1xuICogICAvLyBlcnJvciBoYW5kbGluZyBoZXJlLi4uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuLyoqIFN0YW5kYXJkIEhUVFAgc3RhdHVzIGNvZGVzLiAqL1xuZXhwb3J0IGVudW0gU3RhdHVzIHtcbiAgLyoqIFJGQyA3MjMxLCA2LjIuMSAqL1xuICBDb250aW51ZSA9IDEwMCxcbiAgLyoqIFJGQyA3MjMxLCA2LjIuMiAqL1xuICBTd2l0Y2hpbmdQcm90b2NvbHMgPSAxMDEsXG4gIC8qKiBSRkMgMjUxOCwgMTAuMSAqL1xuICBQcm9jZXNzaW5nID0gMTAyLFxuICAvKiogUkZDIDgyOTcgKiovXG4gIEVhcmx5SGludHMgPSAxMDMsXG5cbiAgLyoqIFJGQyA3MjMxLCA2LjMuMSAqL1xuICBPSyA9IDIwMCxcbiAgLyoqIFJGQyA3MjMxLCA2LjMuMiAqL1xuICBDcmVhdGVkID0gMjAxLFxuICAvKiogUkZDIDcyMzEsIDYuMy4zICovXG4gIEFjY2VwdGVkID0gMjAyLFxuICAvKiogUkZDIDcyMzEsIDYuMy40ICovXG4gIE5vbkF1dGhvcml0YXRpdmVJbmZvID0gMjAzLFxuICAvKiogUkZDIDcyMzEsIDYuMy41ICovXG4gIE5vQ29udGVudCA9IDIwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjMuNiAqL1xuICBSZXNldENvbnRlbnQgPSAyMDUsXG4gIC8qKiBSRkMgNzIzMywgNC4xICovXG4gIFBhcnRpYWxDb250ZW50ID0gMjA2LFxuICAvKiogUkZDIDQ5MTgsIDExLjEgKi9cbiAgTXVsdGlTdGF0dXMgPSAyMDcsXG4gIC8qKiBSRkMgNTg0MiwgNy4xICovXG4gIEFscmVhZHlSZXBvcnRlZCA9IDIwOCxcbiAgLyoqIFJGQyAzMjI5LCAxMC40LjEgKi9cbiAgSU1Vc2VkID0gMjI2LFxuXG4gIC8qKiBSRkMgNzIzMSwgNi40LjEgKi9cbiAgTXVsdGlwbGVDaG9pY2VzID0gMzAwLFxuICAvKiogUkZDIDcyMzEsIDYuNC4yICovXG4gIE1vdmVkUGVybWFuZW50bHkgPSAzMDEsXG4gIC8qKiBSRkMgNzIzMSwgNi40LjMgKi9cbiAgRm91bmQgPSAzMDIsXG4gIC8qKiBSRkMgNzIzMSwgNi40LjQgKi9cbiAgU2VlT3RoZXIgPSAzMDMsXG4gIC8qKiBSRkMgNzIzMiwgNC4xICovXG4gIE5vdE1vZGlmaWVkID0gMzA0LFxuICAvKiogUkZDIDcyMzEsIDYuNC41ICovXG4gIFVzZVByb3h5ID0gMzA1LFxuICAvKiogUkZDIDcyMzEsIDYuNC43ICovXG4gIFRlbXBvcmFyeVJlZGlyZWN0ID0gMzA3LFxuICAvKiogUkZDIDc1MzgsIDMgKi9cbiAgUGVybWFuZW50UmVkaXJlY3QgPSAzMDgsXG5cbiAgLyoqIFJGQyA3MjMxLCA2LjUuMSAqL1xuICBCYWRSZXF1ZXN0ID0gNDAwLFxuICAvKiogUkZDIDcyMzUsIDMuMSAqL1xuICBVbmF1dGhvcml6ZWQgPSA0MDEsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjIgKi9cbiAgUGF5bWVudFJlcXVpcmVkID0gNDAyLFxuICAvKiogUkZDIDcyMzEsIDYuNS4zICovXG4gIEZvcmJpZGRlbiA9IDQwMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuNCAqL1xuICBOb3RGb3VuZCA9IDQwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuNSAqL1xuICBNZXRob2ROb3RBbGxvd2VkID0gNDA1LFxuICAvKiogUkZDIDcyMzEsIDYuNS42ICovXG4gIE5vdEFjY2VwdGFibGUgPSA0MDYsXG4gIC8qKiBSRkMgNzIzNSwgMy4yICovXG4gIFByb3h5QXV0aFJlcXVpcmVkID0gNDA3LFxuICAvKiogUkZDIDcyMzEsIDYuNS43ICovXG4gIFJlcXVlc3RUaW1lb3V0ID0gNDA4LFxuICAvKiogUkZDIDcyMzEsIDYuNS44ICovXG4gIENvbmZsaWN0ID0gNDA5LFxuICAvKiogUkZDIDcyMzEsIDYuNS45ICovXG4gIEdvbmUgPSA0MTAsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjEwICovXG4gIExlbmd0aFJlcXVpcmVkID0gNDExLFxuICAvKiogUkZDIDcyMzIsIDQuMiAqL1xuICBQcmVjb25kaXRpb25GYWlsZWQgPSA0MTIsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjExICovXG4gIFJlcXVlc3RFbnRpdHlUb29MYXJnZSA9IDQxMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMTIgKi9cbiAgUmVxdWVzdFVSSVRvb0xvbmcgPSA0MTQsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjEzICovXG4gIFVuc3VwcG9ydGVkTWVkaWFUeXBlID0gNDE1LFxuICAvKiogUkZDIDcyMzMsIDQuNCAqL1xuICBSZXF1ZXN0ZWRSYW5nZU5vdFNhdGlzZmlhYmxlID0gNDE2LFxuICAvKiogUkZDIDcyMzEsIDYuNS4xNCAqL1xuICBFeHBlY3RhdGlvbkZhaWxlZCA9IDQxNyxcbiAgLyoqIFJGQyA3MTY4LCAyLjMuMyAqL1xuICBUZWFwb3QgPSA0MTgsXG4gIC8qKiBSRkMgNzU0MCwgOS4xLjIgKi9cbiAgTWlzZGlyZWN0ZWRSZXF1ZXN0ID0gNDIxLFxuICAvKiogUkZDIDQ5MTgsIDExLjIgKi9cbiAgVW5wcm9jZXNzYWJsZUVudGl0eSA9IDQyMixcbiAgLyoqIFJGQyA0OTE4LCAxMS4zICovXG4gIExvY2tlZCA9IDQyMyxcbiAgLyoqIFJGQyA0OTE4LCAxMS40ICovXG4gIEZhaWxlZERlcGVuZGVuY3kgPSA0MjQsXG4gIC8qKiBSRkMgODQ3MCwgNS4yICovXG4gIFRvb0Vhcmx5ID0gNDI1LFxuICAvKiogUkZDIDcyMzEsIDYuNS4xNSAqL1xuICBVcGdyYWRlUmVxdWlyZWQgPSA0MjYsXG4gIC8qKiBSRkMgNjU4NSwgMyAqL1xuICBQcmVjb25kaXRpb25SZXF1aXJlZCA9IDQyOCxcbiAgLyoqIFJGQyA2NTg1LCA0ICovXG4gIFRvb01hbnlSZXF1ZXN0cyA9IDQyOSxcbiAgLyoqIFJGQyA2NTg1LCA1ICovXG4gIFJlcXVlc3RIZWFkZXJGaWVsZHNUb29MYXJnZSA9IDQzMSxcbiAgLyoqIFJGQyA3NzI1LCAzICovXG4gIFVuYXZhaWxhYmxlRm9yTGVnYWxSZWFzb25zID0gNDUxLFxuXG4gIC8qKiBSRkMgNzIzMSwgNi42LjEgKi9cbiAgSW50ZXJuYWxTZXJ2ZXJFcnJvciA9IDUwMCxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuMiAqL1xuICBOb3RJbXBsZW1lbnRlZCA9IDUwMSxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuMyAqL1xuICBCYWRHYXRld2F5ID0gNTAyLFxuICAvKiogUkZDIDcyMzEsIDYuNi40ICovXG4gIFNlcnZpY2VVbmF2YWlsYWJsZSA9IDUwMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuNSAqL1xuICBHYXRld2F5VGltZW91dCA9IDUwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuNiAqL1xuICBIVFRQVmVyc2lvbk5vdFN1cHBvcnRlZCA9IDUwNSxcbiAgLyoqIFJGQyAyMjk1LCA4LjEgKi9cbiAgVmFyaWFudEFsc29OZWdvdGlhdGVzID0gNTA2LFxuICAvKiogUkZDIDQ5MTgsIDExLjUgKi9cbiAgSW5zdWZmaWNpZW50U3RvcmFnZSA9IDUwNyxcbiAgLyoqIFJGQyA1ODQyLCA3LjIgKi9cbiAgTG9vcERldGVjdGVkID0gNTA4LFxuICAvKiogUkZDIDI3NzQsIDcgKi9cbiAgTm90RXh0ZW5kZWQgPSA1MTAsXG4gIC8qKiBSRkMgNjU4NSwgNiAqL1xuICBOZXR3b3JrQXV0aGVudGljYXRpb25SZXF1aXJlZCA9IDUxMSxcbn1cblxuLyoqIEEgcmVjb3JkIG9mIGFsbCB0aGUgc3RhdHVzIGNvZGVzIHRleHQuICovXG5leHBvcnQgY29uc3QgU1RBVFVTX1RFWFQ6IFJlYWRvbmx5PFJlY29yZDxTdGF0dXMsIHN0cmluZz4+ID0ge1xuICBbU3RhdHVzLkFjY2VwdGVkXTogXCJBY2NlcHRlZFwiLFxuICBbU3RhdHVzLkFscmVhZHlSZXBvcnRlZF06IFwiQWxyZWFkeSBSZXBvcnRlZFwiLFxuICBbU3RhdHVzLkJhZEdhdGV3YXldOiBcIkJhZCBHYXRld2F5XCIsXG4gIFtTdGF0dXMuQmFkUmVxdWVzdF06IFwiQmFkIFJlcXVlc3RcIixcbiAgW1N0YXR1cy5Db25mbGljdF06IFwiQ29uZmxpY3RcIixcbiAgW1N0YXR1cy5Db250aW51ZV06IFwiQ29udGludWVcIixcbiAgW1N0YXR1cy5DcmVhdGVkXTogXCJDcmVhdGVkXCIsXG4gIFtTdGF0dXMuRWFybHlIaW50c106IFwiRWFybHkgSGludHNcIixcbiAgW1N0YXR1cy5FeHBlY3RhdGlvbkZhaWxlZF06IFwiRXhwZWN0YXRpb24gRmFpbGVkXCIsXG4gIFtTdGF0dXMuRmFpbGVkRGVwZW5kZW5jeV06IFwiRmFpbGVkIERlcGVuZGVuY3lcIixcbiAgW1N0YXR1cy5Gb3JiaWRkZW5dOiBcIkZvcmJpZGRlblwiLFxuICBbU3RhdHVzLkZvdW5kXTogXCJGb3VuZFwiLFxuICBbU3RhdHVzLkdhdGV3YXlUaW1lb3V0XTogXCJHYXRld2F5IFRpbWVvdXRcIixcbiAgW1N0YXR1cy5Hb25lXTogXCJHb25lXCIsXG4gIFtTdGF0dXMuSFRUUFZlcnNpb25Ob3RTdXBwb3J0ZWRdOiBcIkhUVFAgVmVyc2lvbiBOb3QgU3VwcG9ydGVkXCIsXG4gIFtTdGF0dXMuSU1Vc2VkXTogXCJJTSBVc2VkXCIsXG4gIFtTdGF0dXMuSW5zdWZmaWNpZW50U3RvcmFnZV06IFwiSW5zdWZmaWNpZW50IFN0b3JhZ2VcIixcbiAgW1N0YXR1cy5JbnRlcm5hbFNlcnZlckVycm9yXTogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIixcbiAgW1N0YXR1cy5MZW5ndGhSZXF1aXJlZF06IFwiTGVuZ3RoIFJlcXVpcmVkXCIsXG4gIFtTdGF0dXMuTG9ja2VkXTogXCJMb2NrZWRcIixcbiAgW1N0YXR1cy5Mb29wRGV0ZWN0ZWRdOiBcIkxvb3AgRGV0ZWN0ZWRcIixcbiAgW1N0YXR1cy5NZXRob2ROb3RBbGxvd2VkXTogXCJNZXRob2QgTm90IEFsbG93ZWRcIixcbiAgW1N0YXR1cy5NaXNkaXJlY3RlZFJlcXVlc3RdOiBcIk1pc2RpcmVjdGVkIFJlcXVlc3RcIixcbiAgW1N0YXR1cy5Nb3ZlZFBlcm1hbmVudGx5XTogXCJNb3ZlZCBQZXJtYW5lbnRseVwiLFxuICBbU3RhdHVzLk11bHRpU3RhdHVzXTogXCJNdWx0aSBTdGF0dXNcIixcbiAgW1N0YXR1cy5NdWx0aXBsZUNob2ljZXNdOiBcIk11bHRpcGxlIENob2ljZXNcIixcbiAgW1N0YXR1cy5OZXR3b3JrQXV0aGVudGljYXRpb25SZXF1aXJlZF06IFwiTmV0d29yayBBdXRoZW50aWNhdGlvbiBSZXF1aXJlZFwiLFxuICBbU3RhdHVzLk5vQ29udGVudF06IFwiTm8gQ29udGVudFwiLFxuICBbU3RhdHVzLk5vbkF1dGhvcml0YXRpdmVJbmZvXTogXCJOb24gQXV0aG9yaXRhdGl2ZSBJbmZvXCIsXG4gIFtTdGF0dXMuTm90QWNjZXB0YWJsZV06IFwiTm90IEFjY2VwdGFibGVcIixcbiAgW1N0YXR1cy5Ob3RFeHRlbmRlZF06IFwiTm90IEV4dGVuZGVkXCIsXG4gIFtTdGF0dXMuTm90Rm91bmRdOiBcIk5vdCBGb3VuZFwiLFxuICBbU3RhdHVzLk5vdEltcGxlbWVudGVkXTogXCJOb3QgSW1wbGVtZW50ZWRcIixcbiAgW1N0YXR1cy5Ob3RNb2RpZmllZF06IFwiTm90IE1vZGlmaWVkXCIsXG4gIFtTdGF0dXMuT0tdOiBcIk9LXCIsXG4gIFtTdGF0dXMuUGFydGlhbENvbnRlbnRdOiBcIlBhcnRpYWwgQ29udGVudFwiLFxuICBbU3RhdHVzLlBheW1lbnRSZXF1aXJlZF06IFwiUGF5bWVudCBSZXF1aXJlZFwiLFxuICBbU3RhdHVzLlBlcm1hbmVudFJlZGlyZWN0XTogXCJQZXJtYW5lbnQgUmVkaXJlY3RcIixcbiAgW1N0YXR1cy5QcmVjb25kaXRpb25GYWlsZWRdOiBcIlByZWNvbmRpdGlvbiBGYWlsZWRcIixcbiAgW1N0YXR1cy5QcmVjb25kaXRpb25SZXF1aXJlZF06IFwiUHJlY29uZGl0aW9uIFJlcXVpcmVkXCIsXG4gIFtTdGF0dXMuUHJvY2Vzc2luZ106IFwiUHJvY2Vzc2luZ1wiLFxuICBbU3RhdHVzLlByb3h5QXV0aFJlcXVpcmVkXTogXCJQcm94eSBBdXRoIFJlcXVpcmVkXCIsXG4gIFtTdGF0dXMuUmVxdWVzdEVudGl0eVRvb0xhcmdlXTogXCJSZXF1ZXN0IEVudGl0eSBUb28gTGFyZ2VcIixcbiAgW1N0YXR1cy5SZXF1ZXN0SGVhZGVyRmllbGRzVG9vTGFyZ2VdOiBcIlJlcXVlc3QgSGVhZGVyIEZpZWxkcyBUb28gTGFyZ2VcIixcbiAgW1N0YXR1cy5SZXF1ZXN0VGltZW91dF06IFwiUmVxdWVzdCBUaW1lb3V0XCIsXG4gIFtTdGF0dXMuUmVxdWVzdFVSSVRvb0xvbmddOiBcIlJlcXVlc3QgVVJJIFRvbyBMb25nXCIsXG4gIFtTdGF0dXMuUmVxdWVzdGVkUmFuZ2VOb3RTYXRpc2ZpYWJsZV06IFwiUmVxdWVzdGVkIFJhbmdlIE5vdCBTYXRpc2ZpYWJsZVwiLFxuICBbU3RhdHVzLlJlc2V0Q29udGVudF06IFwiUmVzZXQgQ29udGVudFwiLFxuICBbU3RhdHVzLlNlZU90aGVyXTogXCJTZWUgT3RoZXJcIixcbiAgW1N0YXR1cy5TZXJ2aWNlVW5hdmFpbGFibGVdOiBcIlNlcnZpY2UgVW5hdmFpbGFibGVcIixcbiAgW1N0YXR1cy5Td2l0Y2hpbmdQcm90b2NvbHNdOiBcIlN3aXRjaGluZyBQcm90b2NvbHNcIixcbiAgW1N0YXR1cy5UZWFwb3RdOiBcIkknbSBhIHRlYXBvdFwiLFxuICBbU3RhdHVzLlRlbXBvcmFyeVJlZGlyZWN0XTogXCJUZW1wb3JhcnkgUmVkaXJlY3RcIixcbiAgW1N0YXR1cy5Ub29FYXJseV06IFwiVG9vIEVhcmx5XCIsXG4gIFtTdGF0dXMuVG9vTWFueVJlcXVlc3RzXTogXCJUb28gTWFueSBSZXF1ZXN0c1wiLFxuICBbU3RhdHVzLlVuYXV0aG9yaXplZF06IFwiVW5hdXRob3JpemVkXCIsXG4gIFtTdGF0dXMuVW5hdmFpbGFibGVGb3JMZWdhbFJlYXNvbnNdOiBcIlVuYXZhaWxhYmxlIEZvciBMZWdhbCBSZWFzb25zXCIsXG4gIFtTdGF0dXMuVW5wcm9jZXNzYWJsZUVudGl0eV06IFwiVW5wcm9jZXNzYWJsZSBFbnRpdHlcIixcbiAgW1N0YXR1cy5VbnN1cHBvcnRlZE1lZGlhVHlwZV06IFwiVW5zdXBwb3J0ZWQgTWVkaWEgVHlwZVwiLFxuICBbU3RhdHVzLlVwZ3JhZGVSZXF1aXJlZF06IFwiVXBncmFkZSBSZXF1aXJlZFwiLFxuICBbU3RhdHVzLlVzZVByb3h5XTogXCJVc2UgUHJveHlcIixcbiAgW1N0YXR1cy5WYXJpYW50QWxzb05lZ290aWF0ZXNdOiBcIlZhcmlhbnQgQWxzbyBOZWdvdGlhdGVzXCIsXG59O1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIGluZm9ybWF0aW9uYWwgKDFYWCkuICovXG5leHBvcnQgdHlwZSBJbmZvcm1hdGlvbmFsU3RhdHVzID1cbiAgfCBTdGF0dXMuQ29udGludWVcbiAgfCBTdGF0dXMuU3dpdGNoaW5nUHJvdG9jb2xzXG4gIHwgU3RhdHVzLlByb2Nlc3NpbmdcbiAgfCBTdGF0dXMuRWFybHlIaW50cztcblxuLyoqIEFuIEhUVFAgc3RhdHVzIHRoYXQgaXMgYSBzdWNjZXNzICgyWFgpLiAqL1xuZXhwb3J0IHR5cGUgU3VjY2Vzc2Z1bFN0YXR1cyA9XG4gIHwgU3RhdHVzLk9LXG4gIHwgU3RhdHVzLkNyZWF0ZWRcbiAgfCBTdGF0dXMuQWNjZXB0ZWRcbiAgfCBTdGF0dXMuTm9uQXV0aG9yaXRhdGl2ZUluZm9cbiAgfCBTdGF0dXMuTm9Db250ZW50XG4gIHwgU3RhdHVzLlJlc2V0Q29udGVudFxuICB8IFN0YXR1cy5QYXJ0aWFsQ29udGVudFxuICB8IFN0YXR1cy5NdWx0aVN0YXR1c1xuICB8IFN0YXR1cy5BbHJlYWR5UmVwb3J0ZWRcbiAgfCBTdGF0dXMuSU1Vc2VkO1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIHJlZGlyZWN0ICgzWFgpLiAqL1xuZXhwb3J0IHR5cGUgUmVkaXJlY3RTdGF0dXMgPVxuICB8IFN0YXR1cy5NdWx0aXBsZUNob2ljZXMgLy8gMzAwXG4gIHwgU3RhdHVzLk1vdmVkUGVybWFuZW50bHkgLy8gMzAxXG4gIHwgU3RhdHVzLkZvdW5kIC8vIDMwMlxuICB8IFN0YXR1cy5TZWVPdGhlciAvLyAzMDNcbiAgfCBTdGF0dXMuVXNlUHJveHkgLy8gMzA1IC0gREVQUkVDQVRFRFxuICB8IFN0YXR1cy5UZW1wb3JhcnlSZWRpcmVjdCAvLyAzMDdcbiAgfCBTdGF0dXMuUGVybWFuZW50UmVkaXJlY3Q7IC8vIDMwOFxuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIGNsaWVudCBlcnJvciAoNFhYKS4gKi9cbmV4cG9ydCB0eXBlIENsaWVudEVycm9yU3RhdHVzID1cbiAgfCBTdGF0dXMuQmFkUmVxdWVzdFxuICB8IFN0YXR1cy5VbmF1dGhvcml6ZWRcbiAgfCBTdGF0dXMuUGF5bWVudFJlcXVpcmVkXG4gIHwgU3RhdHVzLkZvcmJpZGRlblxuICB8IFN0YXR1cy5Ob3RGb3VuZFxuICB8IFN0YXR1cy5NZXRob2ROb3RBbGxvd2VkXG4gIHwgU3RhdHVzLk5vdEFjY2VwdGFibGVcbiAgfCBTdGF0dXMuUHJveHlBdXRoUmVxdWlyZWRcbiAgfCBTdGF0dXMuUmVxdWVzdFRpbWVvdXRcbiAgfCBTdGF0dXMuQ29uZmxpY3RcbiAgfCBTdGF0dXMuR29uZVxuICB8IFN0YXR1cy5MZW5ndGhSZXF1aXJlZFxuICB8IFN0YXR1cy5QcmVjb25kaXRpb25GYWlsZWRcbiAgfCBTdGF0dXMuUmVxdWVzdEVudGl0eVRvb0xhcmdlXG4gIHwgU3RhdHVzLlJlcXVlc3RVUklUb29Mb25nXG4gIHwgU3RhdHVzLlVuc3VwcG9ydGVkTWVkaWFUeXBlXG4gIHwgU3RhdHVzLlJlcXVlc3RlZFJhbmdlTm90U2F0aXNmaWFibGVcbiAgfCBTdGF0dXMuRXhwZWN0YXRpb25GYWlsZWRcbiAgfCBTdGF0dXMuVGVhcG90XG4gIHwgU3RhdHVzLk1pc2RpcmVjdGVkUmVxdWVzdFxuICB8IFN0YXR1cy5VbnByb2Nlc3NhYmxlRW50aXR5XG4gIHwgU3RhdHVzLkxvY2tlZFxuICB8IFN0YXR1cy5GYWlsZWREZXBlbmRlbmN5XG4gIHwgU3RhdHVzLlVwZ3JhZGVSZXF1aXJlZFxuICB8IFN0YXR1cy5QcmVjb25kaXRpb25SZXF1aXJlZFxuICB8IFN0YXR1cy5Ub29NYW55UmVxdWVzdHNcbiAgfCBTdGF0dXMuUmVxdWVzdEhlYWRlckZpZWxkc1Rvb0xhcmdlXG4gIHwgU3RhdHVzLlVuYXZhaWxhYmxlRm9yTGVnYWxSZWFzb25zO1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIHNlcnZlciBlcnJvciAoNVhYKS4gKi9cbmV4cG9ydCB0eXBlIFNlcnZlckVycm9yU3RhdHVzID1cbiAgfCBTdGF0dXMuSW50ZXJuYWxTZXJ2ZXJFcnJvclxuICB8IFN0YXR1cy5Ob3RJbXBsZW1lbnRlZFxuICB8IFN0YXR1cy5CYWRHYXRld2F5XG4gIHwgU3RhdHVzLlNlcnZpY2VVbmF2YWlsYWJsZVxuICB8IFN0YXR1cy5HYXRld2F5VGltZW91dFxuICB8IFN0YXR1cy5IVFRQVmVyc2lvbk5vdFN1cHBvcnRlZFxuICB8IFN0YXR1cy5WYXJpYW50QWxzb05lZ290aWF0ZXNcbiAgfCBTdGF0dXMuSW5zdWZmaWNpZW50U3RvcmFnZVxuICB8IFN0YXR1cy5Mb29wRGV0ZWN0ZWRcbiAgfCBTdGF0dXMuTm90RXh0ZW5kZWRcbiAgfCBTdGF0dXMuTmV0d29ya0F1dGhlbnRpY2F0aW9uUmVxdWlyZWQ7XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyB0aGF0IGlzIGFuIGVycm9yICg0WFggYW5kIDVYWCkuICovXG5leHBvcnQgdHlwZSBFcnJvclN0YXR1cyA9IENsaWVudEVycm9yU3RhdHVzIHwgU2VydmVyRXJyb3JTdGF0dXM7XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBpbmZvcm1hdGlvbmFsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW5mb3JtYXRpb25hbFN0YXR1cyhcbiAgc3RhdHVzOiBTdGF0dXMsXG4pOiBzdGF0dXMgaXMgSW5mb3JtYXRpb25hbFN0YXR1cyB7XG4gIHJldHVybiBzdGF0dXMgPj0gMTAwICYmIHN0YXR1cyA8IDIwMDtcbn1cblxuLyoqIEEgdHlwZSBndWFyZCB0aGF0IGRldGVybWluZXMgaWYgdGhlIHN0YXR1cyBjb2RlIGlzIHN1Y2Nlc3NmdWwuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdWNjZXNzZnVsU3RhdHVzKHN0YXR1czogU3RhdHVzKTogc3RhdHVzIGlzIFN1Y2Nlc3NmdWxTdGF0dXMge1xuICByZXR1cm4gc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDA7XG59XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBhIHJlZGlyZWN0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVkaXJlY3RTdGF0dXMoc3RhdHVzOiBTdGF0dXMpOiBzdGF0dXMgaXMgUmVkaXJlY3RTdGF0dXMge1xuICByZXR1cm4gc3RhdHVzID49IDMwMCAmJiBzdGF0dXMgPCA0MDA7XG59XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBhIGNsaWVudCBlcnJvci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NsaWVudEVycm9yU3RhdHVzKFxuICBzdGF0dXM6IFN0YXR1cyxcbik6IHN0YXR1cyBpcyBDbGllbnRFcnJvclN0YXR1cyB7XG4gIHJldHVybiBzdGF0dXMgPj0gNDAwICYmIHN0YXR1cyA8IDUwMDtcbn1cblxuLyoqIEEgdHlwZSBndWFyZCB0aGF0IGRldGVybWluZXMgaWYgdGhlIHN0YXR1cyBjb2RlIGlzIGEgc2VydmVyIGVycm9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2VydmVyRXJyb3JTdGF0dXMoXG4gIHN0YXR1czogU3RhdHVzLFxuKTogc3RhdHVzIGlzIFNlcnZlckVycm9yU3RhdHVzIHtcbiAgcmV0dXJuIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwO1xufVxuXG4vKiogQSB0eXBlIGd1YXJkIHRoYXQgZGV0ZXJtaW5lcyBpZiB0aGUgc3RhdHVzIGNvZGUgaXMgYW4gZXJyb3IuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFcnJvclN0YXR1cyhzdGF0dXM6IFN0YXR1cyk6IHN0YXR1cyBpcyBFcnJvclN0YXR1cyB7XG4gIHJldHVybiBzdGF0dXMgPj0gNDAwICYmIHN0YXR1cyA8IDYwMDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoi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