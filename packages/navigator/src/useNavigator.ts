import { useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'
import { useScreenInstances } from './globalState'
import { usePlugins } from './globalState/Plugins'
import {
  makeNavigatorSearchParams,
  nextTick,
  parseNavigatorSearchParams,
} from './helpers'
import { useIncrementalId } from './hooks'
import { useAnimationContext } from './globalState/Animation'

export function useNavigator() {
  const history = useHistory()
  const location = useLocation()
  const screenInfo = useScreenInstance()
  const makeId = useIncrementalId()
  const { lifecycleHooks } = usePlugins()

  const {
    screenInstances,
    screenInstancePtr,
    screenInstancePromiseMap,
    addScreenInstancePromise,
  } = useScreenInstances()

  const { activeAnimation } = useAnimationContext()

  const navigatorSearchParams = parseNavigatorSearchParams(location.search)
  const { present, screenInstanceId } = navigatorSearchParams.toObject()

  const currentScreenInstance = useMemo(
    () => screenInstances[screenInstancePtr],
    [screenInstances, screenInstancePtr]
  )

  const beforePush = useCallback(
    (to: string) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          screenInstances,
          screenInstancePtr,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.beforePush?.(context)
      })
    },
    [lifecycleHooks]
  )

  const onPushed = useCallback(
    (to) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          screenInstances,
          screenInstancePtr,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.onPushed?.(context)
      })
    },
    [lifecycleHooks]
  )

  const beforeReplace = useCallback(
    (to) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.beforeReplace?.(context)
      })
    },
    [lifecycleHooks]
  )

  const onReplaced = useCallback(
    (to) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.onReplaced?.(context)
      })
    },
    [lifecycleHooks]
  )

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        /**
         * Bottom to top animation (iOS only)
         */
        present?: boolean
        /**
         * activate screen switch animation
         */
        animate?: boolean
      }
    ): Promise<T | null> =>
      new Promise(async (resolve) => {
        await beforePush(to)
        const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

        const navigatorSearchParams = makeNavigatorSearchParams(searchParams, {
          screenInstanceId: makeId(),
          present: options?.present,
        })

        addScreenInstancePromise({
          screenInstanceId: screenInfo.screenInstanceId,
          screenInstancePromise: {
            resolve,
          },
        })
        onPushed(to)
        const animate = options?.animate ?? true
        activeAnimation(animate)
        history.push(`${pathname}?${navigatorSearchParams.toString()}`)
      }),
    [screenInfo, history]
  )

  const replace = useCallback(
    (
      to: string,
      options?: {
        /**
         * activate screen switch animation
         */
        animate?: boolean
      }
    ) => {
      beforeReplace(to)
      const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

      const navigatorSearchParams = makeNavigatorSearchParams(searchParams, {
        screenInstanceId: makeId(),
        present,
      })

      onReplaced(to)
      nextTick(() => {
        activeAnimation(!!options?.animate)
        history.replace(`${pathname}?${navigatorSearchParams.toString()}`)
      })
    },
    [history, screenInstanceId, present]
  )

  const beforePop = useCallback(() => {
    lifecycleHooks.forEach((hook) => {
      const context = {
        from: currentScreenInstance?.as,
        screenInstances,
        screenInstancePtr,
        options: {
          push,
          replace,
          pop,
        },
      }
      hook?.beforePop?.(context)
    })
  }, [lifecycleHooks])

  const onPopped = useCallback(() => {
    lifecycleHooks.forEach((hook) => {
      const context = {
        from: currentScreenInstance?.as,
        screenInstances,
        screenInstancePtr,
        options: {
          push,
          replace,
          pop,
        },
      }
      hook?.onPopped?.(context)
    })
  }, [lifecycleHooks])

  const onPoppedWithData = useCallback(
    (data: any) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          from: currentScreenInstance?.as,
          data,
          options: {
            push,
            replace,
            pop,
          },
        } as any
        hook?.onPoppedWithData?.(context)
      })
    },
    [lifecycleHooks]
  )

  const pop = useCallback(
    (
      depth = 1,
      options?: {
        /**
         * activate screen switch animation
         */
        animate?: boolean
      }
    ) => {
      beforePop()
      const targetScreenInstance = screenInstances[screenInstancePtr - depth]

      const backwardCount = screenInstances
        .filter(
          (_, idx) =>
            idx > screenInstancePtr - depth && idx <= screenInstancePtr
        )
        .map((screenInstance) => screenInstance.nestedRouteCount)
        .reduce((acc, current) => acc + current + 1, 0)

      console.log(
        'karrotframe - backwardCount',
        backwardCount,
        screenInstancePtr
      )
      console.log('karrotframe - screenInstance', screenInstances)

      const targetPromise =
        targetScreenInstance &&
        screenInstancePromiseMap[targetScreenInstance.id]
      let _data: any = null

      const dispose = history.listen(() => {
        dispose()

        if (targetScreenInstance) {
          targetPromise?.resolve(_data ?? null)
        }
      })

      /**
       * Send data to `await push()`
       */
      function send<T = object>(
        /**
         * Payload
         */
        data: T
      ) {
        _data = data
        // FIXME: 'onPoppedWithData' and 'onPopped' should be unified later
        onPoppedWithData(data)
      }
      onPopped()
      nextTick(() => {
        const animate = options?.animate ?? true
        activeAnimation(animate)
        history.go(-backwardCount)
      })

      return {
        send,
      }
    },
    [screenInstances, screenInstancePtr, screenInstancePromiseMap, history]
  )

  return useMemo(
    () => ({
      push,
      replace,
      pop,
    }),
    [push, replace, pop]
  )
}
