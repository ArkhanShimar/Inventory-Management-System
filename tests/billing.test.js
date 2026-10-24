import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateBill,returnValue,receiptSummary} from '../public/billing.js';

test('amount and percentage discounts determine the payable bill, with cent rounding',()=>{
 const items=[{productId:1,quantity:2,price:760}];
 assert.equal(calculateBill(items,'percent',10).total,1368);
 assert.equal(calculateBill(items,'percent',10).discountAmount,152);
 assert.equal(calculateBill(items,'amount',200).total,1320);
 const fractional=calculateBill([{productId:1,quantity:1,price:85.25}],'percent',10);assert.equal(fractional.discountAmount,8.53);assert.equal(fractional.total,76.72);
 for(const [type,value]of [['percent',101],['amount',1520.01],['amount',-1],['amount',1.001],['other',2],['none',10],['amount',NaN],['percent',Infinity]])assert.throws(()=>calculateBill(items,type,value),/discount|Discount/);
 assert.equal(calculateBill(items,'percent',100).total,0);assert.equal(calculateBill(items,'amount',1520).total,0);
});

test('discount allocations and repeated partial returns never create or lose a cent',()=>{
 for(let seed=1;seed<=400;seed++){
  const items=[{productId:1,price:(seed*37%700+1)/100,quantity:seed%7+1},{productId:2,price:(seed*23%900+1)/100,quantity:seed%5+1}];
  const bill=calculateBill(items,'percent',(seed*13%9999)/100);
  assert.equal(bill.items.reduce((sum,item)=>sum+Math.round(item.netTotal*100),0),Math.round(bill.total*100));
  let returned=0;for(const item of bill.items){for(let count=0;count<item.quantity;count++)returned+=Math.round(returnValue({...item,returned:count},1)*100)}
  assert.equal(returned,Math.round(bill.total*100));
 }
 const item=calculateBill([{productId:1,price:.33,quantity:3}],'amount',.01).items[0];
 assert.deepEqual([0,1,2].map(returned=>returnValue({...item,returned},1)),[.33,.32,.33]);
 assert.throws(()=>returnValue({...item,returned:2},2),/quantity/);
});

test('paid receipts show a clear total and omit irrelevant credit, refund and return rows',()=>{
 const order={saleType:'retail',status:'Delivered',subtotal:1520,total:1520,netTotal:1520,paid:1520,due:0,credited:0,refunded:0,creditApplied:0,creditTransferred:0,creditBalance:0};
 assert.deepEqual(receiptSummary(order),[['Subtotal',1520],['Total payable',1520],['Payments received',1520],['Outstanding',0]]);
 const discounted={...order,discountAmount:152,discountType:'percent',discountValue:10,total:1368,netTotal:1368,paid:1368};assert.ok(receiptSummary(discounted).some(([label,value])=>label==='Discount'&&value===-152));
 const credit={...order,saleType:'shop',paid:1000,creditApplied:520};assert.ok(receiptSummary(credit).some(([label,value])=>label==='Shop credit used'&&value===520));
 const returned={...discounted,credited:684,netTotal:684,refunded:684};assert.ok(receiptSummary(returned).some(([label,value])=>label==='Refunds paid'&&value===-684));
 assert.ok(!receiptSummary(order).some(([label])=>label==='Net received including credit'));
});
