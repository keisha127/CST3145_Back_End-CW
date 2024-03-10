var express = require("express");
var Mongoclient=require("mongodb").MongoClient;
var cors = require("cors");


var app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var CONNECTION_STRING = "mongodb+srv://WebstoreUser:cst3145@webstorecluster.gwgxspe.mongodb.net/"

var databaseName = "Webstore";
var database;

const port = process.env.PORT || 3000;
app.listen(port, function() {
    Mongoclient.connect(CONNECTION_STRING, (error, client) => {
        database = client.db(databaseName);
        console.log("connection to database was successful");
    });
});

// app.listen(3000, () => {
//     Mongoclient.connect(CONNECTION_STRING, (error, client) => {
//         database = client.db(databaseName);
//         console.log("connection to database was successful");
//     });
// })

app.get('/api/storeapp/getLessons', (req, res) => {
    database.collection("lessons").find({}).toArray((error, result) => {
        res.send(result);
    });
})

app.get('/api/storeapp/getOrders', (req, res) => {
    database.collection("orders").find({}).toArray((error, result) => {
        res.send(result);
    });
})


app.post('/api/storeapp/addOrder', (req, res) => {
    const order = req.body;

    // save to 'orders' collection
    database.collection("orders").insertOne({
        firstName: order.firstName,
        lastName: order.lastName,
        phoneNumber: order.phoneNumber,
        lessons: order.cart,
        orderDate: new Date(),
    }, (error, result) => {
        if (error) {
            console.error('Error saving order:', error);
            res.status(500).send('Internal Server Error');
        } else {
            // if order successfully saved, update lessons
            const cartLessons = order.cart;

            if (cartLessons && cartLessons.length > 0) {
                const lessonIds = cartLessons.map(lesson => lesson._id);

                // Update 'lessons' collection
                database.collection("lessons").updateMany(
                    { _id: { $in: lessonIds } },
                    { $inc: { spaces: -1 } }, // Decrease spaces for each lesson 
                    (updateError, updateResult) => {
                        if (updateError) {
                            console.error('Error updating lessons in the cart:', updateError);
                            res.status(500).send('Internal Server Error');
                        } else {
                            res.status(201).send('Order submitted successfully');
                        }
                    }
                );
            } else {
                res.status(201).send('Order submitted successfully');
            }
        }
    });
});
