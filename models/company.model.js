const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CompanySchema = new Schema({
  User: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
    required: [true, `User required.`]
  },
  CompanyName: {
    type: String,
    required: [true, `Company name required.`],
    trim: true,
    validate: {
        validator: function(v) {
            return /^[a-zA-Z- ]+$/.test(v);
        },
        message: props => `First name shouldn't include special characters.`
    },
    unique: false
  },
  AddressOne: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9- ]+$/.test(v);
        },
        message: props => `Adress shouldn't include special characters.`
    },
    unique: false
  },
  AddressTwo: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9- ]+$/.test(v);
        },
        message: props => `Adress shouldn't include special characters.`
    },
    unique: false
  },
  City: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z- ]+$/.test(v);
        },
        message: props => `Please provide a valid City name.`
    },
    unique: false
  },
  Region: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z- ]+$/.test(v);
        },
        message: props => `Please provide a valid Region for your Couuntry.`
    },
    unique: false
  },
  Post: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9 ]+$/.test(v);
        },
        message: props => `Please provide a valid post code.`
    },
    unique: false
  },
  Country: {
    type: String,
    required: false,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z- ]+$/.test(v);
        },
        message: props => `Please provide a valid Country.`
    },
    unique: false
  },
  Email: {
    type: String,
    required: false,
    trim: true,
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: props => `Please provide a valid email.`
    },
    unique: [true, `Another account uses this email.`]
  },
  Cellphone: {
    type: String,
    required: [true, `Cellphone required.`],
    trim: true, 
    unique: [true, `Cellphone is used by another account`]
  },
  Avatar: {
    type: String,
    required: true,
    trim: true, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9]+$/.test(v);
        },
        message: props => `Adress shouldn't include special characters.`
    },
    unique: false
  },
  CompanyDescription: {
    type: String,
    required: false,
    trim: false, 
    validate: {
        validator: function(v) {
            return /^[a-zA-Z0-9]+$/.test(v);
        },
        message: props => `Journal description shouldn't include special characters.`
    },
    unique: false,
    default: ``
  },
  DateOfBirth: {
    type: Date,
    required: false,
    trim: true,
    unique: false,
    default: new Date('1900-01-01')
  },
  CreatedDate: {
    type: Date,
    required: false,
    trim: true,
    unique: false,
    default: Date.now
  },
  Role: { 
    type: String, 
    enum: [`Admin`, `User`], 
    default: `User` 
  }
});

module.exports = mongoose.model("CompanyModel", CompanySchema);