import { Design, DesignWrapper } from '@villagekit/design'
import React from 'react'
import { create } from 'react-test-renderer'

import { Sandbox } from './'

describe('Sandbox', () => {
  test('renders correctly', () => {
    const design: Design = {
      assembly: {
        parts: [],
        type: 'static',
      },
      meta: {
        description: '',
        id: 'test-design',
        name: 'test design',
      },
    }
    const tree = create(
      <React.Suspense fallback={null}>
        <DesignWrapper design={design}>
          <Sandbox />
        </DesignWrapper>
      </React.Suspense>,
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
