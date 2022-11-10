const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middle were
app.use(cors());
app.use(express.json());
require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yhjanrk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized Access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'unauthorized Access' })
        }
        req.decoded = decoded;
        next()
    })

}

async function run() {
    try {
        const serviceCollection = client.db('dayGraphy').collection('services')
        const reviewCollection = client.db('dayGraphy').collection('reviews')

        // --------JWT--------
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        })

        // --------Get All Services--------
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })

        // --------Post Service from site--------
        app.post('/services', verifyJWT, async (req, res) => {
            const query = req.body
            const result = await serviceCollection.insertOne(query);
            res.send(result)
        })

        // --------Get Latest 3 Services--------
        app.get('/latest-services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({ _id: -1 });
            const result = await cursor.limit(3).toArray()
            res.send(result)
        })

        // --------Service Id to findOne--------
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        // --------Post User Review from site--------
        app.post('/reviews', verifyJWT, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review)
            res.send(result)
        })

        // --------Get One Review By Id--------
        app.get('/reviews', async (req, res) => {
            const id = req.query._id
            const query = {}
            const cursor = reviewCollection.find(query).sort({ _id: -1 });
            const reviews = await cursor.toArray()
            const result = reviews.filter(review => review.serviceId === id)
            res.send(result)
        })

        // --------Delete Review--------
        app.delete('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(query);
            res.send(result)
        })

        // --------Upadate Review--------
        app.put('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const message = req.body;
            const option = { upsert: true };
            const updatedMessage = {
                $set: {
                    message: message.message,
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedMessage, option);
            res.send(result)
        })

        app.get('/my-reviews', verifyJWT, async (req, res) => {
            // console.log(req.headers.authorization);
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(error => console.error(error));



app.get('/', (req, res) => {
    res.send('daygraphy Is Running')
})


app.listen(port, () => {
    console.log(`daygraphy Server is Running ${port}`)
})