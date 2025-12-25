import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup()
});
