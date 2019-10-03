const { ApolloServer, gql, UserInputError } = require('apollo-server')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
require('dotenv').config()

const JWT_SECRET = process.env.SECRET

let globalIndex = 0

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
      let bookList = []

      /* No args: ALL books */
      if (!args.author && !args.genre) {
        const allBooks = await Book.find({})
        
        bookList = allBooks.map( book => {
          const { title, published, genres, author } = book
          return {
            title, published, genres, 
            author: Author.findById(author)
          }
        })

        // const filteredBookList = bookList.filter( async (book) => {
        //   const { author } = book
        //   const authorObj = await Author.findById(author)
        //   if (authorObj.name !== null) {
        //     return true
        //   } else {
        //     return false
        //   }
        // })

        // bookList = filteredBookList.map( async (book) => {
        //   const { title, published, genres, author } = book
        //   const authorObj = await Author.findById(author)
        //   // console.log(authorObj.name)
        //   // return { title, published, genres, author: authorObj.name }
        //   const returnObj = {
        //     title,
        //     published,
        //     genres,
        //     author: await Author.findById(author)
        //   }
        //   console.log(returnObj)
        //   // return { ...book, author: authorObj }
        //   return returnObj
        // })
        return bookList
      }

      /* Filter by genres only */
      if (!args.author && args.genre) {
        // console.log('filter by genre')
        bookList = await Book.find({})
          .then((docs) => {

            /* remove all books without genre */
            const filteredDocs = docs.filter(
              doc => doc.genres.includes(args.genre)
            )

            return filteredDocs.map(async (doc) => {
              const { title, published, genres, author } = doc

              const authorObj = await Author.findById(author)

              // return { title, published, genres, author: authorObj }
              const returnObj = {
                title,
                published,
                genres,
                author: authorObj
              }
              console.log(returnObj)
              // return { ...book, author: authorObj }
              return returnObj
            })
          })
        return bookList
      }

      /* Filter by author only */
      if (args.author && !args.genre) {
        // console.log('filter by author')
        /* name --> id */
        const authorId = await Author.findOne({ name: args.author })
          .then(doc => doc._id)

        bookList = await Book.find({})
          .then((docs) => {
            const filteredDocs = docs.filter(
              doc => doc.author.toString() === authorId.toString()
            )

            return filteredDocs.map(async (doc) => {
              const { title, published, genres, author } = doc

              const authorObj = await Author.findById(author)

              return { title, published, genres, author: authorObj }
            })
          })
        return bookList
      }

      /* filter by author & genre */
      if (args.author && args.genre) {
        // console.log('filter by author and genre')
        /* name --> id */
        const authorId = await Author.findOne({ name: args.author })
          .then(doc => doc._id)

        bookList = await Book.find({})
          .then((docs) => {
            const filteredDocs = docs.filter(
              doc => (
                doc.author.toString() === authorId.toString() &&
                doc.genres.includes(args.genre)
              ))

            return filteredDocs.map(async (doc) => {
              const { title, published, genres, author } = doc

              const authorObj = await Author.findById(author)

              return { title, published, genres, author: authorObj }
            })
          })
        return bookList
      }
      // console.log('default')
      /* default */
      return bookList
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

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})