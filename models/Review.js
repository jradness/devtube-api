const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add title'],
    trim: true,
    maxlength: [50, 'Title cannot be more than 50 characters'],
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
    maxlength: [500, 'Review cannot be more than 500 characters'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5'],
    
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
});

ReviewSchema.index({ course: 1, user: 1}, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);