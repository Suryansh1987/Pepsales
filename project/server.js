import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import notificationRoutes from './src/routes/notifications.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


app.use('/auth', authRoutes);
app.use('/notifications', notificationRoutes);
app.use('/users', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Notification API is running' });
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});