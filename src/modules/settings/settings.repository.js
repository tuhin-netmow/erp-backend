const { sequelize } = require('../../core/database/sequelize');

class SettingsRepository {
  async findAll(limit = 10, offset = 0) {
    const query = 'SELECT * FROM settingss LIMIT ? OFFSET ?';
    const [rows] = await sequelize.query(query, {
      replacements: [limit, offset]
    });
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM settingss');
    return { rows, count: countResult[0].count };
  }

  async findById(id) {
    const query = 'SELECT * FROM settingss WHERE id = ?';
    const [rows] = await sequelize.query(query, {
      replacements: [id]
    });
    return rows[0] || null;
  }

  async findByName(name) {
    const query = 'SELECT * FROM settingss WHERE name = ?';
    const [rows] = await sequelize.query(query, {
      replacements: [name]
    });
    return rows[0] || null;
  }

  async create(data) {
    const query = 'INSERT INTO settingss (name, description, status) VALUES (?, ?, ?)';
    const [result] = await sequelize.query(query, {
      replacements: [data.name, data.description, data.status || 'Active']
    });
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const query = 'UPDATE settingss SET name = ?, description = ?, status = ? WHERE id = ?';
    await sequelize.query(query, {
      replacements: [data.name, data.description, data.status, id]
    });
    return this.findById(id);
  }

  async delete(id) {
    const record = await this.findById(id);
    if (!record) return null;
    const query = 'DELETE FROM settingss WHERE id = ?';
    await sequelize.query(query, {
      replacements: [id]
    });
    return record;
  }
}

module.exports = SettingsRepository;
