import React, { useState, useEffect } from 'react'

const Books = (props) => {
  const [genresToShow, setGenresToShow] = useState(props.defaultFilter || '')
  const [userFavGenre, setUserFavGenre] = useState('')
  const [username ,setUsername] = useState('')

  useEffect(() => {
    if (props.show && props.myInfo && !props.myInfo.loading) {
      // console.log('page is recommended')
      // console.log(props.myInfo.data)
      if (props.myInfo.data.me && (props.myInfo.data.me.favoriteGenre !== '')) {
        // console.log('user has a fav genre')
        setUserFavGenre(props.myInfo.data.me.favoriteGenre)
        setUsername(props.myInfo.data.me.username)
        // console.log('recommended is set')
        setGenresToShow(props.myInfo.data.me.favoriteGenre)
      } else {
        // console.log('user does not have a favorite genre')
        // console.log(props.myInfo.data.me)
        setGenresToShow('')
      }
    }
  }, [props.myInfo, props.show])

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
          <p>Filtering by {username}'s favorite genre: {userFavGenre}</p>
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
            <th>
              title
            </th>
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
            else {
              return null
            }
          })}
        </tbody>
      </table>

    </div>
  )
}

export default Books