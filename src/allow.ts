/* Copyright © 2021 Richard Rodger, MIT License. */


import Hoek from '@hapi/hoek'


function allow(this: any, options: any) {
  const seneca: any = this
  const Patrun = seneca.util.Patrun
  const Jsonic = seneca.util.Jsonic
  const allowed = new Patrun({ gex: true })

  let checkpats: any[] = options.check
  let keypaths: string[] = []
  for (let i = 0; i < checkpats.length; i++) {
    let pat = Jsonic(checkpats[i])
    // console.log(checkpats[i], pat)
    allowed.add(pat, true)
    keypaths = keypaths.concat(Object.keys(pat))
  }

  // console.log(''+allowed)


  let wraps: any[] = options.wrap

  for (let i = 0; i < wraps.length; i++) {
    let wrap = Jsonic(wraps[i])
    // console.log(wraps[i], wrap)
    seneca.wrap(wrap, allowCheck)
  }

  function allowCheck(this: any, msg: any, done: any, meta: any) {
    let pass = check(allowed, msg, meta)
    if (pass) {
      return this.prior(msg, done)
    }
    else {
      return seneca.fail('not_allowed')
    }
  }


  function check(allowed: typeof Patrun, msg: any, meta: any): boolean {
    let candidate: any = {}
    for (let keypath of keypaths) {
      if (keypath.startsWith('custom$.')) {
        // console.log('META', meta.custom)
        candidate[keypath] = Hoek.reach(meta.custom, keypath.substring(8))
      }
      else {
        candidate[keypath] = Hoek.reach(msg, keypath)
      }
    }
    console.log('C', candidate)
    let result = allowed.find(candidate)
    return !!result
  }


  return {
    exports: {
      check,
      allowed
    }
  }
}


// Default options.
allow.defaults = {
  check: [],
  wrap: [],
}


export default allow




if ('undefined' !== typeof (module)) {
  module.exports = allow
}
