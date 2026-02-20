require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: (process.env.DB_ENCRYPT === 'true') || false,
    enableArithAbort: true
  }
};

// If DB server isn't configured, exit gracefully so local dev can continue using fallback endpoints
if(!dbConfig.server || !dbConfig.user || !dbConfig.database){
  console.warn('DB not configured; skipping seed. Copy server/.env.example to server/.env and set DB_* variables to enable seeding.');
  process.exit(0);
}

async function seed(){
  try{
    const pool = await sql.connect(dbConfig);
    console.log('Connected to DB');

    // create servers table if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='servers' and xtype='U')
      CREATE TABLE servers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        os_release NVARCHAR(100),
        server_type NVARCHAR(100),
        department NVARCHAR(100),
        region NVARCHAR(100)
      );
    `);

    // insert sample rows
    const oss = ['Windows','Linux','AIX','Ubuntu'];
    const types = ['VM','Physical','Container','Cloud'];
    const depts = ['Finance','HR','IT','Sales','Ops'];
    const regions = ['APAC','EMEA','AMER','India'];

    // Insert 200 sample rows in batches
    const batchSize = 50;
    const total = 200;
    for(let i=0;i<total;i+=batchSize){
      const values = [];
      for(let j=0;j<Math.min(batchSize, total - i); j++){
        const os = oss[Math.floor(Math.random()*oss.length)];
        const t = types[Math.floor(Math.random()*types.length)];
        const d = depts[Math.floor(Math.random()*depts.length)];
        const r = regions[Math.floor(Math.random()*regions.length)];
        values.push(`('${os}','${t}','${d}','${r}')`);
      }
      const insert = `INSERT INTO servers (os_release, server_type, department, region) VALUES ${values.join(',')};`;
      await pool.request().query(insert);
      console.log(`Inserted ${Math.min(batchSize, total - i)} rows`);
    }

    console.log('Seeding completed');
    process.exit(0);
  }catch(err){
    console.error('Seed error', err.message || err);
    process.exit(1);
  }
}

seed();
