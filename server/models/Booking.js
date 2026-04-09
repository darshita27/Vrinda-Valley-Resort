const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  arrival: {
    type: Date
  },
  departure: {
    type: Date
  },
  guests: {
    type: Number
  },
  status: {
  type: String,
  default: "Pending"
}
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);