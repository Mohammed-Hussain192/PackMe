const mongoose = require('mongoose');


const cartSchema =  mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  email:{type:String}
});

module.exports = mongoose.model('cart', cartSchema);