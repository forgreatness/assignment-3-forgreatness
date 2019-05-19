const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

const bcrypt = require('bcryptjs');

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    admin: { required: false }
};
exports.UserSchema = UserSchema;

async function insertNewUser(user) {
  userToInsert = user;
  userToInsert.id = null;
  const passwordHash = await bcrypt.hash(userToInsert.password, 8);
  userToInsert.password = passwordHash;
  console.log(userToInsert);
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'INSERT INTO users SET ?',
      userToInsert,
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      }
    );
  });
}
exports.insertNewUser = insertNewUser;

function getUserById(email, includePassword) {
  if (includePassword) {
    return new Promise((resolve, reject) => {
      mysqlPool.query(
        'SELECT id, name, email, password, admin FROM users WHERE email = ?',
        [ email ],
        (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results[0]);
          }
        }
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      mysqlPool.query(
        'SELECT id, name, email, admin FROM users WHERE email = ?',
        [ email ],
        (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results[0]);
          }
        }
      );
    });
  }
}
exports.getUserById = getUserById;

exports.validateUser = async function (email, password) {
  const user = await getUserById(email, true);
  const authenticated = user && await bcrypt.compare(password, user.password);
  if (authenticated) {
    return { id: user.id, email: user.email, admin: user.admin };
  } else {
    return null;
  }
}
