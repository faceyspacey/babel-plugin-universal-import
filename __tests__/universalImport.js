import universalImport from '../universalImport'

describe('universalImport function functions as expected', () => {
  it('calls load() on the client without .then() or .catch() being called', () => {
    const load = jest.fn()
    const config = {
      load: () => new Promise(load)
    }
    universalImport(config)
    expect(load).toHaveBeenCalled()
  })

  it("doesn't call load() on the server unless .then() or .catch() is called", () => {
    const load = jest.fn()
    const config = {
      load: () => new Promise(load),
      testServer: true
    }
    universalImport(config)
    expect(load).not.toHaveBeenCalled()
  })

  it('executes chained promise', () => {
    let resolvePromise
    let loadPromise
    const config = {
      load: () => {
        if (!loadPromise) {
          loadPromise = new Promise(resolve => {
            resolvePromise = resolve
          })
        }
        return loadPromise
      }
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
    let loadPromise
    const config = {
      load: () => {
        if (!loadPromise) {
          loadPromise = new Promise((_, reject) => {
            rejectPromise = reject
          })
        }
        return loadPromise
      }
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
