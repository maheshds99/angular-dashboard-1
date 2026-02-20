require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

let poolPromise = null;

async function getPool(){
  if(poolPromise) return poolPromise;
  poolPromise = sql.connect(dbConfig).then(pool=>pool).catch(err=>{ poolPromise=null; throw err; });
  return poolPromise;
}

// simple API key middleware (optional): set API_KEY in .env to enable
function requireApiKey(req,res,next){
  const apiKey = process.env.API_KEY;
  if(!apiKey) return next();
  const sent = req.header('x-api-key') || req.query.apiKey;
  if(sent && sent === apiKey) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Simple health check
app.get('/api/health', (req,res)=> res.json({ ok:true }));

// Aggregations endpoint: returns counts for os_release, server_type, department, region and OS by region
app.get('/api/aggregations', async (req,res)=>{
  try{
    const pool = await getPool();
    // run group queries
    const results = {};
    const queries = [
      { key: 'os', sql: `select os_release, count(*) as cnt from servers group by os_release order by cnt desc` },
      { key: 'type', sql: `select server_type, count(*) as cnt from servers group by server_type order by cnt desc` },
      { key: 'dept', sql: `select department, count(*) as cnt from servers group by department order by cnt desc` },
      { key: 'region', sql: `select region, count(*) as cnt from servers group by region order by cnt desc` }
    ];
    for(const q of queries){
      const r = await pool.request().query(q.sql);
      results[q.key] = r.recordset;
    }
    // OS by region stacked
    const r2 = await pool.request().query(`select region, os_release, count(*) as cnt from servers group by region, os_release order by region`);
    results['os_by_region'] = r2.recordset; // array of { region, os_release, cnt }

    // optionally return raw servers (limited)
    const srv = await pool.request().query(`select top 1000 id, os_release, server_type, department, region from servers`);
    results['servers'] = srv.recordset;

    res.json(results);
  }catch(err){
    console.error('aggregations error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// paginated servers endpoint with optional filter and API key protection
app.get('/api/servers', requireApiKey, async (req,res)=>{
  try{
    const pool = await getPool();
    const page = Math.max(1, parseInt(req.query.page || '1',10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '50',10)));
    const offset = (page-1)*pageSize;
    // optional filter param like ?filterKey=region&filterValue=APAC
    const filterKey = req.query.filterKey;
    const filterValue = req.query.filterValue;
    let where = '';
    if(filterKey && filterValue){
      // basic whitelist for column names
      const allowed = ['os_release','server_type','department','region'];
      if(allowed.includes(String(filterKey))){
        where = `WHERE ${filterKey} = @filterValue`;
      }
    }
    const totalQ = `select count(*) as total from servers ${where}`;
    const totalRes = await pool.request().input('filterValue', filterValue || '').query(totalQ);
    const total = totalRes.recordset[0] ? totalRes.recordset[0].total : 0;
    const q = `select id, os_release, server_type, department, region from servers ${where} order by id offset ${offset} rows fetch next ${pageSize} rows only`;
    const reqp = pool.request();
    if(where) reqp.input('filterValue', filterValue);
    const r = await reqp.query(q);
    res.json({ page, pageSize, total, data: r.recordset });
  }catch(err){ console.error(err); res.status(500).json({ error: err.message || String(err) }); }
});

// sessions endpoint (paginated). If sessions table exists, query it; otherwise return generated sample sessions.
app.get('/api/sessions', requireApiKey, async (req,res)=>{
  try{
    const pool = await getPool();
    // check if sessions table exists
    const chk = await pool.request().query("select 1 as exists_ from sysobjects where name='sessions' and xtype='U'");
    if(chk.recordset && chk.recordset.length){
      const page = Math.max(1, parseInt(req.query.page || '1',10));
      const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50',10)));
      const offset = (page-1)*pageSize;
      const totalQ = `select count(*) as total from sessions`;
      const totalRes = await pool.request().query(totalQ);
      const total = totalRes.recordset[0] ? totalRes.recordset[0].total : 0;
      const q = `select * from sessions order by id offset ${offset} rows fetch next ${pageSize} rows only`;
      const r = await pool.request().query(q);
      return res.json({ page, pageSize, total, data: r.recordset });
    }
  }catch(e){ console.warn('sessions query failed', e.message||e); }
  // fallback generated sessions
  const labels = Array.from({length:30}, (_,i)=>`Day ${i+1}`);
  const data = Array.from({length:30}, ()=>Math.floor(400+Math.random()*600));
  res.json({ page:1, pageSize:30, total:30, data: labels.map((l,i)=>({ label:l, value:data[i] })) });
});

// signups endpoint (paginated)
app.get('/api/signups', requireApiKey, async (req,res)=>{
  try{
    const pool = await getPool();
    const chk = await pool.request().query("select 1 as exists_ from sysobjects where name='signups' and xtype='U'");
    if(chk.recordset && chk.recordset.length){
      const page = Math.max(1, parseInt(req.query.page || '1',10));
      const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50',10)));
      const offset = (page-1)*pageSize;
      const totalQ = `select count(*) as total from signups`;
      const totalRes = await pool.request().query(totalQ);
      const total = totalRes.recordset[0] ? totalRes.recordset[0].total : 0;
      const q = `select * from signups order by id offset ${offset} rows fetch next ${pageSize} rows only`;
      const r = await pool.request().query(q);
      return res.json({ page, pageSize, total, data: r.recordset });
    }
  }catch(e){ console.warn('signups query failed', e.message||e); }
  // fallback
  const sample = [
    { name:'Alice J', email:'alice@example.com', plan:'Pro', date:'2025-12-10' },
    { name:'Ben K', email:'ben@example.com', plan:'Basic', date:'2025-12-11' },
    { name:'Cara S', email:'cara@example.com', plan:'Enterprise', date:'2025-12-12' }
  ];
  res.json({ page:1, pageSize:sample.length, total:sample.length, data: sample });
});

// fallback endpoint to return sample servers if DB isn't configured
app.get('/api/servers-sample', (req,res)=>{
  const oss = ['Windows','Linux','AIX','Ubuntu'];
  const types = ['VM','Physical','Container','Cloud'];
  const depts = ['Finance','HR','IT','Sales','Ops'];
  const regions = ['APAC','EMEA','AMER','India'];
  const servers = Array.from({length:120}).map((_,i)=>({ id:i+1, os_release: oss[Math.floor(Math.random()*oss.length)], server_type: types[Math.floor(Math.random()*types.length)], department: depts[Math.floor(Math.random()*depts.length)], region: regions[Math.floor(Math.random()*regions.length)] }));
  res.json({ servers });
});

app.listen(PORT, ()=> console.log(`Analytics backend started on ${PORT}`));
