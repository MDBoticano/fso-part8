const { ApolloServer, gql, UserInputError, AuthenticationError, PubSub 
  } = require('apollo-server')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
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

const pubSub = new PubSub()

/* Schema */
const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    books: [Book!]!
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
    me: User
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
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`

/* Resolvers */
const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      // console.log('backend fetch', args)
      /* No args: ALL books */
      if (!args.author && !args.genre) {
        const allBooks = await Book.find({})
        return getAuthorDetails(allBooks)
      }

      /* Filter by genres only */
      else if (!args.author && args.genre) {
        const allBooks = await Book.find({ genres: { $in: args.genre } })
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
          genres: { $in: args.genre }
        })
        return getAuthorDetails(allBooks)
      }
      return []
    },
    allAuthors: (root, args) => {
      return Author.find({}).populate('books')
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Author: {
    // books: async (root) => {
    //   console.log(`Author's Books: Book.find`)
    //   const books = await Book.find({
    //     author: { $in: [root._id]}
    //   })
    //   return books
    // },
    bookCount: async (root) => {
      /* og Code */
      /* get the ID of the author */
      let authorId = null
      console.log('bookCount: Author.find')
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
      /* end OG code */
      // console.log(root)
      // return root.books.length
    }
  },
  Mutation: {
    addBook: async (root, args, { currentUser }) => {
      let bookAuthor = null
      let authorId = null

      if (!currentUser) {
        throw new AuthenticationError('Not Authenticated, please sign in')
      }

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
        /* also add the book to the author's book list */
        await bookAuthor.update(
          { $push: { books: book } }
        ).then(result => console.log(result))
      }
      catch (error) {
        throw new UserInputError(error.message, {
          invalid: args,
        })
      }

      pubSub.publish('BOOK_ADDED', { bookAdded: book })

      return book
    },
    editAuthor: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Not Authenticated, please sign in')
      }

      const author = await Author.findOne({ name: args.name })
      author.born = args.setBornTo
      return author.save()
    },
    createUser: (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre
      })

      return user.save()
        .catch((error) => {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new UserInputError('Incorrect credentials')
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubSub.asyncIterator(['BOOK_ADDED'])
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

/* Server code */
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})