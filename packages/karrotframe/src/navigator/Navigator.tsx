import classnames from 'classnames'
import { autorun } from 'mobx'
import qs from 'querystring'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import {
  HashRouter,
  matchPath,
  useHistory,
  useLocation,
} from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { NavigatorTheme } from '../types'
import { appendSearch, generateScreenInstanceId } from '../utils'
import { Card } from './components'
import {
  GlobalStateProvider,
  NavigatorOptionsProvider,
  useGlobalState,
  useNavigatorOptions,
} from './contexts'
import {
  useHistoryPopEffect,
  useHistoryPushEffect,
  useHistoryReplaceEffect,
} from './hooks/useHistoryEffect'
import styles from './Navigator.scss'
import { Screen, ScreenInstance } from './store'

const DEFAULT_CUPERTINO_ANIMATION_DURATION = 350
const DEFAULT_ANDROID_ANIMATION_DURATION = 270

/**
 * Navigator가 이미 초기화되었는지 확인
 * 한 개의 history stack을 사용하기 때문에, 한 개의 앱에는 한 개의 Navigator만 허용
 */
let isNavigatorInitialized = false

interface NavigatorProps {
  /**
   * 테마 (기본값: Web)
   */
  theme?: NavigatorTheme

  /**
   * 애니메이션 지속시간
   */
  animationDuration?: number

  /**
   * 빌트인 된 react-router-dom의 HashRouter를 없애고, 사용자가 직접 Router를 셋팅합니다
   */
  useCustomRouter?: boolean

  /**
   * 닫기 버튼을 눌렀을때 해당 콜백이 호출됩니다
   */
  onClose?: () => void

  /**
   * 네비게이션의 깊이가 변할때마다 해당 콜백이 호출됩니다
   */
  onDepthChange?: (depth: number) => void
}
const Navigator: React.FC<NavigatorProps> = (props) => {
  let h = (
    <GlobalStateProvider>
      <NavigatorOptionsProvider
        value={{
          theme: props.theme ?? 'Android',
          animationDuration:
            props.animationDuration ??
            (() => {
              switch (props.theme ?? 'Android') {
                case 'Cupertino':
                  return DEFAULT_CUPERTINO_ANIMATION_DURATION
                case 'Android':
                  return DEFAULT_ANDROID_ANIMATION_DURATION
              }
            })(),
        }}
      >
        <NavigatorScreens
          theme={props.theme ?? 'Android'}
          onClose={props.onClose}
          onDepthChange={props.onDepthChange}
        >
          {props.children}
        </NavigatorScreens>
      </NavigatorOptionsProvider>
    </GlobalStateProvider>
  )

  if (!props.useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

interface NavigatorScreensProps {
  theme: NavigatorTheme
  onClose?: () => void
  onDepthChange?: (depth: number) => void
}
const NavigatorScreens: React.FC<NavigatorScreensProps> = (props) => {
  const location = useLocation()
  const history = useHistory()
  const {
    screens,
    screenInstances,
    screenInstancePointer,
    pushScreenInstanceAfter,
    incScreenInstancePointer,
    setScreenInstancePointer,
    screenInstancePromises,
    updateScreenInstance,
  } = useGlobalState()

  const pushScreen = useCallback(
    ({
      screenId,
      screenInstanceId,
      present,
      as,
    }: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }) => {
      const nextPointer = screenInstances.findIndex(
        (screenInstance) => screenInstance.id === screenInstanceId
      )

      if (nextPointer === -1) {
        pushScreenInstanceAfter(screenInstancePointer, {
          screenId,
          screenInstanceId,
          present,
          as,
        })
        incScreenInstancePointer()
      } else {
        setScreenInstancePointer(nextPointer)
      }
    },
    [screenInstances, screenInstancePointer]
  )

  const replaceScreen = useCallback(
    ({
      screenId,
      screenInstanceId,
      as,
    }: {
      screenId: string
      screenInstanceId: string
      as: string
    }) => {
      pushScreenInstanceAfter(screenInstancePointer - 1, {
        screenId,
        screenInstanceId,
        present: false,
        as,
      })
    },
    [screenInstancePointer]
  )

  const popScreen = useCallback(
    ({
      depth,
      targetScreenInstanceId,
    }: {
      depth: number
      targetScreenInstanceId?: string
    }) => {
      if (targetScreenInstanceId) {
        setTimeout(() => {
          screenInstancePromises.current[targetScreenInstanceId]?.(1)
        }, 0)
      }
      setScreenInstancePointer(screenInstancePointer - depth)
    },
    [screenInstancePointer]
  )

  useEffect(() => {
    if (isNavigatorInitialized) {
      throw new Error('한 개의 앱에는 한 개의 Navigator만 허용됩니다')
    }

    const [, search] = location.search.split('?')
    const _si = generateScreenInstanceId()

    history.replace(location.pathname + '?' + appendSearch(search, { _si }))

    isNavigatorInitialized = true

    return () => {
      isNavigatorInitialized = false
    }
  }, [])

  useEffect(() => {
    if (!location.search) {
      return
    }
    const [, search] = location.search.split('?')
    const _si = qs.parse(search)?._si as string | undefined

    if (!_si) {
      return
    }
    if (screenInstances.length > 0) {
      return
    }

    let matchScreen: Screen | null = null

    for (const screen of Object.values(screens.current)) {
      if (matchPath(location.pathname, { exact: true, path: screen.path })) {
        matchScreen = screen
        break
      }
    }

    if (matchScreen) {
      pushScreen({
        screenId: matchScreen.id,
        screenInstanceId: _si,
        present: false,
        as: location.pathname,
      })
    }
  }, [location.search, screenInstances])

  useEffect(
    () =>
      autorun(() => {
        if (screenInstancePointer > -1) {
          props.onDepthChange?.(screenInstancePointer)
        }
      }),
    [props.onDepthChange, screenInstancePointer]
  )

  useHistoryPushEffect(
    (location) => {
      let matchScreen: Screen | null = null

      for (const screen of Object.values(screens.current)) {
        if (matchPath(location.pathname, { exact: true, path: screen.path })) {
          matchScreen = screen
          break
        }
      }

      const [, search] = location.search.split('?')

      const screenInstanceId = qs.parse(search)?._si as string | undefined
      const present = qs.parse(search)?._present as string | undefined

      if (matchScreen && screenInstanceId) {
        pushScreen({
          screenId: matchScreen.id,
          screenInstanceId,
          present: present === 'true',
          as: location.pathname,
        })
      } else {
        updateScreenInstance(screenInstancePointer, (screenInstance) => ({
          ...screenInstance,
          nestedRouteCount: screenInstance.nestedRouteCount + 1,
        }))
      }
    },
    [pushScreen, screenInstancePointer]
  )

  useHistoryReplaceEffect(
    (location) => {
      let matchScreen: Screen | null = null

      for (const screen of Object.values(screens.current)) {
        if (matchPath(location.pathname, { exact: true, path: screen.path })) {
          matchScreen = screen
          break
        }
      }

      const [, search] = location.search.split('?')
      const screenInstanceId = qs.parse(search)?._si as string | undefined

      if (matchScreen && screenInstanceId) {
        replaceScreen({
          screenId: matchScreen.id,
          screenInstanceId,
          as: location.pathname,
        })
      }
    },
    [replaceScreen]
  )

  useHistoryPopEffect(
    {
      backward(location) {
        let matchScreen: Screen | null = null

        for (const screen of Object.values(screens.current)) {
          if (
            matchPath(location.pathname, { exact: true, path: screen.path })
          ) {
            matchScreen = screen
            break
          }
        }

        const [, search] = location.search.split('?')
        const screenInstanceId = qs.parse(search)?._si as string | undefined

        if (matchScreen && screenInstanceId) {
          const nextPointer = screenInstances.findIndex(
            (screenInstance) => screenInstance.id === screenInstanceId
          )

          updateScreenInstance(screenInstancePointer, (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: 0,
          }))
          popScreen({
            depth: screenInstancePointer - nextPointer,
            targetScreenInstanceId: screenInstanceId,
          })
        } else if (
          screenInstances[screenInstancePointer]?.nestedRouteCount === 0
        ) {
          popScreen({
            depth: 1,
          })
        } else {
          updateScreenInstance(screenInstancePointer, (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: screenInstance.nestedRouteCount - 1,
          }))
        }
      },
      forward(location) {
        let screen: Screen | null = null

        for (const s of Object.values(screens.current)) {
          if (matchPath(location.pathname, { exact: true, path: s.path })) {
            screen = s
            break
          }
        }

        const [, search] = location.search.split('?')

        const screenInstanceId = qs.parse(search)?._si as string | undefined
        const present = qs.parse(search)?._present as string | undefined

        if (screen && screenInstanceId) {
          pushScreen({
            screenId: screen.id,
            screenInstanceId,
            present: present === 'true',
            as: location.pathname,
          })
        } else {
          updateScreenInstance(screenInstancePointer, (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: screenInstance.nestedRouteCount + 1,
          }))
        }
      },
    },
    [popScreen, pushScreen, screenInstances, screenInstancePointer]
  )

  return (
    <div
      className={classnames(styles.navigatorRoot, {
        'kf-android': props.theme === 'Android',
        'kf-cupertino': props.theme === 'Cupertino',
      })}
    >
      {props.children}
      <TransitionGroup>
        {screenInstances.map((screenInstance, index) => (
          <Transition
            key={index}
            screenInstance={screenInstance}
            screenInstanceIndex={index}
            isRoot={index === 0}
            isTop={index === screenInstancePointer}
            onClose={props.onClose}
          />
        ))}
      </TransitionGroup>
    </div>
  )
}

interface TransitionProps {
  screenInstance: ScreenInstance
  screenInstanceIndex: number
  isRoot: boolean
  isTop: boolean
  onClose?: () => void
}
const Transition: React.FC<TransitionProps> = memo((props) => {
  const navigatorOptions = useNavigatorOptions()
  const nodeRef = useRef<HTMLDivElement>(null)
  const { screens, screenInstances, screenInstancePointer } = useGlobalState()

  const { Component, path } = screens.current[props.screenInstance.screenId]

  return (
    <CSSTransition
      key={props.screenInstance.id}
      nodeRef={nodeRef}
      timeout={navigatorOptions.animationDuration}
      in={props.screenInstanceIndex <= screenInstancePointer}
      unmountOnExit
    >
      <Card
        nodeRef={nodeRef}
        screenPath={path}
        screenInstanceId={props.screenInstance.id}
        isRoot={props.screenInstanceIndex === 0}
        isTop={
          props.screenInstanceIndex >= screenInstancePointer ||
          (navigatorOptions.theme === 'Cupertino' &&
            screenInstances.length > props.screenInstanceIndex + 1 &&
            screenInstances[props.screenInstanceIndex + 1].present)
        }
        isPresent={props.screenInstance.present}
        onClose={props.onClose}
      >
        <Component
          as={props.screenInstance.as}
          screenInstanceId={props.screenInstance.id}
          isTop={props.isTop}
          isRoot={props.isRoot}
        />
      </Card>
    </CSSTransition>
  )
})

export default Navigator
