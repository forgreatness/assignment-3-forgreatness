const jwt = require('jsonwebtoken');

const secretKey = 'SuperSecret';

exports.generateAuthToken = function (id, email, priviledge) {
  const payload = {
    sub: id,
    email: email,
    admin: priviledge
  };
  const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
  return token;
};

exports.requireAuthentication = function (req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try{
    const payload = jwt.verify(token, secretKey);
    req.user = payload;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};
