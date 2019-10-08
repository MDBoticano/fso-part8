import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import AuthorForm from './components/AuthorForm'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import {
  LOGIN, ALL_AUTHORS, ALL_BOOKS, ADD_BOOK, EDIT_AUTHOR, MY_INFO
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

// const GetFilteredBooks = async (genre, client) => {
//   const { loading, data } = await client.query({
//     query: FILTERED_BOOKS,
//     variables: { genre }
//   })
//   if (loading) { return "loading..." }
//   console.log('filtered books data:', data)
//   return data
// }

const App = () => {
  const [token, setToken] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [page, setPage] = useState('authors') /* default page */
  const [filteredGenre, setFilteredGenre] = useState('')
  const [filteredBooks, setFilteredBooks] = useState(null)
  
  const [recommendedGenre, setRecommendedGenre] = useState('')
  const [recommendedBooks, setRecommendedBooks] = useState(null)

  const [genresList, setGenresList] = useState([])
  

  const client = useApolloClient()

  const handleError = (error) => {
    setErrorMessage(error.graphQLErrors[0].message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const allAuthors = useQuery(ALL_AUTHORS)
  const allBooks = useQuery(ALL_BOOKS)

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

  /* For book list */
  useEffect(() => {
    /* If there's no filter, just show allBooks */
    if (filteredGenre === '') {
      setFilteredBooks(allBooks)
    }
    else {
      const getFiltered = async (genre, client) => {
        const result = await client.query({
          query: FILTERED_BOOKS,
          variables: { genre }
        })
        setFilteredBooks(result)
      }
      getFiltered(filteredGenre, client)
    }
  }, [token, filteredGenre, client, allBooks])

  /* For recommended books */
  useEffect(() => {
    /* If there's no filter, just show allBooks */
    if (recommendedGenre === '') {
      setRecommendedBooks(allBooks)
    }
    else {
      const getFiltered = async (genre, client) => {
        const result = await client.query({
          query: FILTERED_BOOKS,
          variables: { genre }
        })
        setRecommendedBooks(result)
      }
      getFiltered(recommendedGenre, client)
    }
  }, [token, recommendedGenre, client, allBooks])

  useEffect(() => {
    if (myInfo && myInfo.data && myInfo.data.me) {
      if (myInfo.data.me.favoriteGenre !== '') {
        setRecommendedGenre(myInfo.data.me.favoriteGenre)
      }
      else {
        setRecommendedGenre('n/a')
      }
    }
  }, [myInfo])

  /* get genres list */
  useEffect(() => {
    // console.log('allbooks', allBooks)
    let allGenres = []
    if (allBooks && allBooks.data && allBooks.data.allBooks) {
      const books = allBooks.data.allBooks
      // console.log(books)
      for (let i = 0, numBooks = books.length; i < numBooks; i++) {
        const book = books[i]
        for (let j = 0, numGenres = book.genres.length; j < numGenres; j++) {
          const genre = book.genres[j]
          /* add their genres to the list if it's unique */
          if (!allGenres.includes(genre)) {
            allGenres.push(genre)
          }
        }
      }
    }
    // console.log('genres', allGenres)
    setGenresList(allGenres)
  }, [allBooks])

  const logout = () => {
    setToken(null)
    setPage('authors')
    setFilteredGenre('')
    localStorage.clear()
    client.resetStore()
  }

  if (!token) {
    return (
      <div>
        <Notification errorMessage={errorMessage} />
        <LoginForm login={login} setToken={(token) => setToken(token)} />
      </div>
    )
  }

  if (token && myInfo.data.me === null) {
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
        page={'booklist'}
        // books={allBooks}
        books={filteredBooks}
        setGenreFilter={setFilteredGenre}
        genresList={genresList}
      />

      <Books
        show={page === 'recommended'}
        page={'recommended'}
        myInfo={myInfo}
        // books={filteredBooks}
        books={recommendedBooks}
        // defaultFilter={myInfo.data.me && myInfo.data.me.favoriteGenre}
        // setGenreFilter={setGenreFilter}
        setGenreFilter={setRecommendedGenre}
        setRecommendedGenre={setRecommendedGenre}
        genresList={genresList}
      />

     

      <NewBook
        show={page === 'add'}
        addBook={addBook}
      />



    </div>
  )
}

export default App