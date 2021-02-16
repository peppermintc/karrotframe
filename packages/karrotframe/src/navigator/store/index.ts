import React, { useState } from 'react'
import { ScreenComponentProps } from '../ScreenComponentProps'

export interface Screen {
  id: string
  path: string
  Component: React.FC<
    { screenInstanceId: string; as: string } & ScreenComponentProps
  >
}

export interface ScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
  present: boolean
  as: string
}

export interface ScreenInstanceOption {
  navbar: NavbarOptions
}

export interface NavbarOptions {
  visible: boolean
  title: React.ReactNode | null
  appendLeft: React.ReactNode | null
  appendRight: React.ReactNode | null
  closeButtonLocation: 'left' | 'right'
  customBackButton: React.ReactNode | null
  customCloseButton: React.ReactNode | null
  disableScrollToTop: boolean
  onTopClick?: () => void
}

export type ScreenInstancePromise = (data: any | null) => void

export interface ScreenEdge {
  startTime: number | null
  startX: number | null
}

export const useScreenStore = () => {
  const screensState = useState<{ [id: string]: Screen }>({})
  const screenInstancesState = useState<ScreenInstance[]>([])
  const screenInstancePointerState = useState(-1)
  const screenInstanceOptionsState = useState<{
    [id: string]: ScreenInstanceOption
  }>({})
  const screenInstancePromisesState = useState<{
    [id: string]: ScreenInstancePromise
  }>({})
  const screenEdgeState = useState<ScreenEdge>({
    startX: null,
    startTime: null,
  })

  const setScreenInstanceIn = (
    pointer: number,
    setter: (screenInstance: ScreenInstance) => ScreenInstance
  ) => {
    screenInstancesState[1](
      screenInstancesState[0].map((screenInstance, screenInstanceIndex) => {
        if (screenInstanceIndex === pointer) {
          return setter(screenInstance)
        } else {
          return screenInstance
        }
      })
    )
  }

  const addScreenInstanceAfter = (
    pointer: number,
    {
      screenId,
      screenInstanceId,
      present,
      as,
    }: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }
  ) => {
    screenInstancesState[1]([
      ...screenInstancesState[0].filter((_, index) => index <= pointer),
      {
        id: screenInstanceId,
        screenId,
        nestedRouteCount: 0,
        present,
        as,
      },
    ])
  }

  const increaseScreenInstancePointer = () => {
    screenInstancePointerState[1](screenInstancePointerState[0] + 1)
  }

  return {
    screensState,
    screenInstancesState,
    screenInstancePointerState,
    screenInstanceOptionsState,
    screenInstancePromisesState,
    screenEdgeState,
    setScreenInstanceIn,
    addScreenInstanceAfter,
    increaseScreenInstancePointer,
  }
}

export const GlobalStateContext = React.createContext(null as any)
