import { Environment, Network, RecordSource, Store } from 'relay-runtime'

export function makeRelayEnvironment({ endpoint }: { endpoint: string }) {
  const source = new RecordSource()
  const store = new Store(source)

  const environment = new Environment({
    network: Network.create(async (operation, variables) => {
      return fetch(endpoint, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: operation.text,
          variables,
        }),
      }).then((h) => h.json())
    }),
    store,
  })

  return environment
}
