const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

exports.createUser = async (req, res) => {
  const { fullName, email, password } = req.body;
  console.log('Received data:', req.body);

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Invalid password format' });
  }

  try {
    const user = new User({ fullName, email, password });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: 'Validation failed' });
  }
};

exports.editUser = async (req, res) => {
  const { fullName, password, email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (fullName) user.fullName = fullName;

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Invalid password format' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Validation failed' });
  }
};

exports.deleteUser = async (req, res) => {
    console.log('deleteUser() called');
    console.log('Request body:', req.body);

    const { email } = req.body;

    if (!email || typeof email !== 'string') {
        console.log('Invalid email:', email);
        return res.status(400).json({ error: 'Invalid email' });
    }

    try {
        const allUsers = await User.find();
        console.log('Current users in DB:', allUsers);

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`User with email ${email} found`);
        await User.deleteOne({ email });

        console.log(`User with email ${email} deleted`);

        if (user.imagePath) {
            const filePath = path.join(__dirname, `../${user.imagePath}`);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete image:', err);
            });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-__v');
  res.status(200).json({ users });
};


const multer = require('multer');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|gif)$/)) {
        return cb(new Error('Invalid file format'), false);
      }
      cb(null, true);
    }
  }).single('image');
  
  exports.uploadImage = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ error: err.message });
      }
  
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      try {
        const user = await User.findOne({ email });
  
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        if (user.imagePath) {
          const filePath = path.join(__dirname, `../${user.imagePath}`);
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete old image:', err);
          });
        }
  
        user.imagePath = `/uploads/${req.file.filename}`;
        await user.save();
  
        console.log(`Image uploaded successfully: ${user.imagePath}`);
        res.status(201).json({ message: 'Image uploaded successfully', filePath: user.imagePath });
      } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  };


