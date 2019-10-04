import React, { useState, useEffect } from 'react'

const Books = (props) => {
  const [genresToShow, setGenresToShow] = useState('')
  useEffect(() => {
    if (props.myInfo && !props.myInfo.loading) {
      if (props.myInfo.data.me) {
        const userFavGenre = props.myInfo.data.me.favoriteGenre
        setGenresToShow(userFavGenre)
      } else {
        setGenresToShow('')
      }
    }
  }, [props.myInfo])

  if (!props.show) {
    return null
  }

  if (props.books.loading || (props.myInfo && props.myInfo.loading)) {
    return <div>loading...</div>
  }

  const books = props.books.data.allBooks




  const genresList = []
  /* go through all boooks */
  for (let i = 0, numBooks = books.length; i < numBooks; i++) {
    const book = books[i]
    for (let j = 0, numGenres = book.genres.length; j < numGenres; j++) {
      const genre = book.genres[j]
      /* add their genres to the list if it's unique */
      if (!genresList.includes(genre)) {
        genresList.push(genre)
      }
    }
  }

  const genreButtons = (genresList) => {
    if (props.myInfo) {
      return (
        <div>
          <p>Filtering by your favorite genre: {genresToShow}</p>
        </div>
      )
    }

    return (
      <div>
        <p>Filter by genres:</p>
        <div>
          {genresList.map(genre => {
            return (
              <button
                key={genre}
                onClick={() => setGenresToShow(genre)}
              >
                {genre}
              </button>
            )
          })}
          <button onClick={() => setGenresToShow('')}>all genres</button>
        </div>
      </div>
    )
  }

  const pageTitle = () => {
    if (props.myInfo) {
      return <h2>recommended books </h2>
    } else {
      return <h2>books</h2>
    }
  }

  return (
    <div>
      {pageTitle()}
      {genreButtons(genresList)}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
            <th>
              genres
            </th>
          </tr>
          {books.map(book => {
            if (genresToShow === '' || book.genres.includes(genresToShow)) {
              return (
                <tr key={book.title}>
                  <td>{book.title}</td>
                  <td>{book.author.name}</td>
                  <td>{book.published}</td>
                  <td>
                    <ul>
                      {book.genres.map(genre => <li key={genre}>{genre}</li>)}
                    </ul>
                  </td>
                </tr>
              )
            }
          })}
        </tbody>
      </table>

    </div>
  )
}

export default Books