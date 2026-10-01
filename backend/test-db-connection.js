
import pool from './db.js';

async function testConnection() {
  console.log('🔄 Connecting to MySQL @ 84.247.146.238...');
  console.log('   User: root');
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ CONNECTION SUCCESSFUL!');
    
    // Run a simple query to verify permissions
    const [rows] = await connection.query('SELECT 1 as val, NOW() as server_time');
    console.log('✅ Query Response:', rows[0]);
    
    // Check which database is selected
    const [dbRows] = await connection.query('SELECT DATABASE() as dbName');
    console.log('✅ Connected to Database:', dbRows[0].dbName);

    connection.release();
    console.log('👋 Connection closed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ CONNECTION FAILED:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
        console.error('\n⚠️  Troubleshooting Tip:');
        console.error('   - Ensure MySQL is running on 84.247.146.238');
        console.error('   - Check if port 3306 is open in the firewall (sudo ufw allow 3306)');
        console.error('   - Check MySQL bind-address in my.cnf (should be 0.0.0.0 to allow remote connections)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('\n⚠️  Troubleshooting Tip:');
        console.error('   - Double check the password for user "root"');
        console.error('   - Ensure user "root" has permission to connect from this specific IP address (GRANT ALL ON *.* TO "root"@"%")');
    }
    process.exit(1);
  }
}

testConnection();
