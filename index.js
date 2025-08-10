const express = require('express');
const app = express();
const path = require('path')
const expressSession=require("express-session")
const flash = require("connect-flash");
var cookieParser = require('cookie-parser')
const usermodel = require('./models/usermodel')
const mongoose = require('mongoose');
const nodemailer = require('nodemailer')
const transporter = require('./utils/transport')
const otpsend = require('./controllers/Verification')

const db = require('./config/db')
const push = require('./controllers/push')
const login = require('./controllers/login')
const loginadmin = require('./controllers/loginadmin')
const cartmodel = require('./models/cart')
const order = require('./models/ordered')
const updatePass = require('./controllers/updatepassword')

const Product = require('./models/Product'); 

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

function loginmiddelware(req,res,next){
    if(!req.cookies.email || req.cookies.email==0|| req.cookies.email.length==5){
        let suc= req.flash("error","please Log in for further use")
        res.redirect("/register/user")
        
    }
    else{
        next()
    }
}


  
  //
function loginmiddelwareadmin(req,res,next){
    if(!req.cookies.Admin || req.cookies.Admin==0|| req.cookies.Admin.length==5){
        let suc= req.flash("error","you are not authrorised, as Admin")
        res.redirect("/register/user")
        
    }
    else{
        next()
    }
}

app.use(cookieParser())

app.use(expressSession({
    resave:false,
    saveUninitialized:false,
    secret:"dddddd"
})
)
app.use(flash())

app.get("/",function(req,res){
  res.cookie("email",""||0)
  res.cookie("Admin",""||0)
    res.render("index")
})


app.get("/register/user",(req,res)=>{
   let suc=req.flash("error")
    res.render("register",{suc})
})

app.get("/forgetpass",async function(req,res){
    console.log(req.query.email)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpsend(req.query.email,otp,req,res)
   


})
app.get("/confirm/OTP", function(req, res) {
  const otp = req.flash("otp");
    const email = req.flash("email");
   // ✅ get the flash OTP
   // ✅ get the flash OTP
  console.log(otp);
  let suc= req.flash("error")
  res.render("confirmOTP", { otp ,suc,email }); // ✅ pass OTP to the EJS file
});

app.get("/otp/data",function(req,res){
  email = req.query.email;
  let suc = ""
  res.render("resetpass",{email,suc})
})

app.get("/otp/data/udate",function(req,res){
  let email= req.query.email;
  let uppass = req.query.updatepassword;
  console.log(email,uppass)
  updatePass(email,uppass,req,res)
})


app.post("/register/data",function(req,res){
    let {name,email,password,phone}= req.body
    push(name,email,password,phone,req,res)})


app.post("/login/data",function(req,res){
  let {email,password}=req.body
  login(email,password,req,res)
})

app.post("/admin/login",function(req,res){
  let {email,password}=req.body
  loginadmin(email,password,req,res)
})


app.get('/home',loginmiddelware, async (req, res) => {
  try {
   const products = await Product.find().sort({ price: 1 });
    res.render('home', { products });
  } catch (err) {
    res.status(500).send('Error fetching products');
  }
});

app.get('/brands',loginmiddelware,async(req,res)=>{
  res.render("brand")
})




app.get('/product/:id', loginmiddelware, async (req, res) => {
  try {
    const suc = req.flash("success");
    const err = req.flash("error");

    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).send('Product not found');

    res.render('product', { product, suc, err });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



app.get('/addtocart/:id', loginmiddelware, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).send('Product not found');

    const findcart = await cartmodel.findOne({ id: req.params.id, email: req.cookies.email });
    
    if (findcart) {
      req.flash("error", "Product already exists in cart");
    } else {
      await cartmodel.create({
        id: req.params.id,
        email: req.cookies.email
      });
      req.flash("success", "Successfully added to cart");
    }

    return res.redirect("/product/" + req.params.id);  // Stop here, don’t render after redirect
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



app.get('/profile',loginmiddelware,async (req,res)=>{
  let user = await usermodel.findOne({email:req.cookies.email})
  res.render("profile",{user})
})
app.get('/buynow/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).send('Product not found');
  
    res.render('buynow', { product });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/placeorder/:id', loginmiddelware, async (req, res) => {
  try {
  const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).send('Product not found');

    const user = await usermodel.findOne({email:req.cookies.email})
    

    const newOrder = await order.create({
      id: req.params.id,
      name:user.fullname,
      email: req.cookies.email,
      
      address: req.body.address,
      pin: req.body.pin,
      phone: req.body.phone,
      productname: product.name,
      orderDate: new Date(), // ✅ Correct Date object
      price: product.price,
      status: "ordered"
    });
    const info = await transporter.sendMail({
  from: '"Pack-Me.official" <md.packme.official@gmail.com>',
  to: newOrder.email,
  subject: "Order Confirmation - Pack-Me",
  html: `
    <p>Dear ${newOrder.name || 'Customer'},</p>

    <p>Thank you for shopping with <strong>Pack-Me</strong>!</p>

    <p>We are happy to confirm that your order has been successfully placed.</p>

    <h3>Order Details:</h3>
    <ul>
      <li><strong>Order ID:</strong> ${newOrder.id}</li>
      <li><strong>Order Date :</strong> ${newOrder.orderDate}</li>
      <li><strong>Price:</strong> ₹${newOrder.price}</li>
      <li><strong>Status:</strong> Ordered</li>
    </ul>

    <p>We will notify you once your order is shipped. You can track your order anytime on our website.</p>

    <p>If you have any questions, reply to this email or contact our support team.</p>

    <p>Thank you for choosing <strong>Pack-Me</strong>!</p>

    <p>Warm regards,<br>
    <strong>Team Pack-Me</strong></p>
  `
});
console.log("Message sent: %s", info.messageId);
     const orders = await order.findOne({email:req.cookies.email,id:req.params.id})

    res.render("confirm", { orders });
    console.log("Order placed successfully!");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send("Server error");
    }
  }
});

app.get("/admin/product/remove/:id",loginmiddelwareadmin, async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products"); // Redirect to product list after deletion
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Internal Server Error");
  }
});






app.get("/confirmorder",loginmiddelware,function(req,res){
  res.render("confirm")
})


app.get('/myorders', loginmiddelware, async (req, res) => {
  try {
    const userEmail = req.cookies.email;
    if (!userEmail) return res.redirect('/login');

    // 1️⃣ Fetch all orders for the logged-in user
    const orderDocs = await order.find({ email: userEmail }).sort({ _id: -1 });

    const orders = [];

    // 2️⃣ For each order → fetch corresponding product from Product model
    for (let orderDoc of orderDocs) {
      const product = await Product.findOne({ id: orderDoc.id });

      if (product) {
        orders.push({
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images[0],
          status: orderDoc.status // ✅ This is from the ORDER model (your requirement)
        });
      }
    }

    // 3️⃣ Render the EJS template
    res.render('myorder', { orders });

  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/cancel/:id', loginmiddelware, async (req, res) => {
  try {
    const userEmail = req.cookies.email;
    if (!userEmail) return res.redirect('/login');

    const productId = req.params.id;

    // 1️⃣ Fetch the product details by ID
    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // 2️⃣ Fetch the order document for this product and this user
    const orderDoc = await order.findOne({ email: userEmail, id: productId });

    if (!orderDoc) {
      return res.status(404).send('Order not found for this product');
    }

    // ✅ 3️⃣ Prepare and push data into an array
    const orders = [];

    orders.push({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images[0], 
      status: orderDoc.status,
    });

    // ✅ 4️⃣ Render the array
    res.render('cancelorder', { orders });

  } catch (err) {
    console.error('Error fetching cancel order data:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/cancel/data/:id', loginmiddelware, async (req, res) => {
  try {
    const userEmail = req.cookies.email;
    const productId = req.params.id;

    if (!userEmail) return res.redirect('/login');

    // 1️⃣ Update the specific order for this product ID and email
    const result = await order.updateOne(
      { email: userEmail, id: productId },
      { $set: { status: 'Cancelled' } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Order not found or already cancelled');
    }

    // 2️⃣ Redirect back to orders page or show success
    res.redirect('/myorders'); // or render a success page if you want

  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/return/:id', loginmiddelware, async (req, res) => {
  try {
    const userEmail = req.cookies.email;
    if (!userEmail) return res.redirect('/login');

    const productId = req.params.id;

    // 1️⃣ Fetch the product details by ID
    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // 2️⃣ Fetch the order document for this product and this user
    const orderDoc = await order.findOne({ email: userEmail, id: productId });

    if (!orderDoc) {
      return res.status(404).send('Order not found for this product');
    }

    // ✅ 3️⃣ Prepare and push data into an array
    const orders = [];

    orders.push({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images[0],
      status: orderDoc.status,
    });

    // ✅ 4️⃣ Render the array to a returnorder.ejs (like cancelorder)
    res.render('returnorder', { orders });

  } catch (err) {
    console.error('Error fetching return order data:', err);
    res.status(500).send('Server Error');
  }
});
app.get("/return/data/:id", loginmiddelware, async (req, res) => {
  try {
    const userEmail = req.cookies.email;
    if (!userEmail) return res.redirect('/login');

    const productId = req.params.id;

    // 1️⃣ Fetch product details by ID
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // 2️⃣ Fetch the order document for this product and user
    const orderDoc = await order.findOne({ email: userEmail, id: productId });
    if (!orderDoc) {
      return res.status(404).send('Order not found for this product');
    }

    // 3️⃣ Update the order status to 'Returned'
    await order.updateOne(
      { email: userEmail, id: productId },
      { $set: { status: 'Returned' } }
    );

    // 4️⃣ Redirect or show success
    res.redirect('/myorders'); // ✅ or render confirmation page

  } catch (err) {
    console.error('Error processing return:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/cart', loginmiddelware,async (req, res) => {
  try {
    const userEmail = req.cookies.email;
    if (!userEmail) return res.redirect('/login');

    const cartDocs = await cartmodel.find({ email: userEmail }).sort({ _id: -1 });

    const orders = [];

    for (let item of cartDocs) {
      const product = await Product.findOne({ id: item.id });

      if (product) {
        orders.push({
          id:product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          addedAt: item._id.getTimestamp()
        });
      }
    }

    res.render('cart', { orders });

  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/remove/cart/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    // Example: Remove from cart collection (if you use MongoDB)
    await cartmodel.deleteOne({ id:req.params.id,email:req.cookies.email });
     req.flash("error", "No account found. Please create an account.");
      return res.redirect("/cart");

   
  } catch (err) {
    console.error(err);
    res.status(500).send('Error removing item.');
  }
});
app.post('/product/:id/review',loginmiddelware, async (req, res) => {
  try {
    const { customer, rating, comment } = req.body;

    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).send('Product not found');

    product.reviews.push({ customer, rating, comment });
    await product.save();

    res.redirect(`/product/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to submit review');
  }
});

app.get('/collections',async (req,res)=>{
  let titan = await Product.find({name:"safari"}).sort({price:1}).limit(5)
  let Fasttrack = await Product.find({name:"american tourister"}).sort({price:1}).limit(5)
  let rolex = await Product.find({name:"PUMA"}).sort({price:1})
  let omega = await Product.find({name:"GEAR"}).sort({price:1})
  let sonata = await Product.find({name:"Wildcraft"}).sort({price:1})
  res.render("collection",{titan,Fasttrack,rolex,omega,sonata})
})

app.get("/admin/register",function(req,res){
  let suc=""
  res.render("admin/adminreg",{suc})
})


app.get("/admin/home", loginmiddelwareadmin,async function(req, res) {
  try {
    let products = await Product.find({});
    res.render("admin/adminhome", { products }); // pass products to EJS
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admin/add",loginmiddelwareadmin, (req, res) => {
  res.render('admin/adminAdd');
}); 


app.post('/addproduct', loginmiddelwareadmin,async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      images,
      category,
      keywords,
      price
    } = req.body;

    const newProduct = new Product({
      id,
      name,
      description,
      images: images.split(',').map(url => url.trim()),
      category,
      keywords: keywords.split(',').map(k => k.trim()),
      price: parseFloat(price),
      reviews: [] // You can allow reviews later
    });

    await newProduct.save();
    res.send('Product added successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving product.');
  }
});

app.get('/admin/update/:id',loginmiddelwareadmin, async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findOne({id:productId});
  if (!product) {
    return res.status(404).send('Product not found');
  }
  res.render('admin/update-product', { product });
});

app.post('/admin/update/:id', loginmiddelwareadmin,async (req, res) => {
  const productId = req.params.id;

  // Check if it's a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).send('Invalid product ID');
  }

  const { name, description, price, category, keywords, images } = req.body;

  const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
  const imagesArray = images.split(',').map(img => img.trim()).filter(Boolean);

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        price,
        category,
        keywords: keywordsArray,
        images: imagesArray,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send('Product not found');
    }

    res.redirect('/admin/home');
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/admin/orders",loginmiddelwareadmin, async function(req, res) {
  try {
    const orders = await order.find({});

    res.render("admin/adminorder", { orders  }); // Ensure 'orders' is an array
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server error");
  }
});

app.post('/admin/update-status/:orderId',loginmiddelwareadmin, async (req, res) => {
   const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send('Status is required');
  }

  try {
    const Order = await order.findByIdAndUpdate(orderId, { status }, { new: true });

    if (!Order) {
      return res.status(404).send('Order not found');
    }

    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Server error');
  }
});

app.get("/admin/user", loginmiddelwareadmin,async function(req, res) {
  try {
    let users = await usermodel.find({});
    res.render("admin/adminuser", { user: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/track/:id',loginmiddelware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const Order = await order.findOne({id:orderId,email:req.cookies.email}); 
    const productdet = await Product.findOne({id:req.params.id})

    if (!Order) {
      return res.status(404).send('Order not found');
    }

    res.render('trackorder', { Order ,productdet});
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
