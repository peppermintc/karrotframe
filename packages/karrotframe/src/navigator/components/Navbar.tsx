import classnames from 'classnames'
import React, { useEffect, useRef, useState, useContext } from 'react'

import { NavigatorTheme } from '../../types'
import { IconBack, IconClose } from '../assets'
import { useNavigatorOptions } from '../contexts'
import { GlobalStateContext } from '../store'
import { useNavigator } from '../useNavigator'
import styles from './Navbar.scss'

interface NavbarProps {
  screenInstanceId: string
  theme: NavigatorTheme
  isRoot: boolean
  isPresent: boolean
  onTopClick: () => void
  onClose?: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const { pop } = useNavigator()
  const navigatorOptions = useNavigatorOptions()

  const {
    screenInstanceOptionsState: [screenInstanceOptions],
  } = useContext(GlobalStateContext)

  const [centerMainWidth, setCenterMainWidth] = useState<string | undefined>(
    undefined
  )

  const navbarRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () =>
      requestAnimationFrame(() => {
        if (!navbarRef.current || !centerRef.current) {
          return
        }

        const screenWidth = navbarRef.current.clientWidth

        const {
          offsetLeft: leftWidth,
          clientWidth: centerWidth,
        } = centerRef.current
        const rightWidth = screenWidth - leftWidth - centerWidth

        const sideMargin = Math.max(leftWidth, rightWidth)

        setCenterMainWidth(screenWidth - 2 * sideMargin + 'px')
      })

    if (props.theme === 'Cupertino') {
      onResize()

      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        screenInstanceOptions[props.screenInstanceId]
        onResize()
      }
    }
  }, [screenInstanceOptions])

  const onBackClick = () => {
    pop()
  }

  const screenInstanceOption = screenInstanceOptions.get[props.screenInstanceId]
  const closeButton =
    props.onClose &&
    props.isRoot &&
    (screenInstanceOption?.navbar.customCloseButton ? (
      <div className={styles.navbarClose} onClick={props.onClose}>
        {screenInstanceOption.navbar.customCloseButton}
      </div>
    ) : (
      <div className={styles.navbarClose} onClick={props.onClose}>
        <IconClose />
      </div>
    ))

  const backButton =
    !props.isRoot &&
    (screenInstanceOption?.navbar.customBackButton ? (
      <div className={styles.navbarBack} onClick={onBackClick}>
        {screenInstanceOption.navbar.customBackButton}
      </div>
    ) : (
      <div className={styles.navbarBack} onClick={onBackClick}>
        {navigatorOptions.theme === 'Cupertino' && props.isPresent ? (
          <IconClose />
        ) : (
          <IconBack />
        )}
      </div>
    ))

  const isLeft = !!(
    (screenInstanceOption?.navbar.closeButtonLocation === 'left' &&
      closeButton) ||
    backButton ||
    screenInstanceOption?.navbar.appendLeft
  )

  return (
    <div
      ref={navbarRef}
      className={classnames(styles.navbarContainer, 'kf-navbar')}
    >
      <div className={styles.navbarMain}>
        <div className={styles.navbarFlex}>
          <div className={styles.navbarLeft}>
            {screenInstanceOption?.navbar.closeButtonLocation === 'left' &&
              closeButton}
            {backButton}
            {screenInstanceOption?.navbar.appendLeft}
          </div>
          <div ref={centerRef} className={styles.navbarCenter}>
            <div
              className={classnames(styles.navbarCenterMain, {
                [styles.isLeft]: isLeft,
              })}
              style={{
                width: centerMainWidth,
              }}
            >
              {typeof screenInstanceOption?.navbar.title === 'string' ? (
                <div className={styles.navbarCenterMainText}>
                  {screenInstanceOption?.navbar.title}
                </div>
              ) : (
                screenInstanceOption?.navbar.title
              )}
            </div>
            <div
              className={styles.navbarCenterMainEdge}
              style={{
                width: centerMainWidth,
              }}
              onClick={props.onTopClick}
            />
          </div>
          <div className={styles.navbarRight}>
            {screenInstanceOption?.navbar.appendRight}
            {screenInstanceOption?.navbar.closeButtonLocation === 'right' &&
              closeButton}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar
