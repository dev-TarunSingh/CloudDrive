import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token error:', err.message); 
    res.status(403).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
