const mongoose = require('mongoose');


const cartSchema =  mongoose.Schema({
  id: { type: Number, required: true },
  name:{type:String},
  email:{type:String},
  address : {type:String},
  pin:{type:Number},
  phone:{type:Number},
  productname:{type:String},
  orderDate: { type: Date, default: Date.now },
  price:{type:Number},
  status:{type:String},
Deliverable: {
  type: Date,
  default: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days in ms
}
});

module.exports = mongoose.model('orders', cartSchema);