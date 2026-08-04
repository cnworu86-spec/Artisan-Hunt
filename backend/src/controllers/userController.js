const User = require('../models/User');
const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

// @desc    Get all providers (with location/region filtering)
// @route   GET /api/users/providers
// @access  Public
const getProviders = async (req, res) => {
  try {
    const { region, lat, lng, service, maxDistance = 50 } = req.query;

    let query = { roles: { $in: ['provider'] } };

    // Region filtering
    if (region) {
      query['location.region'] = { $regex: region, $options: 'i' };
    }

    // Service category filtering
    if (service) {
      query['providerDetails.jobTitle'] = { $regex: service, $options: 'i' };
    }

    // Fetch providers
    let providers = await User.find(query).select('-passwordHash');

    // GPS filtering (Haversine)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      providers = providers.map(provider => {
        if (provider.location && provider.location.latitude && provider.location.longitude) {
          const distance = calculateDistance(
            userLat, userLng, 
            provider.location.latitude, provider.location.longitude
          );
          return { ...provider.toObject(), distance };
        }
        return { ...provider.toObject(), distance: null };
      }).filter(p => p.distance !== null && p.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
    }

    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      
      if (req.body.providerDetails) {
        user.providerDetails = { 
          ...(user.providerDetails ? user.providerDetails.toObject() : {}), 
          ...req.body.providerDetails 
        };
      }
      
      if (req.body.location) {
        user.location = { ...user.location, ...req.body.location };
      }

      if (req.body.roles && req.body.roles.length > 0) {
        // Prevent changing to admin
        const filteredRoles = req.body.roles.filter(r => r !== 'admin' && r !== 'superadmin');
        if (filteredRoles.length > 0) {
          user.roles = Array.from(new Set([...user.roles, ...filteredRoles]));
        }
      }

      const updatedUser = await user.save();

      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user's push token
// @route   PUT /api/users/push-token
// @access  Private
const updateUserPushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.pushToken = pushToken;
    await user.save();
    res.json({ success: true, message: 'Push token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit profile update request for admin review
// @route   POST /api/users/profile-update-request
// @access  Private
const submitProfileUpdateRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const previousData = {
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      phoneNumber: user.phoneNumber,
      alternativePhoneNumber: user.alternativePhoneNumber,
      emergencyContactName: user.emergencyContactName,
      bio: user.providerDetails?.bio,
      jobTitle: user.providerDetails?.jobTitle,
      region: user.location?.region
    };

    const requestedChanges = req.body;

    const request = await ProfileUpdateRequest.create({
      userId: user._id,
      previousData,
      requestedChanges,
      status: 'pending'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest profile update request status for logged in user
// @route   GET /api/users/profile-update-request/me
// @access  Private
const getLatestProfileUpdateRequest = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(request || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProviders,
  getUserProfile,
  updateUserProfile,
  updateUserPushToken,
  submitProfileUpdateRequest,
  getLatestProfileUpdateRequest
};
