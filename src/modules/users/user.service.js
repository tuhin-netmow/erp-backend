const UserRepository = require('./user.repository');
const bcrypt = require('bcrypt');

class UserService {
  async getAllUsers(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await UserRepository.findAll(filters, limit, offset);
    return {
      data: result.rows,
      total: result.count
    };
  }

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async createUser(data, userId) {
    // Check if email already exists
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userData = { ...data, password: hashedPassword, created_by: userId };

    const user = await UserRepository.create(userData);
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async updateUser(id, data) {
    // If email is being updated, check for duplicates
    if (data.email) {
      const existing = await UserRepository.findByEmail(data.email);
      if (existing && existing.id !== parseInt(id)) {
        throw new Error('User with this email already exists');
      }
    }

    // Hash password if being updated. Ignore empty or null password values.
    if (data.password === undefined || data.password === null) {
      delete data.password;
    } else if (typeof data.password === 'string') {
      if (data.password.trim() === '') {
        delete data.password;
      } else {
        data.password = await bcrypt.hash(data.password, 10);
      }
    }

    const user = await UserRepository.update(id, data);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async deleteUser(id) {
    const user = await UserRepository.delete(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new UserService();
