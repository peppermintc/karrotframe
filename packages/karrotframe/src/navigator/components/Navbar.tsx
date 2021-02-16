import classnames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'

import { NavigatorTheme } from '../../types'
import { IconBack, IconClose } from '../assets'
import { useGlobalState, useNavigatorOptions } from '../contexts'
import { useNavigator } from '../useNavigator'
import styles from './Navbar.scss'

interface NavbarProps {
  screenInstanceId: string
  theme: NavigatorTheme
  isRoot: boolean
  isPresent: boolean
  title?: React.ReactNode
  appendLeft?: React.ReactNode
  appendRight?: React.ReactNode
  closeButtonLocation?: 'left' | 'right'
  customBackButton?: React.ReactNode
  customCloseButton?: React.ReactNode
  onTopClick: () => void
  onClose?: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const { screenInstanceOptions } = useGlobalState()
  const { pop } = useNavigator()
  const navigatorOptions = useNavigatorOptions()

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
      }
    }
  }, [screenInstanceOptions])

  const onBackClick = () => {
    pop()
  }

  const closeButton =
    props.onClose &&
    props.isRoot &&
    (props.customCloseButton ? (
      <div className={styles.navbarClose} onClick={props.onClose}>
        {props.customCloseButton}
      </div>
    ) : (
      <div className={styles.navbarClose} onClick={props.onClose}>
        <IconClose />
      </div>
    ))

  const backButton =
    !props.isRoot &&
    (props.customBackButton ? (
      <div className={styles.navbarBack} onClick={onBackClick}>
        {props.customBackButton}
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
    (props.closeButtonLocation === 'left' &&
      closeButton) ||
    backButton ||
    props.appendLeft
  )

  return (
    <div
      ref={navbarRef}
      className={classnames(styles.navbarContainer, 'kf-navbar')}
    >
      <div className={styles.navbarMain}>
        <div className={styles.navbarFlex}>
          <div className={styles.navbarLeft}>
            {props.closeButtonLocation === 'left' &&
              closeButton}
            {backButton}
            {props.appendLeft}
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
              {typeof props.title === 'string' ? (
                <div className={styles.navbarCenterMainText}>
                  {props.title}
                </div>
              ) : (
                props.title
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
            {props.appendRight}
            {props.closeButtonLocation === 'right' &&
              closeButton}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar
