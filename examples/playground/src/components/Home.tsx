import React, { useState } from 'react'

import { ScreenComponentProps, ScreenHelmet, useNavigator } from 'karrotframe'
import styled from '@emotion/styled'

const Home: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const navigator = useNavigator()
  const [right, setRight] = useState('')

  const onPage2Click = async () => {
    const data = await navigator.push('/page2', {
      present: true,
    })
    console.log('data', data)
  }

  const onAppendClick = () => {
    setRight(right + '11111')
  }

  return (
    <Container>
      <ScreenHelmet
        title={'ekdrmsekdmrmasklfaslkfsa'}
        appendRight={right}
        closeButtonLocation="right"
        appendLeft={
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              window.alert(1)
            }}
          >
            뒤로
          </div>
        }
      />
      위와 같이 상단바를 Customizing 할 수 있습니다 <br />
      <button onClick={onPage2Click}>페이지2로 push present=top</button>
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default Home
