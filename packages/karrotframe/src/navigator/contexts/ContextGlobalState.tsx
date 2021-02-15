import React, { createContext, useContext, useRef, useState } from 'react'
import {
  Screen,
  ScreenEdge,
  ScreenInstance,
  ScreenInstanceOption,
  ScreenInstancePromise,
} from '../store'

interface GlobalState {
  screens: React.MutableRefObject<{
    [screenId: string]: Screen
  }>
  screenInstances: ScreenInstance[]
  screenInstancePointer: number
  screenInstanceOptions: {
    [screenInstanceId: string]: ScreenInstanceOption
  }
  screenInstancePromises: React.MutableRefObject<{
    [screenInstanceId: string]: ScreenInstancePromise
  }>
  screenEdge: React.MutableRefObject<ScreenEdge>
  addScreen: (screenId: string, screen: Screen) => void
  addScreenInstanceOption: (
    screenInstanceId: string,
    screenInstanceOption: ScreenInstanceOption
  ) => void
  addScreenInstancePromise: (
    screenInstanceId: string,
    screenInstancePromise: ScreenInstancePromise
  ) => void
  updateScreenInstance: (
    pointer: number,
    setter: (screenInstance: ScreenInstance) => ScreenInstance
  ) => void
  pushScreenInstanceAfter: (
    pointer: number,
    data: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }
  ) => void
  incScreenInstancePointer: () => void
  setScreenInstancePointer: (pointer: number) => void
  setScreenEdge: (edge: ScreenEdge) => void
}
export const ContextGlobalState = createContext<GlobalState>(null as any)

export const GlobalStateProvider: React.FC = ({ children }) => {
  const screens = useRef<{
    [screenId: string]: Screen
  }>({})

  const [screenInstances, setScreenInstances] = useState<ScreenInstance[]>([])
  const [screenInstancePointer, setScreenInstancePointer] = useState<number>(-1)
  const [screenInstanceOptions, setScreenInstanceOptions] = useState<{
    [screenInstanceId: string]: ScreenInstanceOption
  }>({})
  const screenInstancePromises = useRef<{
    [screenInstanceId: string]: ScreenInstancePromise
  }>({})
  const screenEdge = useRef<ScreenEdge>({
    startX: null,
    startTime: null,
  })

  const addScreen = (screenId: string, screen: Screen) => {
    screens.current = {
      ...screens.current,
      [screenId]: screen,
    }
  }

  const addScreenInstanceOption = (
    screenInstanceId: string,
    option: ScreenInstanceOption
  ) => {
    setScreenInstanceOptions({
      ...screenInstanceOptions,
      [screenInstanceId]: option,
    })
  }

  const addScreenInstancePromise = (
    screenInstanceId: string,
    promise: ScreenInstancePromise
  ) => {
    screenInstancePromises.current = {
      ...screenInstancePromises.current,
      [screenInstanceId]: promise,
    }
  }

  const updateScreenInstance = (
    pointer: number,
    setter: (screenInstance: ScreenInstance) => ScreenInstance
  ) => {
    setScreenInstances([
      ...screenInstances.map((instance, instanceIndex) => {
        if (instanceIndex === pointer) {
          return setter(instance)
        } else {
          return instance
        }
      }),
    ])
  }

  const pushScreenInstanceAfter = (
    pointer: number,
    data: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }
  ) => {
    setScreenInstances([
      ...screenInstances.filter((_, i) => i <= pointer),
      {
        id: data.screenInstanceId,
        screenId: data.screenId,
        nestedRouteCount: 0,
        present: data.present,
        as: data.as,
      },
    ])
  }

  const incScreenInstancePointer = () => {
    setScreenInstancePointer(screenInstancePointer + 1)
  }

  const setScreenEdge = (data: ScreenEdge) => {
    screenEdge.current = data
  }

  return (
    <ContextGlobalState.Provider
      value={{
        screens,
        screenInstances,
        screenInstancePointer,
        screenInstanceOptions,
        screenInstancePromises,
        screenEdge,
        addScreen,
        addScreenInstanceOption,
        addScreenInstancePromise,
        updateScreenInstance,
        pushScreenInstanceAfter,
        incScreenInstancePointer,
        setScreenEdge,
        setScreenInstancePointer,
      }}
    >
      {children}
    </ContextGlobalState.Provider>
  )
}

export function useGlobalState() {
  return useContext(ContextGlobalState)
}
