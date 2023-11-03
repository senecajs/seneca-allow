
import Allow from '../src/allow'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const AllowMessages = require('./allow.messages').default



describe('allow', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Allow)
    await seneca.ready()
  })

  test('messages', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Allow)
    await (SenecaMsgTest(seneca, AllowMessages)())
  })

  test('allow', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use(Allow, {
        check: [
          { a: 1 },
          { b: 2, c: 3 }
        ]
      })
    await seneca.ready()

    const allowed = seneca.export('allow/allowed')
    expect('' + allowed).toEqual(`
a=1 -> <true>
b=2, c=3 -> <true>`.trim())

    const check = seneca.export('allow/check')

    expect(check(allowed, { a: 1 }, {})).toBe(true)
    expect(check(allowed, { a: 2 }, {})).toBe(false)
    expect(check(allowed, { b: 2, c: 3 }, {})).toBe(true)
    expect(check(allowed, { b: 2, c: 4 }, {})).toBe(false)
    expect(check(allowed, { a: 1, b: 2, c: 4 }, {})).toBe(true)

  })


  test('wrap', async () => {
    const seneca = Seneca({ legacy: false, log: 'silent' })
      // .test() 
      .use('promisify')
      .use(Allow, {
        check: [
          { a: 1 },
          { b: 2, c: 3 }
        ],
        wrap: [
          { x: 1 },
          { y: 2 },
        ]
      })
      .message('x:1', async (m: any) => ({ k: 11, a: m.a, b: m.b, c: m.c, }))
      .message('y:2', async (m: any) => ({ k: 22, a: m.a, b: m.b, c: m.c, }))
      .message('z:3', async (m: any) => ({ k: 33, a: m.a, b: m.b, c: m.c, }))
    await seneca.ready()

    // console.log(seneca.find('x:1'))


    expect(await seneca.post('x:1,a:1')).toEqual({ k: 11, a: 1 })
    await expect(seneca.post('x:1,a:2')).rejects.toThrow('not_allowed')

    expect(await seneca.post('y:2,a:1')).toEqual({ k: 22, a: 1 })
    expect(await seneca.post('y:2,b:2,c:3'))
      .toEqual({ k: 22, b: 2, c: 3, a: undefined })

    expect(await seneca.post('z:3,a:1')).toEqual({ k: 33, a: 1 })
    expect(await seneca.post('z:3,a:2')).toEqual({ k: 33, a: 2 })

  })


  test('wrap-path', async () => {
    const seneca = Seneca({ legacy: false, log: 'silent' })
      // .test()
      .use('promisify')
      .use(Allow, {
        check: [
          '"a.b":1,"c.d.e":2',
        ],
        wrap: [
          'x:1',
        ]
      })
      .message('x:1', async (m: any) => ({ k: 11, a: m.a, c: m.c, }))
      .message('y:2', async (m: any) => ({ k: 22, a: m.a, c: m.c, }))
    await seneca.ready()

    expect(await seneca.post('x:1,a:{b:1},c:{d:{e:2}}'))
      .toEqual({ k: 11, a: { b: 1 }, c: { d: { e: 2 } } })
    await expect(seneca.post('x:1,a:{b:1},c:{d:{e:3}}'))
      .rejects.toThrow('not_allowed')

    expect(await seneca.post('y:2,a:{b:1},c:{d:{e:2}}'))
      .toEqual({ k: 22, a: { b: 1 }, c: { d: { e: 2 } } })
    expect(await seneca.post('y:2,a:{b:1},c:{d:{e:3}}'))
      .toEqual({ k: 22, a: { b: 1 }, c: { d: { e: 3 } } })
  })


  test('wrap-custom', async () => {
    const seneca = Seneca({ legacy: false, log: 'silent' })
      // .test()
      .use('promisify')
      .use(Allow, {
        check: [
          '"a.b":1,"c.d.e":2,"custom$.foo":9',
        ],
        wrap: [
          'x:1',
        ]
      })
      .message('x:1', async (m: any) => ({ k: 11, a: m.a, c: m.c, }))
      .message('y:2', async (m: any) => ({ k: 22, a: m.a, c: m.c, }))
    await seneca.ready()


    let delegate = seneca.delegate({}, { custom: { foo: 9 } })

    expect(await delegate.post('x:1,a:{b:1},c:{d:{e:2}}'))
      .toEqual({ k: 11, a: { b: 1 }, c: { d: { e: 2 } } })

    await expect(delegate.post('x:1,a:{b:1},c:{d:{e:3}}'))
      .rejects.toThrow('not_allowed')

    await expect(seneca.post('x:1,a:{b:1},c:{d:{e:2}}'))
      .rejects.toThrow('not_allowed')
    await expect(seneca.post('x:1,a:{b:1},c:{d:{e:3}}'))
      .rejects.toThrow('not_allowed')

    let denied = seneca.delegate({}, { custom: { foo: 8 } })
    await expect(denied.post('x:1,a:{b:1},c:{d:{e:2}}', { custom$: { foo: 9 } }))
      .rejects.toThrow('not_allowed')



    expect(await delegate.post('y:2,a:{b:1},c:{d:{e:2}}'))
      .toEqual({ k: 22, a: { b: 1 }, c: { d: { e: 2 } } })
    expect(await delegate.post('y:2,a:{b:1},c:{d:{e:3}}'))
      .toEqual({ k: 22, a: { b: 1 }, c: { d: { e: 3 } } })
  })


  test('debug', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .quiet()
      .use('promisify')
      .use(Allow, {
        debug: true,
        check: [
          { a: 1 },
        ],
        wrap: [
          { x: 1 },
        ]
      })
      .message('x:1', async (m: any) => ({ k: 11, a: m.a, b: m.b, c: m.c, }))

    await seneca.ready()

    expect(await seneca.post('x:1,a:1')).toEqual({ k: 11, a: 1 })
    await expect(seneca.post('x:1,a:2')).rejects.toThrow('not_allowed')
  })

})

