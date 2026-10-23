// Optional integration check against real PostgreSQL in PGlite, never production.
// node tools/verify_cloud_schema.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);
const db=new PGlite();
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
await db.exec(`create role anon; create role authenticated;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users(id) values ('${a}'),('${b}');`);
await db.exec(await readFile(new URL('../supabase/migrations/001_progress.sql',import.meta.url),'utf8'));
async function login(id,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec('set role '+role);}
async function push(value,stamp='1700000000000-000001-device-one'){await db.query('select public.apply_pokeguide_records($1::jsonb)',[JSON.stringify([{key:'caught.gsc.25',value,stamp}])]);}
await login(a);await push({caught:true,edition:'gold'});
assert.equal((await db.query('select * from public.pokeguide_records')).rows.length,1);
await login(b);assert.equal((await db.query('select * from public.pokeguide_records')).rows.length,0);
await assert.rejects(db.query('insert into public.pokeguide_records(user_id,key,value,stamp) values($1,$2,$3,$4)',[a,'caught.gsc.19','{"caught":true}','1700000000000-000001-device-two']),/row-level security/);
await push({caught:true,edition:'silver'});assert.equal((await db.query('select user_id from public.pokeguide_records')).rows[0].user_id,b);
await login(a);await push({caught:false},'1700000000001-000000-device-one');await push({caught:true,edition:'gold'});
assert.deepEqual((await db.query('select value from public.pokeguide_records')).rows[0].value,{caught:false});
await login(null,'anon');await assert.rejects(db.query('select * from public.pokeguide_records'),/permission denied/);await assert.rejects(push({caught:true}),/permission denied/);
await login(null);await assert.rejects(push({caught:true}),/Authentication required/);
await login(a);await assert.rejects(db.query('select public.apply_pokeguide_records($1::jsonb)',[JSON.stringify(Array(401).fill({}))]),/Invalid progress batch/);
console.log('PASS: migration, account isolation, spoofed ownership, stale writes, undo, anonymous access and batch bounds');
await db.close();
