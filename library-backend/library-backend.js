const { ApolloServer, gql, UserInputError } = require('apollo-server')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
require('dotenv').config()

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
    # name: String!
    name: String
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
    allBooks(author: String, genre: [String!]): [Book!]!
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
    allBooks: async (root, args) => {
      /* No args: ALL books */
      if (!args.author && !args.genre) {
        const allBooks = await Book.find({})
        return getAuthorDetails(allBooks)
      }

      /* Filter by genres only */
      else if (!args.author && args.genre) {
        const allBooks = await Book.find({ genres: { $in: [args.genre] } })
        return getAuthorDetails(allBooks)
      }

      /* Filter by author only */
      else if (args.author && !args.genre) {
        const authorId = await authorNameToId(args.author)
        const allBooks = await Book.find({ author: { $in: [authorId] } })
        return getAuthorDetails(allBooks)
      }

      /* filter by author & genre */
      else if (args.author && args.genre) {
        const authorId = await authorNameToId(args.author)
        const allBooks = await Book.find({
          author: { $in: [authorId] },
          genres: { $in: [args.genre] }
        })
        return getAuthorDetails(allBooks)
      }
      return []
    },
    allAuthors: (root, args) => {
      return Author.find({})
    },
  },
  Author: {
    bookCount: async (root) => {
      /* get the ID of the author */
      let authorId = null
      const existingAuthor = await Author.findOne({ name: root.name })
      if (existingAuthor !== null && existingAuthor._id !== null) {
        authorId = existingAuthor._id
      }

      if (authorId === null) { return 0 }

      const booksWritten = await Book.find({ author: authorId })
      let booksWrittenLength = 0
      if (booksWritten !== null && booksWritten.length) {
        booksWrittenLength = booksWritten.length
      }
      return booksWrittenLength
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      let bookAuthor = null
      let authorId = null

      const existingAuthor = await Author.findOne({ name: args.author })
      if (existingAuthor !== null && existingAuthor._id !== null) {
        authorId = existingAuthor._id
      }

      /* Note: This will add the author if it's valid, even if the book isn't */
      if (authorId === null) {
        try {
          bookAuthor = new Author({ name: args.author })
          await bookAuthor.save()
        }
        catch (error) {
          throw new UserInputError(error.message, {
            invalid: args,
          })
        }

      }
      else {
        bookAuthor = await Author.findById(authorId)
      }

      const book = new Book({
        ...args, author: bookAuthor
      })

      try {
        await book.save()
      }
      catch (error) {
        throw new UserInputError(error.message, {
          invalid: args,
        })
      }

      return book
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      author.born = args.setBornTo
      return author.save()
    }
  }
}

/* Helper functions */
const authorNameToId = async (name) => {
  const authorByName = await Author.findOne({ name: name })
  if (authorByName === null) { return null }
  else { return authorByName._id }
}

const getAuthorDetails = (booklist) => {
  return booklist.map(book => {
    const { title, published, genres, author } = book
    return {
      title, published, genres,
      author: Author.findById(author)
    }
  })
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})