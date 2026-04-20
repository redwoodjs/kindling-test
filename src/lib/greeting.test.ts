import { strict as assert } from 'node:assert'
import test from 'node:test'

import { greeting } from './greeting.ts'

test('returns hello world', () => {
  assert.equal(greeting(), 'hello world')
})
