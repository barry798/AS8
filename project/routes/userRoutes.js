const express = require('express');
const {
  createUser,
  editUser,
  deleteUser,
  getAllUsers,
  uploadImage
} = require('../controllers/userController');

const router = express.Router();

router.post('/create', createUser);
router.put('/edit', editUser);
router.delete('/delete', (req, res, next) => {
    console.log('DELETE route reached');
    deleteUser(req, res);
  });
router.get('/getAll', getAllUsers);
router.post('/uploadImage', uploadImage);

module.exports = router;
