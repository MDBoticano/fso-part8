import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import AuthorForm from './components/AuthorForm'

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
    author
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

const App = () => {
  const allAuthors = useQuery(ALL_AUTHORS)
  const allBooks = useQuery(ALL_BOOKS)

  const [addBook] = useMutation(ADD_BOOK, {
    refetchQueries: [{ query: ALL_BOOKS }, { query: ALL_AUTHORS }]
  })

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })

  const [page, setPage] = useState('authors')

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
      </div>

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

    </div>
  )
}

export default App