// Disposable UI verification workspace; never used by the real application.
import { openStore } from '../database.js';
import { createAuth } from '../auth.js';
const store=openStore('data/ui-check.sqlite');
const products=[['Silk soap bar','Jasmine','100 g','Soap bars',240,85,40],['Silk soap bar','Sandalwood','100 g','Soap bars',186,85,40],['Fresh dishwash','Lime','500 ml','Dishwashing',124,320,25],['Gentle hand wash','Rose','250 ml','Hand wash',18,290,30],['Daily washing powder','Original','1 kg','Washing powder',95,480,20],['Soft fabric conditioner','Lavender','1 L','Fabric care',12,650,25]].map((p,i)=>({id:i+1,sku:`QA-${i+1}`,name:p[0],variant:p[1],size:p[2],category:p[3],stock:p[4],price:p[5],minimum:p[6]}));
if(!store.read().products.length)store.write({products,customers:[{id:1,name:'Perera Stores',area:'Nugegoda',phone:'0772345678'}],orders:[],movements:[]});
const auth=createAuth(store.db);if(!auth.configured())auth.setup('839201',{setHeader(){}});
store.close();
