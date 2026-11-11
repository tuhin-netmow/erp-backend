
// This model is deprecated and now aliases the User model as Staff and User are unified.
const { User } = require('../users/user.model');

module.exports = { Staff: User };
