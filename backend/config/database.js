const { Pool } = require('pg');

// Database connection pool
let pool;

const connectDB = async () => {
  try {
    // Create PostgreSQL connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected at:', result.rows[0].now);
    client.release();

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client:', err);
    });

    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return pool;
};

// Database helper functions
const dbHelpers = {
  // Execute a query with parameters
  async query(text, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Execute multiple queries in a transaction
  async transaction(queries) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      
      for (const { text, params } of queries) {
        const result = await client.query(text, params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get a single row
  async getOne(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  },

  // Get multiple rows
  async getMany(text, params = []) {
    const result = await this.query(text, params);
    return result.rows;
  },

  // Insert and return the created record
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  },

  // Update and return the updated record
  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE ${table} 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  },

  // Delete a record
  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await this.query(query, [id]);
    return result.rows[0];
  },

  // Soft delete (update status to 'deleted')
  async softDelete(table, id) {
    const query = `
      UPDATE ${table} 
      SET status = 'deleted', updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = {
  connectDB,
  getDB,
  db: dbHelpers
};
