const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'history.db');
const db = new Database(dbPath);

console.log('Adding post integration to sections table...');

try {
  // Add postId column to link sections to posts
  db.exec(`
    ALTER TABLE sections ADD COLUMN post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;
  `);
  
  // Add dateOfEvent column for historical events
  db.exec(`
    ALTER TABLE sections ADD COLUMN date_of_event TEXT;
  `);
  
  // Update the type enum to include 'historical_event'
  // Note: SQLite doesn't support ALTER COLUMN for enums, so we'll handle this in the app logic
  
  console.log('✅ Successfully added post integration columns to sections table');
  
} catch (error) {
  console.error('❌ Error during migration:', error);
} finally {
  db.close();
}