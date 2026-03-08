import pool from './db.js';

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        stripe_customer_id VARCHAR,
        stripe_subscription_id VARCHAR,
        subscription_status VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // User profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        experience VARCHAR,
        industry VARCHAR,
        job_title VARCHAR,
        location VARCHAR,
        remote_preference VARCHAR,
        salary_min INTEGER,
        salary_max INTEGER,
        resume TEXT,
        skills TEXT[],
        preferences JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Job searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_searches (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        name VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'active',
        search_criteria JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Job applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        job_search_id VARCHAR REFERENCES job_searches(id),
        company VARCHAR NOT NULL,
        position VARCHAR NOT NULL,
        job_url TEXT,
        status VARCHAR DEFAULT 'applied',
        applied_at TIMESTAMP DEFAULT NOW(),
        resume_version TEXT,
        cover_letter TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // User metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_metrics (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        date TIMESTAMP DEFAULT NOW(),
        applications_submitted INTEGER DEFAULT 0,
        resumes_optimized INTEGER DEFAULT 0,
        jobs_found INTEGER DEFAULT 0,
        active_agents INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Sessions table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
}