import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import AuthorForm from './components/AuthorForm'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import { LOGIN, ALL_AUTHORS, ALL_BOOKS, ADD_BOOK, EDIT_AUTHOR, MY_INFO 
} from './gql/queries'
import { gql } from 'apollo-boost'


const FILTERED_BOOKS = gql`
query allBooks ($genre: [String!]) {
  allBooks( genre: $genre ) {
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
/* useQuery version of filtering books */
// const GetFilteredBooks = (genre) => {
//   const { loading, data } = useQuery(FILTERED_BOOKS, {
//     variables: { genre }})
//   if (loading) { return "loading..." }
//   return data
// }

const GetFilteredBooks = async (genre, client) => {
  const { loading, data } = await client.query({
    query: FILTERED_BOOKS,
    variables: { genre }
  })
  if (loading) { return "loading..." }
  console.log('data:', data)
  return data
}

const App = () => {
  const [token, setToken] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [page, setPage] = useState('authors') /* default page */
  const [genreFilter, setGenreFilter] = useState('Fiction')
  const [filteredBooks, setFilteredBooks] = useState([])

  const client = useApolloClient()

  const handleError = (error) => {
    setErrorMessage(error.graphQLErrors[0].message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const allAuthors = useQuery(ALL_AUTHORS)
  const allBooks = useQuery(ALL_BOOKS)
  
  useEffect(() => {
    /* If there's no filter, just show allBooks */
    if(genreFilter === '') {
      setFilteredBooks(allBooks)
    }

    /* Otherwise: query the filtered list of books */
    const filtered = async (genreFilter, client) => {
      const result = GetFilteredBooks(genreFilter, client)
      return result
    }

    const filteredAsync = filtered(genreFilter, client)
    
    
    console.log('useEffect', filteredAsync)


    const filteredAllBooks = () => { 
        if (filteredAsync.data && filteredAsync.data.allBooks) {
        return filteredAsync.data.allBooks
      }
    }
    setFilteredBooks({ data: { allBooks: filteredAllBooks() }})
  }, [genreFilter, client])

  const myInfo = useQuery(MY_INFO, {
    pollInterval: 1000
  })

  const [addBook] = useMutation(ADD_BOOK, {
    refetchQueries: [{ query: ALL_BOOKS }, { query: ALL_AUTHORS }]
  })

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  })

  const [login] = useMutation(LOGIN, {
    onError: handleError
  })

  const logout = () => {
    setToken(null)
    setPage('authors')
    localStorage.clear()
    client.resetStore()
  }

  if(!token){
    return (
      <div>
        <Notification errorMessage={errorMessage} />
        <LoginForm login={login} setToken={(token) => setToken(token)} />
      </div>
    )
  }

  if(token && myInfo.data.me === null) {
    return (
      <div>loading...</div>
    )
  }

  return (
    <div>
      <div>
        Hello {myInfo.data.me && myInfo.data.me.username}
      </div>

      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('recommended')}>recommended</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={logout}>logout</button>
      </div>

      <Notification errorMessage={errorMessage} />

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
        // books={filteredBooks}
      />

      <NewBook
        show={page === 'add'}
        addBook={addBook}
      />

      <Books
        show={page === 'recommended'}
        books={allBooks}
        myInfo={myInfo}
        defaultFilter={myInfo.data.me && myInfo.data.me.favoriteGenre}
      />

    </div>
  )
}

export default App