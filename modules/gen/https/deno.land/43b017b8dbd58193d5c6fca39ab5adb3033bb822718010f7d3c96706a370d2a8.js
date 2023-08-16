/**
 * CorsOptions
 *
 * An Object that describes how CORS middleware should behave. The default configuration is the equivalent of:
 *
 * ```ts
 * {
 *  "origin": "*",
 *  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
 *  "preflightContinue": false,
 *  "optionsSuccessStatus": 204,
 * }
 * ```
 *
 * @link https://github.com/tajpouria/cors#configuration-options
 */ //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY29yc0B2MS4yLjIvdHlwZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3JzT3B0aW9uc1xuICpcbiAqIEFuIE9iamVjdCB0aGF0IGRlc2NyaWJlcyBob3cgQ09SUyBtaWRkbGV3YXJlIHNob3VsZCBiZWhhdmUuIFRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gaXMgdGhlIGVxdWl2YWxlbnQgb2Y6XG4gKlxuICogYGBgdHNcbiAqIHtcbiAqICBcIm9yaWdpblwiOiBcIipcIixcbiAqICBcIm1ldGhvZHNcIjogXCJHRVQsSEVBRCxQVVQsUEFUQ0gsUE9TVCxERUxFVEVcIixcbiAqICBcInByZWZsaWdodENvbnRpbnVlXCI6IGZhbHNlLFxuICogIFwib3B0aW9uc1N1Y2Nlc3NTdGF0dXNcIjogMjA0LFxuICogfVxuICogYGBgXG4gKlxuICogQGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL3RhanBvdXJpYS9jb3JzI2NvbmZpZ3VyYXRpb24tb3B0aW9uc1xuICovXG5leHBvcnQgdHlwZSBDb3JzT3B0aW9ucyA9IHtcbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIEFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbiBDT1JTIGhlYWRlci5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqIC0gQm9vbGVhblxuICAgKlxuICAgKiBzZXQgb3JpZ2luIHRvIHRydWUgdG8gcmVmbGVjdCB0aGUgcmVxdWVzdCBvcmlnaW4sIGFzIGRlZmluZWQgYnkgcmVxLmhlYWRlcignT3JpZ2luJyk6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7IG9yaWdpbjogdHJ1ZSB9KSk7XG4gICAqXG4gICAqIGBgYFxuICAgKiBvciBzZXQgaXQgdG8gZmFsc2UgdG8gZGlzYWJsZSBDT1JTOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBhcHAudXNlKGNvcnMoeyBvcmlnaW46IGZhbHNlIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIC0gU3RyaW5nXG4gICAqXG4gICAqIHNldCBvcmlnaW4gdG8gYSBzcGVjaWZpYyBvcmlnaW4uIEZvciBleGFtcGxlIGlmIHlvdSBzZXQgaXQgdG8gXCJodHRwOi8vZXhhbXBsZS5jb21cIiBvbmx5IHJlcXVlc3RzIGZyb20gXCJodHRwOi8vZXhhbXBsZS5jb21cIiB3aWxsIGJlIGFsbG93ZWQ6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7IG9yaWdpbjogJ2h0dHA6Ly9leGFtcGxlLmNvbScgfSkpO1xuICAgKlxuICAgKiBgYGBcbiAgICpcbiAgICogLSBSZWdFeHBcbiAgICpcbiAgICogc2V0IG9yaWdpbiB0byBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBwYXR0ZXJuIHdoaWNoIHdpbGwgYmUgdXNlZCB0byB0ZXN0IHRoZSByZXF1ZXN0IG9yaWdpbi4gSWYgaXQncyBhIG1hdGNoLCB0aGUgcmVxdWVzdCBvcmlnaW4gd2lsbCBiZSByZWZsZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXR0ZXJuIC9leGFtcGxlXFwuY29tJC8gd2lsbCByZWZsZWN0IGFueSByZXF1ZXN0IHRoYXQgaXMgY29taW5nIGZyb20gYW4gb3JpZ2luIGVuZGluZyB3aXRoIFwiZXhhbXBsZS5jb21cIjpcbiAgICpcbiAgICogYGBgdHNcbiAgICogYXBwLnVzZShjb3JzKHsgb3JpZ2luOiAvZXhhbXBsZVxcLmNvbSQvIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIC0gQXJyYXlcbiAgICpcbiAgICogc2V0IG9yaWdpbiB0byBhbiBhcnJheSBvZiB2YWxpZCBvcmlnaW5zLiBFYWNoIG9yaWdpbiBjYW4gYmUgYSBTdHJpbmcgb3IgYSBSZWdFeHAuIEZvciBleGFtcGxlIFtcImh0dHA6Ly9leGFtcGxlMS5jb21cIiwgL1xcLmV4YW1wbGUyXFwuY29tJC9dIHdpbGwgYWNjZXB0IGFueSByZXF1ZXN0IGZyb20gXCJodHRwOi8vZXhhbXBsZTEuY29tXCIgb3IgZnJvbSBhIHN1YmRvbWFpbiBvZiBcImV4YW1wbGUyLmNvbVwiOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBhcHAudXNlKGNvcnMoeyBvcmlnaW46IFtcImh0dHA6Ly9leGFtcGxlMS5jb21cIiwgL1xcLmV4YW1wbGUyXFwuY29tJC9dIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIC0gRnVuY3Rpb25cbiAgICpcbiAgICogc2V0IG9yaWdpbiB0byBhIGZ1bmN0aW9uIGltcGxlbWVudGluZyBzb21lIGN1c3RvbSBsb2dpYy4gVGhlIGZ1bmN0aW9uIHRha2VzIHRoZSByZXF1ZXN0IG9yaWdpbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyIGFuZCBhIGNhbGxiYWNrIChjYWxsZWQgYXMgY2FsbGJhY2soZXJyLCBvcmlnaW4pLCB3aGVyZSBvcmlnaW4gaXMgYSBub24tZnVuY3Rpb24gdmFsdWUgb2YgdGhlIG9yaWdpbiBvcHRpb24pIGFzIHRoZSBzZWNvbmQ6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7XG4gICAqICAgb3JpZ2luOiBhc3luYyAocmVxdWVzdE9yaWdpbikgPT4ge1xuICAgKiAgICAgYXdhaXQgbG9hZE9yaWdpbnNGcm9tRGF0YUJhc2UoKTsgLy8gU2ltdWxhdGUgYXN5bmNocm9ub3VzIHRhc2tcbiAgICogICAgIHJldHVybiBbXCJodHRwOi8vZXhhbXBsZTEuY29tXCIsIC9cXC5leGFtcGxlMlxcLmNvbSQvXTtcbiAgICogICAgfSxcbiAgICogIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBvcmlnaW4/OiBib29sZWFuIHwgc3RyaW5nIHwgUmVnRXhwIHwgKHN0cmluZyB8IFJlZ0V4cClbXSB8IE9yaWdpbkRlbGVnYXRlO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzIENPUlMgaGVhZGVyLlxuICAgKlxuICAgKiBFeGFtcGxlczpcbiAgICpcbiAgICogLSBTdHJpbmdcbiAgICpcbiAgICogRXhwZWN0cyBhIGNvbW1hLWRlbGltaXRlZCBzdHJpbmcgKGV4OiAnR0VULFBVVCxQT1NUJyk6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7IG1ldGhvZHM6ICdHRVQsUFVULFBPU1QnIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIC0gQXJyYXlcbiAgICpcbiAgICogb3IgYW4gYXJyYXkgKGV4OiBbJ0dFVCcsICdQVVQnLCAnUE9TVCddKVxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBhcHAudXNlKGNvcnMoeyBtZXRob2RzOiBbJ0dFVCcsICdQVVQnLCAnUE9TVCddIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBtZXRob2RzPzogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIEFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMgQ09SUyBoZWFkZXIuIElmIG5vdCBzcGVjaWZpZWQsIGRlZmF1bHRzIHRvIHJlZmxlY3RpbmcgdGhlIGhlYWRlcnMgc3BlY2lmaWVkIGluIHRoZSByZXF1ZXN0J3MgQWNjZXNzLUNvbnRyb2wtUmVxdWVzdC1IZWFkZXJzIGhlYWRlci5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqIC0gU3RyaW5nXG4gICAqXG4gICAqIEV4cGVjdHMgYSBjb21tYS1kZWxpbWl0ZWQgc3RyaW5nIChleDogJ0NvbnRlbnQtVHlwZSxBdXRob3JpemF0aW9uJyk6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7IGFsbG93ZWRIZWFkZXJzOiAnQ29udGVudC1UeXBlLEF1dGhvcml6YXRpb24nIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIC0gQXJyYXlcbiAgICpcbiAgICogb3IgYW4gYXJyYXkgKGV4OiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10pOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBhcHAudXNlKGNvcnMoeyBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBhbGxvd2VkSGVhZGVycz86IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBBY2Nlc3MtQ29udHJvbC1FeHBvc2UtSGVhZGVycyBDT1JTIGhlYWRlci4gSWYgbm90IHNwZWNpZmllZCwgbm8gY3VzdG9tIGhlYWRlcnMgYXJlIGV4cG9zZWQuXG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAtIFN0cmluZ1xuICAgKlxuICAgKiBFeHBlY3RzIGEgY29tbWEtZGVsaW1pdGVkIHN0cmluZyAoZXg6ICdDb250ZW50LVJhbmdlLFgtQ29udGVudC1SYW5nZScpOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBhcHAudXNlKGNvcnMoeyBleHBvc2VkSGVhZGVyczogJ0NvbnRlbnQtUmFuZ2UsWC1Db250ZW50LVJhbmdlJyB9KSk7XG4gICAqXG4gICAqIGBgYFxuICAgKlxuICAgKi9cbiAgZXhwb3NlZEhlYWRlcnM/OiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUgQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMgQ09SUyBoZWFkZXIuIEl0IGlzIG9taXR0ZWQgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqIC0gQm9vbGVhblxuICAgKlxuICAgKiBTZXQgdG8gdHJ1ZSB0byBwYXNzIHRoZSBoZWFkZXI6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7IGNyZWRlbnRpYWxzOiB0cnVlIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBjcmVkZW50aWFscz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIEFjY2Vzcy1Db250cm9sLU1heC1BZ2UgQ09SUyBoZWFkZXIuIEl0IGlzIG9taXR0ZWQgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqIC0gTnVtYmVyXG4gICAqXG4gICAqIFNldCB0byBhbiBpbnRlZ2VyIHRvIHBhc3MgdGhlIGhlYWRlcjpcbiAgICpcbiAgICogYGBgdHNcbiAgICogYXBwLnVzZShjb3JzKHsgbWF4QWdlOiAxIH0pKTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBtYXhBZ2U/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFBhc3MgdGhlIENPUlMgcHJlZmxpZ2h0IHJlc3BvbnNlIHRvIHRoZSBuZXh0IGhhbmRsZXI6XG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAtIEJvb2xlYW5cbiAgICpcbiAgICogYGBgdHNcbiAgICogYXBwLnVzZShjb3JzKHsgcHJlZmxpZ2h0Q29udGludWU6IHRydWUgfSkpO1xuICAgKlxuICAgKiBgYGBcbiAgICpcbiAgICovXG4gIHByZWZsaWdodENvbnRpbnVlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYSBzdGF0dXMgY29kZSB0byB1c2UgZm9yIHN1Y2Nlc3NmdWwgT1BUSU9OUyByZXF1ZXN0cywgc2luY2Ugc29tZSBsZWdhY3kgYnJvd3NlcnMgKElFMTEsIHZhcmlvdXMgU21hcnRUVnMpIGNob2tlIG9uIDIwNC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqIC0gTnVtYmVyXG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGFwcC51c2UoY29ycyh7IG9wdGlvbnNTdWNjZXNzU3RhdHVzOiAyMDAgfSkpO1xuICAgKlxuICAgKiBgYGBcbiAgICpcbiAgICovXG4gIG9wdGlvbnNTdWNjZXNzU3RhdHVzPzogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vdGFqcG91cmlhL2NvcnMjY29uZmlndXJpbmctY29ycy13LWR5bmFtaWMtb3JpZ2luXG4gKi9cbmV4cG9ydCB0eXBlIE9yaWdpbkRlbGVnYXRlID0gKFxuICByZXF1ZXN0T3JpZ2luOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsLFxuKSA9PiBDb3JzT3B0aW9uc1tcIm9yaWdpblwiXSB8IHZvaWQgfCBQcm9taXNlPENvcnNPcHRpb25zW1wib3JpZ2luXCJdIHwgdm9pZD47XG5cbi8qKlxuICogQGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL3RhanBvdXJpYS9jb3JzI2NvbmZpZ3VyaW5nLWNvcnMtYXN5bmNocm9ub3VzbHlcbiAqL1xuZXhwb3J0IHR5cGUgQ29yc09wdGlvbnNEZWxlZ2F0ZTxSZXF1ZXN0VCA9IGFueT4gPSAoXG4gIHJlcXVlc3Q6IFJlcXVlc3RULFxuKSA9PiBDb3JzT3B0aW9ucyB8IHZvaWQgfCBQcm9taXNlPENvcnNPcHRpb25zIHwgdm9pZD47XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QifQ==