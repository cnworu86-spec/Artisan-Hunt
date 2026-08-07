const express = require('express');
const router = express.Router();
const { registerUser, authUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/regions', (req, res) => {
  res.json([
    // Accra
    'Accra', 'Tema', 'Madina', 'East Legon', 'Spintex', 'Osu', 'Cantonments', 'Dansoman', 
    'Achimota', 'Adenta', 'Teshie', 'Nungua', 'Kasoa', 'Lapaz', 'Kaneshie', 'Airport Residential', 'Roman Ridge',
    // Kumasi
    'Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Tafo', 'Suame', 'Asokwa', 'Bantama', 
    'KNUST/Bomso', 'Ahodwo', 'Santasi', 'Kejetia', 'Asawase', 'Oforikrom',
    // Others
    'Takoradi', 'Tamale', 'Cape Coast', 'Sunyani'
  ]);
});

module.exports = router;
