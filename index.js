
const express = require('express');
const app = express();



const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.SEKIRUTI_TOKEN)

const port = process.env.PROT || 5000

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://bisto-wine.vercel.app",
      "https://bisto-bos.web.app"
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
const jwt = require('jsonwebtoken');



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ssb3nmc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const databest = client.db('Boss').collection('Data')
    const criditem = client.db('Boss').collection('crid')
    const bookingitem = client.db('Boss').collection('booking')
    const usersitem = client.db('Boss').collection('users')
    const userpayment = client.db('Boss').collection('payments')



    // JWT
    app.post('/jwt', (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
      })
      res.send({ token })
    })



    // verifytoken


    const verifytoken = (req, res, next) => {
const authHeader = req.headers.authorization
// console.log(authHeader , 'const authHeader = req.headers.authorization');

if (!authHeader) {
  return res.status(401).send({ message: "unauthorized" })
}

      if (!req.headers.authorization) {
        return res.status(404).send({ message: 'forbidden ' })
      }

      const token = authHeader.split(' ')[1]
     
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded
        next()
      })
    }
    const verifiyadmin = async (req, res, next) => {
      const email = req.decoded.email
      // console.log(email);
      
      const query = { email: email }
      const user = await usersitem.findOne(query)
      const Admin = user?.role === 'admin'
      if (!Admin) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      next()
    }


    app.get('/users', verifytoken, verifiyadmin, async (req, res) => {

      const rejar = await usersitem.find().toArray()
      res.send(rejar)
    })





    // addmin
    app.patch('/users/admin/:id', verifytoken, verifiyadmin, async (req, res) => {
      const id = req.params.id
      const filtar = { _id: new ObjectId(id) }
      const Upretdog = {
        $set: {
          role: 'admin'
        }
      }
      const rejsr = await usersitem.updateOne(filtar, Upretdog)
      res.send(rejsr)
    })


    app.get('/users/admin/:email', verifytoken, async (req, res) => {
      const email = req.params.email
      // console.log(email,'email');
      
      if (email !== req.decoded.email) {
        return res.status(403).send('Unauthorized access')
      }
      const query = { email: email }
      const user = await usersitem.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })


    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user?.email }
      const rejsr = await usersitem.findOne(query)
      if (rejsr) {
        return res.send({ message: 'user already add', insertedId: null })
      }
      const rejar = usersitem.insertOne(user)
      res.send(rejar)
    })

    app.delete('/users/:id', verifytoken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const rejar = await usersitem.deleteOne(query)
      res.send(rejar)
    })

    app.get('/crids', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const resule = await criditem.find().toArray()
      res.send(resule)
    })

   app.post('/Mycrids', async (req, res) => {
  try {
    const email = req.body.email; // body থেকে email নেওয়া
    

    const query = { email };
    const result = await criditem.find(query).toArray(); // MongoDB cursor → array

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

    app.post('/crids', async (req, res) => {
      const criditems = req.body
      // console.log(criditem);
      const resurl = await criditem.insertOne(criditems)
      res.send(resurl)
    })

    app.delete('/crids/:Id', async (req, res) => {
      const id = req.params.Id
      const query = { _id: new ObjectId(id) }
      const resurl = await criditem.deleteOne(query)
      res.send(resurl)
    })

    app.post('/menu', verifytoken, verifiyadmin, async (req, res) => {
      const itme = req.body
      const rejar = await databest.insertOne(itme)
      res.send(rejar)
    })

    app.delete('/menu/:id', verifytoken, verifiyadmin, async (req, res) => {
      const itm = req.params.id
      const query = { _id: new ObjectId(itm) }
      const rejar = await databest.deleteOne(query)
      res.send(rejar)
    })
    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id
      
      
      const query = { _id: new ObjectId(id) }
      const resar = await databest.findOne(query)

      res.send(resar)
    })
    app.patch('/menu/:id', async (req, res) => {
      const item = req.body

      const id = req.params.id

      const query = { _id: new ObjectId(id) }
      const upretdoc = {
        $set: {
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: item.recipe,
          discount: item.discount,
        }
      }

      const rejar = await databest.updateOne(query, upretdoc)
      res.send(rejar)
    })

    //  discounde 
    app.patch('/menu/discount/:id', async (req, res) => {
      const item = req.body

      const id = req.params.id


      const query = { _id: new ObjectId(id) }
      const upretdoc = {
        $set: {
          discount: item.discount,
        }
      }
      const rejar = await databest.updateOne(query, upretdoc)
      res.send(rejar)
    })

    app.get('/menu', async (req, res) => {
      const rejar = await databest.find().toArray()
      res.send(rejar)
    })

    
    // pememt

    // app.post('/payment', async(req,res)=>{
    //   const body = req.body
     
     
    //   const paymentrejart = await userpayment.insertOne(body)
    //   // console.log('pementinfo',body);
      
    //   const query = {_id:{
    //     $in: body.cardId.map(id => new ObjectId(id))
    //   }};
    //   const deleteRejart = await criditem.deleteMany(query)
    //   res.send({paymentrejart,deleteRejart}) 
      
    // })


 

    app.post('/create_payment_intent', async (req, res) => {
  try {
    const price = Number(req.body.price || 0);

    const amount = Math.round(price * 100);

    if (!amount || amount < 50) {
      return res.status(400).send({
        message: "Minimum amount is $0.50"
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card']
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ message: "Server error" });
  }
});

    app.get('/payment/:email', verifytoken, async(req,res)=>{
      const query = {email: req.params.email}
      if(req.params.email !== req.decoded.email){
        return res.status(403).send({message:' forbidden access'})
      }
      const item = await userpayment.find(query).toArray()
      res.send(item)
    })


    app.get('/addminhom', async(req,res)=>{

      const user = await usersitem.estimatedDocumentCount()
      const menuItem = await databest.estimatedDocumentCount()
      const Odars = await userpayment.estimatedDocumentCount()
      const result = await userpayment.aggregate([
        {
          $group:{
            _id:null,
            totalRevenue:{
              $sum: '$print'
            }
            
          }
        }
      ]).toArray()
  

      const revenue = result.length > 0 ? result[0].totalRevenue : 0;

res.send({
  user,
  menuItem,
  Odars,
  revenue
})
    })

    app.get('/odarstart', verifytoken,verifiyadmin, async(req,res)=>{
      const resule = await userpayment.aggregate([
        {
          $unwind: '$menuId'
        },
        {
          $lookup:{
            from:'Data',
            localField:'menuId',
            foreignField: '_id',
            as:"menuIds"
          }
        },
        {
          $unwind: '$menuIds'
        },
        {
          $group:{
            _id: '$menuIds.category',
            querytity: {$sum:1},
            revenue: {$sum: "$menuIds.price"}
          },
          
        },
        {
          $project:{
            _id:0,
            category:"$_id",
            querytity:"$querytity",
            revenue:"$revenue"

          }
        }

      ]).toArray()
      res.send(resule)
    })

    // bookingitem
    app.post('/booking', async(req,res)=>{
      const body = req.body
      const resjar = await bookingitem.insertOne(body)
      res.send(resjar)
    })
    app.get('/booking', async(req,res)=>{
      const resjar = await bookingitem.find().toArray()
      res.send(resjar)
    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);












app.get('/', (req, res) => {
  res.send('sarvar is renik')
})

app.listen(port, () => {
  console.log(`you are port,${port}`)
})
