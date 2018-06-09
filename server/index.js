/* eslint consistent-return:0 */

const express = require('express');
const logger = require('./logger');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {graphiqlExpress, graphqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const argv = require('./argv');
const port = require('./port');
const setup = require('./middlewares/frontendMiddleware');
const isDev = process.env.NODE_ENV !== 'production';
const ngrok = (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel ? require('ngrok') : false;
const resolve = require('path').resolve;
const app = express();

// Add Backend(GraphQL)
mongoose.connect('mongodb://jammanbo:jammanbo18@ds253840.mlab.com:53840/worklife').then(
    () => console.log('connect')
)

const datas = [
    {title: '진창규바보', author: '김준수'},
    {title: '진창규개바보', author: '진창규'},
    {title: '진창규핵바보', author: '최민식'},
    {title: '진창규10바보', author: '이창민'},
    {title: '진창규완전바보', author: '김수진'},
]


const Book = mongoose.model("book", {
    _id: 'String',
    title:'String',
    author:'String'
});

// datas.forEach((book) => {
//     new Book(book).save();
// })

const typeDefs = `
    type Query {
        books: [Book]
    }
    type Book {
        id: String
        title: String
        author: String
    }
`;

const resolvers = {
    Query: {
        books: (parent, args, context) => {
            return context.book.find();
        }
    },
    Book: {
        id(parent, args) {
            return parent._id;
        },
        title(parent, args) {
            return parent.title;
        },
        author(parent, args) {
            return parent.author;
        }
    }
};


const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});


app.use('/graphql', bodyParser.json(), graphqlExpress({ schema, context: {book: Book} }));
app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));


// In production we need to pass these values in instead of relying on webpack
setup(app, {
    outputPath: resolve(process.cwd(), 'build'),
    publicPath: '/',
});

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost';

// Start your app.
app.listen(port, host, (err) => {
    if (err) {
        return logger.error(err.message);
    }

    // Connect to ngrok in dev mode
    if (ngrok) {
        ngrok.connect(port, (innerErr, url) => {
            if (innerErr) {
                return logger.error(innerErr);
            }

            logger.appStarted(port, prettyHost, url);
        });
    } else {
        logger.appStarted(port, prettyHost);
    }
});
