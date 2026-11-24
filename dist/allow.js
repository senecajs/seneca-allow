"use strict";
/* Copyright © 2021-2023 Richard Rodger, MIT License. */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hoek_1 = __importDefault(require("@hapi/hoek"));
// Default options.
const defaults = {
    check: [],
    wrap: [],
    debug: false,
};
function Allow(options) {
    const seneca = this;
    const Patrun = seneca.util.Patrun;
    const Jsonic = seneca.util.Jsonic;
    const allowed = new Patrun({ gex: true });
    let checkpats = options.check;
    let keypaths = [];
    for (let i = 0; i < checkpats.length; i++) {
        let pat = Jsonic(checkpats[i]);
        allowed.add(pat, true);
        keypaths = keypaths.concat(Object.keys(pat));
    }
    let wraps = options.wrap;
    if (options.debug) {
        console.log('ALLOW-CHECK');
        console.dir(checkpats, { depth: null });
        console.log('ALLOW-KEYPATHS');
        console.dir(keypaths, { depth: null });
        console.log('ALLOW-WRAPS');
        console.dir(wraps, { depth: null });
        console.log('ALLOW-PATRUN');
        console.log(allowed.toString());
    }
    for (let i = 0; i < wraps.length; i++) {
        let wrap = Jsonic(wraps[i]);
        seneca.wrap(wrap, allowCheck);
    }
    function allowCheck(msg, done, meta) {
        let pass = check(allowed, msg, meta);
        if (pass) {
            return this.prior(msg, done);
        }
        else {
            if (options.debug) {
                console.log('ALLOW-NOT', meta, msg);
            }
            return seneca.fail('not_allowed');
        }
    }
    function check(allowed, msg, meta) {
        let candidate = {};
        for (let keypath of keypaths) {
            if (keypath.startsWith('custom$.')) {
                candidate[keypath] = hoek_1.default.reach(meta.custom, keypath.substring(8));
            }
            else {
                candidate[keypath] = hoek_1.default.reach(msg, keypath);
            }
        }
        let result = allowed.find(candidate);
        if (options.debug) {
            console.log('ALLOW-CANDIDATE', candidate, result, meta, msg);
        }
        return !!result;
    }
    return {
        exports: {
            check,
            allowed
        }
    };
}
Object.assign(Allow, { defaults });
// Prevent name mangling
Object.defineProperty(Allow, 'name', { value: 'Allow' });
exports.default = Allow;
if ('undefined' !== typeof module) {
    module.exports = Allow;
}
//# sourceMappingURL=allow.js.map