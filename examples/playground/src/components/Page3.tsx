import React from 'react'
import { Route, useHistory } from 'react-router-dom'

import { useNavigator } from 'karrotframe'
import styled from '@emotion/styled'

const Page3: React.FC = () => {
  const history = useHistory()
  const navigator = useNavigator()

  const onPopClick = () => {
    navigator.pop(2).send('data from page3')
  }
  const onPop = () => {
    navigator.pop(1).send('data from page3')
  }
  const onNext = async () => {
    const data3 = await navigator.push('/page2')
    console.log('data3', data3)
  }
  const startForm = () => {
    history.push('/page3/inside1')
  }
  const goBack = () => {
    history.goBack()
  }
  const goBack2 = () => {
    history.go(-4)
  }

  return (
    <Container>
      <button onClick={onPop}>pop(1)</button>
      <button onClick={onNext}>2page로 await push</button>
    </Container>
  )
}

const Container = styled.div``

export default Page3
