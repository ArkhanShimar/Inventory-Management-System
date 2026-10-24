import {test} from 'node:test';
import assert from 'node:assert/strict';
import {messages,translate,localeFor,localize,formatDate,formatWeekday} from '../public/i18n.js';

test('every interface message has Sinhala and Tamil translations without duplicate keys',()=>{
 const keys=new Set();for(const [en,si,ta] of messages){assert.ok(en&&si&&ta);assert.match(si,/[\u0D80-\u0DFF]/,en);assert.match(ta,/[\u0B80-\u0BFF]/,en);assert.ok(!keys.has(en.toLowerCase()),en);keys.add(en.toLowerCase());assert.equal(translate(en,'en'),en);assert.equal(translate(en,'si'),si);assert.equal(translate(en,'ta'),ta)}
});
test('dynamic labels translate without changing references, counts or amounts',()=>{
 for(const language of ['si','ta'])for(const text of ['8 product variants','2 orders to collect','3 low','40 units','Invoice LM-0001','Order LM-0001','Cancelled LM-0001','Total LKR 85.00','Outstanding:','＋ Add product →']){const translated=translate(text,language);assert.notEqual(translated,text,text);for(const number of text.match(/\d+(?:\.\d+)?/g)||[])assert.ok(translated.includes(number),text)}
 assert.equal(translate('Perera Stores','si'),'Perera Stores');assert.equal(translate('Jasmine','ta'),'Jasmine');
 assert.equal(localeFor('si'),'si-LK');assert.equal(localeFor('ta'),'ta-LK');assert.equal(localeFor('bad'),'en-LK');
 assert.equal(formatDate('2026-10-24T08:00:00Z','si'),'24 ඔක්තෝබර් 2026');assert.equal(formatWeekday('2026-10-24T08:00:00Z','ta'),'சனி');
});
test('localization preserves entered data and input values',()=>{
 // Small DOM fixture: localization uses the browser's TreeWalker and attribute APIs.
 const copy={nodeValue:'Save',parentElement:{closest:()=>false}};
 const business={nodeValue:'Save',parentElement:{closest:()=>true}};
 const attribute={value:'An unchanged shop name',attributes:{placeholder:'Search shops…'},closest:()=>false,hasAttribute(name){return name in this.attributes},getAttribute(name){return this.attributes[name]},setAttribute(name,value){this.attributes[name]=value}};
 let index=0;const nodes=[copy,business];const root={ownerDocument:{createTreeWalker(){return{nextNode:()=>nodes[index++]||null}}},querySelectorAll:()=>[attribute]};
 localize(root,'si');assert.equal(copy.nodeValue,translate('Save','si'));assert.equal(business.nodeValue,'Save');assert.equal(attribute.value,'An unchanged shop name');assert.equal(attribute.attributes.placeholder,translate('Search shops…','si'));
});
