import express from 'express';
import pg from 'pg';
import crypto from 'crypto';
const {Pool}=pg; const app=express(); app.use(express.json({limit:'20mb'})); app.use(express.static('public'));
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}):null;
async function init(){if(!pool)return; await pool.query(`CREATE TABLE IF NOT EXISTS games(id TEXT PRIMARY KEY,name TEXT NOT NULL,html TEXT DEFAULT '',js TEXT DEFAULT '',blocks JSONB DEFAULT '[]',sprites JSONB DEFAULT '[]',created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now())`)}
app.post('/api/games',async(req,res)=>{try{const b=req.body||{}; const id=crypto.randomBytes(6).toString('base64url'); if(!pool)return res.status(503).json({error:'DATABASE_URL is not configured'}); await pool.query('INSERT INTO games(id,name,html,js,blocks,sprites) VALUES($1,$2,$3,$4,$5,$6)',[id,b.name||'Untitled Game',b.html||'',b.js||'',JSON.stringify(b.blocks||[]),JSON.stringify(b.sprites||[])]); res.json({id,url:`${req.protocol}://${req.get('host')}/play/${id}`})}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/games/:id',async(req,res)=>{try{if(!pool)return res.status(503).json({error:'DATABASE_URL is not configured'}); const r=await pool.query('SELECT * FROM games WHERE id=$1',[req.params.id]); if(!r.rowCount)return res.status(404).json({error:'Game not found'}); res.json(r.rows[0])}catch(e){res.status(500).json({error:e.message})}});
app.put('/api/games/:id',async(req,res)=>{try{if(!pool)return res.status(503).json({error:'DATABASE_URL is not configured'}); const b=req.body||{}; await pool.query('UPDATE games SET name=$1,html=$2,js=$3,blocks=$4,sprites=$5,updated_at=now() WHERE id=$6',[b.name||'Untitled Game',b.html||'',b.js||'',JSON.stringify(b.blocks||[]),JSON.stringify(b.sprites||[]),req.params.id]); res.json({ok:true})}catch(e){res.status(500).json({error:e.message})}});
app.get('/play/:id',(req,res)=>res.sendFile(process.cwd()+'/public/play.html'));
app.get('/editor/:id',(req,res)=>res.sendFile(process.cwd()+'/public/editor.html'));
init().then(()=>app.listen(process.env.PORT||3000,()=>console.log('Rescler running')));