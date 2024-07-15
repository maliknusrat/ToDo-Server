const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
app.use(
  cors(
  // {
  //   origin: "https://playful-shortbread-f9e998.netlify.app",
  //   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  //   credentials: true,
  //   optionsSuccessStatus: 204,
  // }
)
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dhjafvg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Calculate currentDate
let currentDate = new Date();

let year = currentDate.getFullYear();
let month = currentDate.getMonth() + 1;
if (month< 10) {
    month = "0"+month;
  }
let day = currentDate.getDate();
if (day< 10) {
    day = "0"+day;
}
let formattedDate = `${year}-${month}-${day}`;
console.log(formattedDate);
// Calculate currentDate

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db("ToDoList").collection("Users");
    const listCollections = client.db("ToDoList").collection("Lists");

    //user Info post
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    //User GET
    app.get("/userInfo/:email", async (req, res) => {
      const Email = req.params.email;
      const cursor = await usersCollection.findOne({ email: Email });
      res.send([cursor]);
    });

    //List post
    app.post("/lists", async (req, res) => {
      const list = req.body;
      console.log(list);
      const result = await listCollections.insertOne(list);
      res.send(result);
    });

    //List get
    app.get("/getList", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send("Email query parameter is required");
        }

        console.log(email);
        const user = await listCollections.findOne({ email: email });
        if (!user) {
          return res.status(404).send("User not found");
        }
        if (user) {
          const lists = await listCollections.find({ email: email }).toArray();
          res.send({ lists, user });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("An error occurred while fetching the data");
      }
    });

    //Get Today's Task
    app.get("/todayGetList", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send("Email query parameter is required");
        }

        console.log(email);
        const user = await listCollections.findOne({ email: email });

        if (!user) {
          return res.status(404).send("User not found");
        }
        if (user) {
          const lists = await listCollections.find().toArray();
          const findDate = lists.filter((list)=>list.date == formattedDate && list.email == email)
          res.send({user,findDate });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("An error occurred while fetching the data");
      }
    });
  
    //Get Upcomming's Task
    app.get("/upcommingGetList", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send("Email query parameter is required");
        }

        console.log(email);
        const user = await listCollections.findOne({ email: email });

        if (!user) {
          return res.status(404).send("User not found");
        }
        if (user) {
          const lists = await listCollections.find().toArray();
          const findDate = lists.filter((list)=>list.date > formattedDate && list.email == email)
          res.send({user,findDate });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("An error occurred while fetching the data");
      }
    });
  

    //list delete
    app.delete("/deleteList/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await listCollections.deleteOne(query);
      res.send(result);
    });

    //single list get
    app.get("/singleList/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);

      // Check if the id is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format");
      }

      try {
        const objectId = new ObjectId(id);
        const query = { _id: objectId };
        const result = await listCollections.findOne(query);

        if (!result) {
          return res.status(404).send("Item not found");
        }

        console.log(result);
        res.send([result]);
      } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
      }
    });

    //Update list
    app.put("/updatelist/:id", async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const option = { upsert : true};
      const updatedList = req.body;
      const List ={
        $set: {
          title: updatedList.title,
          date: updatedList.date,
          message: updatedList.message, 
          priorty: updatedList.priorty,
          status: updatedList.status
        }
      }
      const result = await listCollections.updateOne(filter,List,option);
      res.send(result);
    })

     //Update list
     app.patch("/updateStatus/:id", async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const List ={
        $set: {
          status: "Finished"
        }
      }
      const result = await listCollections.updateOne(filter,List);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is Running')
})

app.listen(port, () => {
  console.log(`Server is running on Port:${port}`);
});
