// src/middleware/featureToggle.js
const mongoose = require('mongoose');

exports.checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const Setting = mongoose.model('Setting');
      let settings = await Setting.findOne({ key: 'site_settings' });
      
      // If settings don't exist yet, we default to enabled
      if (!settings) {
        return next();
      }

      if (settings[featureName] === false) {
        return res.status(403).json({
          success: false,
          message: `The requested module (${featureName}) is not active or licensed on this system.`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
