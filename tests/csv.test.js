import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV} from '../public/csv.js';
test('CSV supports Excel BOM, quoted commas, escaped quotes and multiline records',()=>{
 assert.deepEqual(parseCSV('\uFEFFcode,name,area\r\nS1,"Perera, Stores","Colombo\nSouth"\r\nS2,"A ""quoted"" shop",Galle\r\n'),[{code:'S1',name:'Perera, Stores',area:'Colombo\nSouth'},{code:'S2',name:'A "quoted" shop',area:'Galle'}]);
});
test('CSV rejects malformed records rather than shifting columns',()=>{
 for(const value of ['name,name\na,b','code,name\nS1','code,name\nS1,"Unclosed','code,name\nS1,"A"oops','code,name\n'])assert.throws(()=>parseCSV(value));
});
