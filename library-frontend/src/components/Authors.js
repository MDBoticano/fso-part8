import React, { /* useState */ } from 'react'
// import { gql } from 'apollo-boost'
// import { useApolloClient } from '@apollo/react-hooks'

const Authors = (props) => {
  // const client = useApolloClient()
  if (!props.show) {
    return null
  }
  if (props.authors.loading) {
    return <div>loading...</div>
  }
  const authors = props.authors.data.allAuthors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Authors