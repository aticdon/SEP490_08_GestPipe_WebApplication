const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: Object,
    required: true
  }
}, {
  collection: "category"
});

module.exports = mongoose.model("Category", CategorySchema);