import { Dispatch, SetStateAction } from 'react'

export interface ScreenComponentProps {
  isTop?: boolean
  isRoot?: boolean
  setOnEnteredCallback?: Dispatch<SetStateAction<() => void>>
}
