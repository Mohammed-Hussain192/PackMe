const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
});

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String, required: true }],
  category: { 
    type: String, 
    enum: ['men', 'women', 'kid'], 
    required: true 
  },
  keywords: [{ type: String }],
  price: { type: Number, required: true }, // ✅ price field added here
  reviews: [reviewSchema]
});

module.exports = mongoose.model('Product', productSchema);