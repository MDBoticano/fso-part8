import React, { useState } from 'react'
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import AuthorForm from './components/AuthorForm'
import LoginForm from './components/LoginForm'

const LOGIN = gql`
mutation login($username: String!, $password: String!) { 
  login(username: $username, password: $password){
    value
  }
}
`

const ALL_AUTHORS = gql`
{
  allAuthors {
    name
    born
    bookCount
  }
}
`

const ALL_BOOKS = gql`
{
  allBooks {
    title
    author {
      name
      born
      bookCount
    }
    published
    genres
  }
}
`

const ADD_BOOK = gql`
mutation addBook ( $title: String!, $author: String!, $published: Int, 
  $genres: [String!]! ) {
  addBook( title: $title, author: $author, published: $published, 
    genres: $genres) {
    title
    author {
      name
      born
      bookCount
    }
    published
    genres
  }
}
`

const EDIT_AUTHOR = gql`
mutation editAuthor( $name: String!, $born: Int) {
  editAuthor( name: $name, setBornTo: $born ) {
    name
    born
    bookCount
  }
}
`

const MY_INFO = gql`
{
  me {
    username
    favoriteGenre
  }
}
`

const App = () => {
  const [token, setToken] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const client = useApolloClient()

  const handleError = (error) => {
    setErrorMessage(error.graphQLErrors[0].message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const allAuthors = useQuery(ALL_AUTHORS)
  const allBooks = useQuery(ALL_BOOKS)
  const myInfo = useQuery(MY_INFO)

  const [addBook] = useMutation(ADD_BOOK, {
    refetchQueries: [{ query: ALL_BOOKS }, { query: ALL_AUTHORS }]
  })

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })

  const [page, setPage] = useState('authors')

  const [login] = useMutation(LOGIN, {
    onError: handleError,
    refetchQueries: [{ query: MY_INFO }]
  })

  const errorNotification = () => {
    return (
      errorMessage &&
      <div style={{ color: 'red' }}>
        {errorMessage}
      </div>
    )
  }

  const logout = () => {
    setToken(null)
    setPage('authors')
    localStorage.clear()
    client.resetStore()
  }

  if(!token){
    return (
      <div>
        {errorNotification()}
        <LoginForm login={login} setToken={(token) => setToken(token)} />
      </div>
    )
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('recommended')}>recommended</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={logout}>logout</button>
      </div>

      {errorNotification()}

      <Authors
        show={page === 'authors'}
        authors={allAuthors}
      />

      <AuthorForm 
        show={page === 'authors'} 
        authors={allAuthors}
        editAuthor={editAuthor}
      />

      <Books
        show={page === 'books'}
        books={allBooks}
      />

      <NewBook
        show={page === 'add'}
        addBook={addBook}
      />

      <Books
        show={page === 'recommended'}
        books={allBooks}
        myInfo={myInfo}
      />

    </div>
  )
}

export default App