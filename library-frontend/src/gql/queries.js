import { gql } from 'apollo-boost'

export const LOGIN = gql`
mutation login($username: String!, $password: String!) { 
  login(username: $username, password: $password){
    value
  }
}
`

export const ALL_AUTHORS = gql`
{
  allAuthors {
    name
    born
    bookCount
  }
}
`

export const ALL_BOOKS = gql`
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

export const ADD_BOOK = gql`
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

export const EDIT_AUTHOR = gql`
mutation editAuthor( $name: String!, $born: Int) {
  editAuthor( name: $name, setBornTo: $born ) {
    name
    born
    bookCount
  }
}
`

export const MY_INFO = gql`
{
  me {
    username
    favoriteGenre
  }
}
`