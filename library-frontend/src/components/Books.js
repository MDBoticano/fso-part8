import React from 'react'

const Books = (props) => {

  // console.log('props books:', props.page, props.books )
  // console.log(props)

  let username = ''
  let userFavGenre = ''

  if (props.show && props.myInfo && !props.myInfo.loading) {
    username = props.myInfo.data.me.username
    userFavGenre = props.myInfo.data.me.favoriteGenre
  }

  if (!props.show) {
    return null
  }

  if (props.books.loading || (props.myInfo && props.myInfo.loading)) {
    return <div>loading...</div>
  }

  const books = props.books.data.allBooks
  // console.log('books only', books)

  // const genresList = props.genresList
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
          <p>
            Filtering by {username}'s favorite genre: {userFavGenre}
          </p>
        </div>
      )
    }

    return (
      <div>
        <p>Filter by genres:</p>
        <div>
          {genresList && genresList.map(genre => {
            return (
              <button
                key={genre}
                // onClick={() => setGenresToShow(genre)}
                onClick={() => props.setGenreFilter(genre)}
              >
                {genre}
              </button>
            )
          })}
          <button onClick={() => props.setGenreFilter('')}>all genres</button>
          {/* <button onClick={() => setGenresToShow('')}>all genres</button> */}
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
          {/* {books.map(book => {
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
          })} */}
          {books.map(book => {
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
            })}
        </tbody>
      </table>

    </div>
  )
}

export default Books