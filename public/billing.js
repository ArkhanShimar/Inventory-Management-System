// Money is allocated in whole cents so discounts, partial returns and refunds reconcile.
const cents=value=>Math.round(value*100);
function validMoney(value){return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1e10&&Math.abs(value*100-cents(value))<0.0001}
const roundedRatio=(value,numerator,denominator)=>Number((BigInt(value)*BigInt(numerator)*2n+BigInt(denominator))/(BigInt(denominator)*2n));
export function calculateBill(items,discountType='none',discountValue=0){
 if(!['none','amount','percent'].includes(discountType))throw Error('Choose a valid discount type');
 if(!validMoney(discountValue))throw Error('Enter a valid discount with up to two decimal places');
 if(discountType==='none'&&discountValue!==0)throw Error('Choose a discount type before entering a discount');
 if(discountType==='percent'&&discountValue>100)throw Error('Discount percentage must be between 0 and 100');
 const rows=items.map((item,index)=>{if(!validMoney(item.price)||!Number.isSafeInteger(item.quantity)||item.quantity<=0)throw Error('Enter valid prices and whole stock quantities');const gross=cents(item.price)*item.quantity;if(!Number.isSafeInteger(gross))throw Error('Enter a valid order total');return {...item,index,gross}});
 const subtotal=rows.reduce((sum,item)=>sum+item.gross,0);
 if(!Number.isSafeInteger(subtotal)||subtotal>1e12)throw Error('Enter a valid order total');
 const discount=discountType==='percent'?roundedRatio(subtotal,cents(discountValue),10000):discountType==='amount'?cents(discountValue):0;
 if(discount>subtotal)throw Error('Discount cannot exceed the subtotal');
 const total=subtotal-discount;
 const allocations=rows.map(row=>{const product=BigInt(row.gross)*BigInt(total);return {...row,net:subtotal?Number(product/BigInt(subtotal)):0,remainder:subtotal?product%BigInt(subtotal):0n}});
 let remaining=total-allocations.reduce((sum,row)=>sum+row.net,0);
 for(const row of [...allocations].sort((a,b)=>a.remainder===b.remainder?(a.productId??a.index)-(b.productId??b.index):a.remainder>b.remainder?-1:1)){if(remaining--<=0)break;row.net++}
 return {subtotal:subtotal/100,discountType,discountValue,discountAmount:discount/100,total:total/100,items:allocations.map(({index,gross,net,remainder,...item})=>({...item,netTotal:net/100}))};
}
export function returnValue(item,quantity){
 const prior=item.returned||0;
 if(!Number.isSafeInteger(quantity)||quantity<=0||prior+quantity>item.quantity)throw Error('Return quantity exceeds the quantity still eligible');
 const total=cents(item.netTotal??item.price*item.quantity);
 return (roundedRatio(total,prior+quantity,item.quantity)-roundedRatio(total,prior,item.quantity))/100;
}
export function receiptSummary(order){
 const rows=[['Subtotal',order.subtotal??order.total]];
 if(order.discountAmount>0)rows.push(['Discount',-order.discountAmount]);
 if(order.credited>0)rows.push(['Returns and credit adjustments',-order.credited]);
 if(order.status==='Cancelled')rows.push(['Voided amount',-order.total]);
 rows.push(['Total payable',order.netTotal??order.total],['Payments received',order.paid]);
 if(order.creditApplied>0)rows.push(['Shop credit used',order.creditApplied]);
 if(order.creditTransferred>0)rows.push(['Credit moved to another order',-order.creditTransferred]);
 if(order.refunded>0)rows.push(['Refunds paid',-order.refunded]);
 rows.push(['Outstanding',order.due??Math.max(0,order.total-order.paid)]);
 if(order.creditBalance>0)rows.push([order.saleType==='retail'?'Refund available':'Available shop credit',order.creditBalance]);
 return rows;
}
