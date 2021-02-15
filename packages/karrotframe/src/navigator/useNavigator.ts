import { useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useGlobalState, useScreenInstanceInfo } from './contexts'

export function useNavigator() {
  const {
    screenInstances,
    screenInstancePointer,
    screenInstancePromises,
    addScreenInstancePromise,
  } = useGlobalState()

  const history = useHistory()
  const screenInfo = useScreenInstanceInfo()

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        present?: boolean
      }
    ): Promise<T | null> =>
      new Promise((resolve) => {
        const [pathname, search] = to.split('?')
        const _si = generateScreenInstanceId()

        const params: {
          _si: string
          _present?: 'true'
        } = {
          _si,
        }

        if (options?.present) {
          params._present = 'true'
        }

        history.push(pathname + '?' + appendSearch(search || null, params))

        addScreenInstancePromise(screenInfo.screenInstanceId, resolve)
      }),
    []
  )

  const replace = useCallback((to: string) => {
    const [pathname, search] = to.split('?')
    const _si = generateScreenInstanceId()

    history.replace(pathname + '?' + appendSearch(search, { _si }))
  }, [])

  const pop = useCallback(
    (depth = 1) => {
      const targetScreenInstance =
        screenInstances[screenInstancePointer - depth]

      const n = screenInstances
        .filter(
          (_, idx) =>
            idx > screenInstancePointer - depth && idx <= screenInstancePointer
        )
        .map((screenInstance) => screenInstance.nestedRouteCount)
        .reduce((acc, current) => acc + current + 1, 0)

      history.go(-n)

      const send = <T = object>(data: T) => {
        if (targetScreenInstance) {
          screenInstancePromises.current[targetScreenInstance.id]?.(
            data ?? null
          )
        }
      }

      return { send }
    },
    [screenInstances, screenInstancePointer]
  )

  return { push, replace, pop }
}
