import React, { useState } from 'react'

import {
  ScreenComponentProps,
  ScreenHelmet,
  useNavigator,
  useQueryParams,
} from 'karrotframe'
import styled from '@emotion/styled'

const Page2: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const navigator = useNavigator()
  const [title, setTitle] = useState('')

  const query = useQueryParams<{ id: string }>()

  const onPopClick = () => {
    navigator.pop().send({
      hello: 'world',
    })
  }
  const onPage3Click = async () => {
    navigator.replace('/page3')
  }

  return (
    <Container>
      <ScreenHelmet />{' '}
      <button onClick={onPopClick}>pop.send 로 데이터 보내기</button>
      <button onClick={onPage3Click}>페이지3으로 replace</button>
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

const HamburgerIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.75rem;
`

export default Page2
