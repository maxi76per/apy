const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

let users = [];

let accessLogs = [];

async function initDB() {
  try {
    const adminPassword = await bcrypt.hash('secret123', 10);
    const userPassword = await bcrypt.hash('qwerty', 10);
    
    users.push({id: 1, username: 'admin', password: adminPassword, email: 'admin@test.com', role: 'admin'});
    users.push({id: 2, username: 'user1', password: userPassword, email: 'user1@test.com', role: 'user'});
    
    console.log('Database initialized with encrypted passwords.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initDB();


function logUnauthorizedAccess(req, reason) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    reason: reason
  };
  accessLogs.push(logEntry);
  console.log('SECURITY ALERT - Unauthorized Access Attempt:', logEntry);
}


function checkAdmin(req, res, next) {
 
  if (req.query.token !== 'admin_token') {
    logUnauthorizedAccess(req, 'Invalid or missing admin_token');
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}


app.get('/users', (req, res) => {
  
  const safeUsers = users.map(user => ({
    username: user.username,
    email: user.email,
    role: user.role
  }));
  res.json(safeUsers);
});


app.put('/users/:id', checkAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) return res.status(404).send('User not found');
  
  const allowedUpdates = ['email', 'password']; 
  const updates = Object.keys(req.body);
  
 
  const isValid = updates.every(field => allowedUpdates.includes(field));
  
  if (!isValid) {
    logUnauthorizedAccess(req, `Attempted to update restricted fields: ${updates.filter(f => !allowedUpdates.includes(f)).join(', ')}`);
    return res.status(400).send('Invalid updates. You can only update "email" and "password".');
  }
  
 
  if (req.body.email) {
    user.email = req.body.email;
  }
  

  if (req.body.password) {
    user.password = await bcrypt.hash(req.body.password, 10);
  }
  
  
  res.json({
    username: user.username,
    email: user.email,
    role: user.role
  });
});


app.get('/logs', checkAdmin, (req, res) => {
  res.json(accessLogs);
});

app.listen(3000, () => console.log('Secure server running on http://localhost:3000'));
