const { ApolloServer, gql, UserInputError } = require('apollo-server')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
require ('dotenv').config()

const JWT_SECRET = process.env.SECRET

/* Mongoose deprecations */
mongoose.set('useFindAndModify', false)
mongoose.set('useNewUrlParser', true)
mongoose.set('useUnifiedTopology', true)
mongoose.set('useCreateIndex', true)

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB', error.message)
  })

/* Schema */
const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }
  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genres: [String!]!): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int,
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int
    ): Author
  }
`

/* Resolvers */
const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
      if (!args.author && !args.genre) { 
        return Book.find({})
      } 
      // else if (args.author && !args.genre) {
      //   const booksByAuthor = Book.find(author === args.author)
      //   return booksByAuthor        
      // }
      // else if (!args.author && args.genre) {
      //   const booksByGenre = Book.collection.filter((b) => {
      //     (b.genres).includes(args.genre)
      //   })
      //   return booksByGenre
      // }
      // else if (args.author && args.genre) {
      //   const booksByAuthorInGenre = books.filter(b => 
      //     b.author === args.author && (b.genres).includes(args.genre))
      //   return booksByAuthorInGenre
      // }
      return Book.find({})
    },
    allAuthors: (root, args) => {
      return Author.find({})
    },
  },
  Author: {
    bookCount: (root) => {
      // const booksWritten = books.filter(b => b.author === root.name)
      // return booksWritten.length
      const booksWritten = Book.collection.countDocuments()
      return booksWritten
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      
      // if (!(authors.find(author => author.name === args.author))) {
      //   const newAuthor = { name: args.author}
      //   authors = [...authors, newAuthor]
      // }

      // /* Then add the book to the book list */
      // const newBook = { 
      //   title: args.title,
      //   author: args.author,
      //   published: args.published,
      //   genres: args.genres
      // }
      // books = [...books, newBook]

      // return newBook

      //  let bookAuthor = null
      /* If author doesn't exist, and author to authors */
      // if ( Author.findOne({ name: args.name }) ) {
      //   console.log('cannot find author')
      //   const newAuthor = new Author({
      //     name: args.author
      //   })
        
      //   bookAuthor = await newAuthor.save()
      // }
      // else {
      //   console.log('author exists')
      //   bookAuthor = Author.findOne({name: args.name})
      //   console.log(bookAuthor)
      // }

      /* if args.author isn't the name of any existing Author */
      // const authorExists = Author.find({ name: args.author }, (error, data) => {
      //   if (error) { return done(error) }
      //   return done(null, data)
      // })

      // /* make a new one */
      // const bookAuthor = new Author({
      //   name: args.author
      // })
      // await bookAuthor.save()

      /* else use the existing author */
      // if ( ( await Author.findOne({ name: args.author })) ) {
      //   console.log('author exists')
      // }

      /* make author from author arg */
      const newAuthor = new Author({ name: args.author })

      await newAuthor.save()

      const book = new Book({
       ...args, author: newAuthor
      })
      return book.save()
    },
    editAuthor: (root, args) => {
      const author = authors.find(auth => auth.name === args.name)
      if (!author) {
        return null
      }
      const updatedAuthor = {...author, born: args.setBornTo}
      authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
      return updatedAuthor
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})