/* Copyright © 2021-2023 Richard Rodger, MIT License. */


import Hoek from '@hapi/hoek'



type Options = {
  debug: boolean
  check: any[],
  wrap: any[],
}

// Default options.
const defaults = {
  check: [],
  wrap: [],
  debug: false,
}


export type AllowOptions = Partial<Options>



function Allow(this: any, options: any) {
  const seneca: any = this
  const Patrun = seneca.util.Patrun
  const Jsonic = seneca.util.Jsonic
  const allowed = new Patrun({ gex: true })

  let checkpats: any[] = options.check
  let keypaths: string[] = []
  for (let i = 0; i < checkpats.length; i++) {
    let pat = Jsonic(checkpats[i])
    allowed.add(pat, true)
    keypaths = keypaths.concat(Object.keys(pat))
  }

  let wraps: any[] = options.wrap

  if (options.debug) {
    console.log('ALLOW-CHECK')
    console.dir(checkpats, { depth: null })
    console.log('ALLOW-KEYPATHS')
    console.dir(keypaths, { depth: null })
    console.log('ALLOW-WRAPS')
    console.dir(wraps, { depth: null })
    console.log('ALLOW-PATRUN')
    console.log(allowed.toString())
  }

  for (let i = 0; i < wraps.length; i++) {
    let wrap = Jsonic(wraps[i])
    seneca.wrap(wrap, allowCheck)
  }

  function allowCheck(this: any, msg: any, done: any, meta: any) {
    let pass = check(allowed, msg, meta)
    if (pass) {
      return this.prior(msg, done)
    }
    else {
      if (options.debug) {
        console.log('ALLOW-NOT', meta, msg)
      }
      return seneca.fail('not_allowed')
    }
  }


  function check(allowed: typeof Patrun, msg: any, meta: any): boolean {
    let candidate: any = {}
    for (let keypath of keypaths) {
      if (keypath.startsWith('custom$.')) {
        candidate[keypath] = Hoek.reach(meta.custom, keypath.substring(8))
      }
      else {
        candidate[keypath] = Hoek.reach(msg, keypath)
      }
    }
    let result = allowed.find(candidate)
    if (options.debug) {
      console.log('ALLOW-CANDIDATE', candidate, result, meta, msg)
    }
    return !!result
  }


  return {
    exports: {
      check,
      allowed
    }
  }
}



Object.assign(Allow, { defaults })

// Prevent name mangling
Object.defineProperty(Allow, 'name', { value: 'Allow' })

export default Allow

if ('undefined' !== typeof module) {
  module.exports = Allow
}
