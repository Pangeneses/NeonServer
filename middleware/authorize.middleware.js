const jwt = require('jsonwebtoken');

function authorize(roles = []) {

  return (req, res, next) => {

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {

      return res.status(401).json({ message: 'Missing or invalid token' });

    }

    const token = authHeader.split(' ')[1];

    try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {

        return res.status(403).json({ message: 'Forbidden: Insufficient role' });

      }

      next();

    } catch (err) {

      return res.status(401).json({ message: 'Invalid or expired token' });

    }

  };
  
}