import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticate = (req, res, next) => {
  try {
 
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    const token = authHeader.split(' ')[1];
    
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
   
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};