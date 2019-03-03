"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function filterComments(text) {
    let filtered;
    //block comments
    filtered = text.replace(/(\/\*)([\S\s]*?)(\*\/)/g, '');
    //regular comments
    filtered = filtered.replace(/(\/\/)(.*?)(?=\r\n)/g, '');
    return filtered;
}
exports.filterComments = filterComments;
//# sourceMappingURL=utils.js.map