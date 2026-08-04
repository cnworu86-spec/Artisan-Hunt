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
        gpsAddress
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
