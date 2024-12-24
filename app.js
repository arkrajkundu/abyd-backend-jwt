import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { getQuestions, createUser, deleteUser, getUserData } from './controllers/userDataController.js';
import { loadQuestionsData } from './questionsData.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(express.json());
app.use(cors({
    origin: '*',
    credentials: true
}));

mongoose.connect('mongodb+srv://arkrajkundu:TaHRMZgtAICvMtaa@cluster0.qpzx6kx.mongodb.net/abyd-web-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

loadQuestionsData()
    .then(() => console.log("Questions data loaded successfully."))
    .catch(err => console.error("Failed to load questions data:", err));

app.post('/create-user', createUser);

app.post('/get-questions', getQuestions);

app.use('/auth', authRoutes);

app.get('/dashboard', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const userEmail = req.user.email;
            const userData = await getUserData.findOne({ email_id: userEmail });

            if (userData) {
                res.json({ loggedIn: true, userData });
            } else {
                res.json({ loggedIn: true, message: 'No user data found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error fetching user data' });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
