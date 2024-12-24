import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import UserData from './models/userData.js'; // Assuming userData model is correct

dotenv.config();

// Passport Google OAuth strategy setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:8000/auth/google/callback',
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const { email, displayName } = profile;

      // Check if user exists in DB
      let user = await UserData.findOne({ email_id: email });

      if (!user) {
        // Create new user if not found
        user = new UserData({
          email_id: email,
          company: '',
          industry: '',
          sub_industry: '',
          question_no: 1,
          bit_string: '0',
          guidelines: [],
          practices: [],
          certifications: [],
          documents: []
        });
        await user.save();
      }

      // Store user info in session
      return done(null, user);
    } catch (error) {
      console.error('Error in Google Strategy callback:', error);
      return done(error, false);
    }
  }));

// Serialize and deserialize user for session persistence
passport.serializeUser((user, done) => {
  done(null, user.id); // Store user ID in session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserData.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
