import users from './users.json'

export function fetchUsers() {
  return Promise.resolve(users)
}
