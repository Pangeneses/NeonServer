const mongoose = require('mongoose');

const UserModel = require('../models/users.model');
const bcrypt = require('bcrypt');

const sanitizers = require('../services/sanitizer.service')

const scanUsers = async (req, res) => {

  const flags = "u";

  try {

    const {
      regex = '',
      cursor = '',
      dir = 'down',
      limit = 10
    } = req.query;

    const query = {};

    if (regex) {

      query.UserName = sanitizers.tryCreateRegex(regex, flags || "");

    } else {

      query.UserName = sanitizers.tryCreateRegex(".*", flags || "");

    }

    if (cursor) {

      try {

        const objectId = new mongoose.Types.createFromHexString(cursor);

        query._id = dir === 'down' ? { $gt: objectId } : { $lt: objectId };

      } catch (e) {

        return res.status(400).json({ error: 'Invalid cursor ID' });

      }

    }

    const sortDirection = dir === 'down' ? 1 : -1;

    const users = await UserModel
      .find(query, { _id: 1, UserName: 1 })
      .sort({ _id: sortDirection })
      .limit(parseInt(limit, 10));

    const result = dir === 'up' ? users.reverse() : users;

    const formatted = result.map(u => ({
      ID: u._id,
      UserName: u.UserName
    }));

    res.json(formatted);

  } catch (err) {

    console.error('Error scanning users:', err);

    res.status(500).json({ error: 'Failed to scan users' });

  }

};

const loginUser = async (req, res) => {

  const { UserName, Password } = req.body;

  try {
    
    if (!UserName || !Password) {
      
      return res.status(400).json({ success: false, message: "Missing credentials" });
  
    }

    const user = await UserModel.findOne({ UserName });

    if (!user) {

      return res.status(404).json({ success: false, message: 'User not found' });

    }

    const isMatch = await bcrypt.compare(Password, user.Password);

    if (!isMatch) {

      return res.status(401).json({ success: false, message: 'Invalid password' });

    }

    const userData = user.toObject();

    userData.ID = userData._id;

    delete userData._id;
    delete userData.Password;
    delete userData.ReEnter;

    return res.status(200).json({ success: true, user: userData });

  } catch (error) {

    console.error('Login error:', error);

    return res.status(500).json({ success: false, message: 'Server error' });

  }

};

const createUser = async (req, res) => {

  const formData = req.body;

  if (!req.body.Password && !req.body.ReEnter) {
    
    return res.status(400).json({ success: false, message: 'Password is required.' });

  }

  try {

    const newUser = new UserModel(formData);

    await newUser.save();

    const userObj = newUser.toObject();
  
    userObj.ID = userObj._id;

    delete userObj._id;
    delete userObj.Password;
    delete userObj.ReEnter;

    res.status(201).json({
      message: 'User created successfully',
      user: userObj
    });

  } catch (error) {

    console.error('Error saving user:', error);

    res.status(500).json({ message: 'Error creating user', error });

  }

};

const getUserByID = async (req, res) => {

  try {

    const user = await UserModel.findById(req.params.id).lean();

    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }

    res.json(user);

  } catch (err) {

    console.error('Failed to get user by ID:', err);

    res.status(500).json({ message: 'Internal server error' });

  }
  
};

const updateUser = async (req, res) => {
  
  const { id } = req.params;
  
  const updateData = { ...req.body };

  if (updateData.Password === '') {
    
    delete updateData.Password;
    delete updateData.ReEnter;

  }

  try {

    const user = await UserModel.findById(id);

    if (!user) {

      return res.status(404).json({ success: false, message: 'User not found' });

    }

    Object.entries(updateData).forEach(([key, value]) => {

      user[key] = value;

    });

    await user.save();

    const userObj = user.toObject();

    userObj.ID = userObj._id;

    delete userObj._id;
    delete userObj.Password;
    delete userObj.ReEnter;

    return res.status(200).json({ success: true, message: 'User updated successfully', user: userObj });

  } catch (error) {

    console.error('Update error:', error);

    return res.status(500).json({ success: false, message: 'Error updating user', error });

  }
  
};

module.exports = {
  scanUsers,
  loginUser,
  createUser,
  getUserByID,
  updateUser
}