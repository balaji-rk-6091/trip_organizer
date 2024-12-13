const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { connectDB, sequelize } = require('./db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditLog = require('./middleware/auditLog');
const User = require('./models/userModel');
const Admin = require('./models/adminModel');
const AuditLog = require('./models/auditLogModel');
const FamilyDetails = require('./models/familyDetailsModel'); // Import the FamilyDetails model

const app = express();
const port = 3000;

connectDB();

app.use(cors()); // Enable CORS
app.use(express.json());
app.use(auditLog); // Use the audit log middleware
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

sequelize.sync({ force: false }).then(() => {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
});