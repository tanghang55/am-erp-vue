import axios from 'axios'
import * as mock from './mock/index.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
})

export async function fetchUsers() {
  if (useMock) {
    return mock.fetchUsers()
  }
  const { data } = await client.get('/users')
  return data
}
