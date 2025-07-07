const mongoose = require('mongoose');

async function connectDB() {
  
  const start = Date.now();
  
  await mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
    
    console.log(`DB connected in ${Date.now() - start}ms`);

}

module.exports = connectDB;