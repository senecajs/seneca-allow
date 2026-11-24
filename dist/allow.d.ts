type Options = {
    debug: boolean;
    check: any[];
    wrap: any[];
};
export type AllowOptions = Partial<Options>;
declare function Allow(this: any, options: any): {
    exports: {
        check: (allowed: any, msg: any, meta: any) => boolean;
        allowed: any;
    };
};
export default Allow;
