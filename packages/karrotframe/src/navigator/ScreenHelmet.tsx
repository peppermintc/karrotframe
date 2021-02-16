import React, { useEffect, useCallback, useContext } from 'react'
import { Navbar } from './components'
import zenscroll from 'zenscroll'

import { useGlobalState, useNavigatorOptions, useScreenInstanceOptions } from './contexts'
import { FrameRefContext, NavbarInformationContext } from './components/Card'

interface ScreenHelmetProps {
  /**
   * 네비게이션의 타이틀
   */
  title?: React.ReactNode

  /**
   * 네비게이션의 왼쪽에 요소를 추가
   * (이전 버튼 오른쪽에 표시됩니다)
   */
  appendLeft?: React.ReactNode

  /**
   * 네비게이션의 오른쪽 요소를 추가
   * (닫기 버튼 왼쪽에 표시됩니다)
   */
  appendRight?: React.ReactNode

  /**
   * 닫기 버튼의 위치
   */
  closeButtonLocation?: 'left' | 'right'

  /**
   * 이전 버튼을 사용자화합니다
   */
  customBackButton?: React.ReactNode

  /**
   * 닫기 버튼을 사용자화합니다
   */
  customCloseButton?: React.ReactNode

  /**
   * 상단바를 클릭했을때 상단으로 스크롤되는 기능을 비활성화합니다
   */
  disableScrollToTop?: boolean

  /**
   * 상단바를 클릭했을때 호출될 콜백을 설정합니다
   */
  onTopClick?: () => void
}
const ScreenHelmet: React.FC<ScreenHelmetProps> = (props) => {
  const frameRef = useContext(FrameRefContext)
  const navbarInformation = useContext(NavbarInformationContext)

  const screen = useScreenInstanceOptions()
  const navigatorOptions = useNavigatorOptions()
  const { screenInstanceOptions } = useGlobalState()


  useEffect(() => {
    screen.setNavbar({
      visible: true,
      disableScrollToTop: props.disableScrollToTop ?? false,
    })
  }, [props.disableScrollToTop])

  useEffect(
    () => () => {
      screen.setNavbar({
        visible: false,
        disableScrollToTop: false,
      })
    },
    []
  )

  const handleTopClick = useCallback(() => {
    const screenInstanceOption = screenInstanceOptions[screen.screenInstanceId]

    if (!screenInstanceOption?.navbar.disableScrollToTop) {
      if (frameRef && frameRef.current) {
        const scroller = zenscroll.createScroller(frameRef.current)
        scroller.toY(0)
      }
    }

    props.onTopClick?.()
  }, [screenInstanceOptions])

  return (
    <Navbar
      screenInstanceId={screen.screenInstanceId}
      theme={navigatorOptions.theme}
      isRoot={navbarInformation!.isRoot}
      isPresent={navbarInformation!.isPresent}
      title={props.title}
      appendLeft={props.appendLeft}
      appendRight={props.appendRight}
      closeButtonLocation={props.closeButtonLocation}
      customBackButton={props.customBackButton}
      customCloseButton={props.customCloseButton}
      onClose={navbarInformation!.onClose}
      onTopClick={handleTopClick}
    />
  )
}

export default ScreenHelmet
