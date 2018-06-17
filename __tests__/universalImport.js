import universalImport from '../universalImport'

describe('universalImport function functions as expected', () => {
  it('executes the promise', () => {
    const load = jest.fn()
    const config = {
      load: () => new Promise(load)
    }
    const result = universalImport(config)
    expect(load).toHaveBeenCalled()
  })

  it('executes chained promise', () => {
    let resolvePromise
    const config = {
      load: () =>
        new Promise(resolve => {
          resolvePromise = resolve
        })
    }
    const result = universalImport(config)
    const chainedFunction = jest.fn()
    const catchFunction = jest.fn()
    result.then(chainedFunction)
    result.catch(catchFunction)
    expect(chainedFunction).not.toHaveBeenCalled()
    resolvePromise()
    return Promise.resolve().then(() => {
      expect(chainedFunction).toHaveBeenCalled()
      expect(catchFunction).not.toHaveBeenCalled()
    })
  })

  it('executes chained catch', () => {
    let rejectPromise
    const config = {
      load: () =>
        new Promise((_, reject) => {
          rejectPromise = reject
        })
    }
    const result = universalImport(config)
    const chainedFunction = jest.fn()
    const catchFunction = jest.fn()
    result.then(chainedFunction)
    result.catch(catchFunction)
    expect(chainedFunction).not.toHaveBeenCalled()
    rejectPromise()
    return Promise.resolve().then(() => {
      expect(chainedFunction).not.toHaveBeenCalled()
      expect(catchFunction).toHaveBeenCalled()
    })
  })
})
