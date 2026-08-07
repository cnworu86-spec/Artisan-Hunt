const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { 
      firstName, lastName, email, phoneNumber, password, roles, 
      gender, region, address, gpsAddress, profileImage, 
      ghanaCardNumber, ghanaCardImage, alternativePhoneNumber, emergencyContactName,
      serviceCategory, jobTitle, bio 
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const accraTowns = [
      'Accra', 'Tema', 'Madina', 'East Legon', 'Spintex', 'Osu', 'Cantonments', 'Dansoman', 
      'Achimota', 'Adenta', 'Teshie', 'Nungua', 'Kasoa', 'Lapaz', 'Kaneshie', 'Airport Residential', 'Roman Ridge'
    ];
    const kumasiTowns = [
      'Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Tafo', 'Suame', 'Asokwa', 'Bantama', 
      'KNUST/Bomso', 'Ahodwo', 'Santasi', 'Kejetia', 'Asawase', 'Oforikrom'
    ];

    let coords = { latitude: 6.6666, longitude: -1.6163 }; // default Kumasi
    if (accraTowns.includes(region)) {
      coords = { latitude: 5.6037, longitude: -0.1870 };
    } else if (kumasiTowns.includes(region)) {
      coords = { latitude: 6.6666, longitude: -1.6163 };
    } else if (region === 'Takoradi') {
      coords = { latitude: 4.9016, longitude: -1.7831 };
    } else if (region === 'Tamale') {
      coords = { latitude: 9.4008, longitude: -0.8393 };
    } else if (region === 'Cape Coast') {
      coords = { latitude: 5.1315, longitude: -1.2795 };
    } else if (region === 'Sunyani') {
      coords = { latitude: 7.3349, longitude: -2.3124 };
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      passwordHash: password, // will be hashed in pre-save hook
      roles: roles || ['client'],
      gender,
      profileImage,
      alternativePhoneNumber,
      emergencyContactName,
      location: {
        region,
        address,
        gpsAddress,
        latitude: coords.latitude,
        longitude: coords.longitude
      },
      providerDetails: roles && roles.includes('provider') ? {
        serviceCategory,
        jobTitle,
        bio,
        isAvailable: false
      } : undefined,
      verification: {
        ghanaCardNumberEncrypted: ghanaCardNumber || '',
        ghanaCardImage: ghanaCardImage || '',
        verificationStatus: 'pending' // Force pending for all new users
      }
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim() : '';
    console.log('Login attempt:', { email: cleanEmail, password });

    let user = await User.findOne({ email: cleanEmail });
    let isAdmin = false;

    if (!user) {
      console.log('User not found in User collection, checking Admin');
      const Admin = require('../models/Admin');
      user = await Admin.findOne({ email: cleanEmail });
      isAdmin = true;
    }

    if (!user) {
      console.log('User completely not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    console.log('Password Match:', isMatch);

    if (user && isMatch) {
      // Update login metadata if it's a regular user
      if (!isAdmin) {
        if (!user.loginMetadata) user.loginMetadata = { loginCount: 0 };
        user.loginMetadata.lastLogin = Date.now();
        user.loginMetadata.loginCount += 1;
      } else {
        user.activityLogs.push({
          loginTime: Date.now(),
          ipAddress: req.ip
        });
      }
      
      await user.save();

      res.json({
        _id: user._id,
        firstName: isAdmin ? user.name : user.firstName,
        lastName: isAdmin ? '' : user.lastName,
        email: user.email,
        roles: isAdmin ? [user.role] : user.roles,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  authUser
};
