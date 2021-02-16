import { useCallback, useContext } from 'react'
import { useHistory } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useScreenInstanceInfo } from './contexts'
import { GlobalStateContext } from './store'

export function useNavigator() {
  const history = useHistory()
  const screenInfo = useScreenInstanceInfo()

  const {
    screenInstancesState: [screenInstances],
    screenInstancePointerState: [screenInstancePointer],
    screenInstancePromisesState: [
      screenInstancePromises,
      setScreenInstancePromises,
    ],
  } = useContext(GlobalStateContext)

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

        setScreenInstancePromises({
          ...screenInstancePromises,
          [screenInfo.screenInstanceId]: resolve,
        })
      }),
    []
  )

  const replace = useCallback((to: string) => {
    const [pathname, search] = to.split('?')
    const _si = generateScreenInstanceId()

    history.replace(pathname + '?' + appendSearch(search, { _si }))
  }, [])

  const pop = useCallback((depth = 1) => {
    console.log('pop called', screenInstances)
    const targetScreenInstance = screenInstances[screenInstancePointer - depth]

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
        screenInstancePromises[targetScreenInstance.id]?.(data ?? null)
      }
    }

    return { send }
  }, [])

  return { push, replace, pop }
}
