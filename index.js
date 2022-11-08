const express = require('express');
const app = express();
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
// const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middle were
app.use(cors());
app.use(express.json());
require('dotenv').config()

app.get('/', (req, res) => {
    res.send('daygraphy Is Running')
})


app.listen(port, () => {
    console.log(`daygraphy Server is Running ${port}`)
})