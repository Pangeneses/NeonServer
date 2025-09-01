const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  Avatar: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$/i.test(v);
      },
      message: props => `Avatar should be UUID and .jpg or .webp.`
    },
    unique: false
  },
  JournalDesc: {
    type: String,
    required: false,
    trim: false,
    validate: {
      validator: function (v) {
        return /^$|^[a-zA-Z0-9-#\r\n ]+$/.test(v);
      },
      message: props => `Journal description shouldn't include special characters.`
    },
    unique: false,
    default: ``
  },
  UserName: {
    type: String,
    required: [true, `UserName required.`],
    trim: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9]+$/.test(v);
      },
      message: props => `UserName must be a - z, A - Z, or 0 - 9 no white space.`
    },
    unique: [true, `UserName must be unique.`]
  },
  FirstName: {
    type: String,
    required: [true, `First name required.`],
    trim: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z-]+$/.test(v);
      },
      message: props => `First name shouldn't include special characters.`
    },
    unique: false
  },
  LastName: {
    type: String,
    required: [true, `Last name required.`],
    trim: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z-]+$/.test(v);
      },
      message: props => `Last name shouldn't include special characters.`
    },
    unique: false
  },
  AddressOne: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function (v) {
        return /^$|^[a-zA-Z0-9- ]+$/.test(v);
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
      validator: function (v) {
        return /^$|^[a-zA-Z0-9 ]+$/.test(v);
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
      validator: function (v) {
        return /^$|^[a-zA-Z- ]+$/.test(v);
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
      validator: function (v) {
        return /^$|^[a-zA-Z- ]+$/.test(v);
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
      validator: function (v) {
        return /^$|^[a-zA-Z0-9 ]+$/.test(v);
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
      validator: function (v) {
        return /^$|^[a-zA-Z- ]+$/.test(v);
      },
      message: props => `Please provide a valid Country.`
    },
    unique: false
  },
  EMail: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: props => `Please provide a valid email.`
    },
    unique: [true, `Another account uses this email.`]
  },
  Cellphone: {
    type: String,
    required: false,
    trim: true,
    unique: [true, `Cellphone is used by another account`],
    sparse: true
  },
  DateOfBirth: {
    type: Date,
    required: false,
    trim: true,
    unique: false,
    default: new Date('1900-01-01')
  },
  Password: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v || v.trim() === '') return true; // ✅ allow blank
        return /^((?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,30})$/.test(v);
      },
      message: props => `Password must have cap, no cap, 8 char, special char.`
    }
  },
  ReEnter: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v || v.trim() === '') return true; // ✅ allow blank
        return /^((?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,30})$/.test(v);
      },
      message: props => `Password must have cap, no cap, 8 char, special char.`
    }
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
    required: false,
    enum: [`Admin`, `User`],
    unique: false,
    default: `User`
  }

});

UserSchema.pre('save', async function (next) {

  if (!this.isModified('Password')) return next();

  try {

    const salt = await bcrypt.genSalt(10);

    this.Password = await bcrypt.hash(this.Password, salt);

    this.ReEnter = this.Password;

    next();

  } catch (err) {

    next(err);

  }

});

module.exports = mongoose.model("UserModel", UserSchema);