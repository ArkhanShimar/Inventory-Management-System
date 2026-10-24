export function parseCSV(text){
 if(typeof text!=='string'||text.length>2e6)throw Error('Choose a CSV file under 2 MB');
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
 const pushCell=()=>{row.push(cell);cell='';closed=false};
 const pushRow=()=>{pushCell();if(row.some(value=>value.trim()!==''))rows.push(row);row=[]};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
  if(c==='"'){if(cell.trim()!==''||closed)throw Error('The CSV contains invalid quotation marks');cell='';quoted=true}
  else if(c===',')pushCell();else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;pushRow()}
  else{if(closed&&!/\s/.test(c))throw Error('The CSV contains invalid quotation marks');if(!closed)cell+=c}
 }
 if(quoted)throw Error('The CSV contains an unclosed quoted field');if(cell!==''||row.length||closed)pushRow();
 if(rows.length<2||rows.length>2001)throw Error('Choose a CSV with 1 to 2000 records');const headers=rows.shift().map(h=>h.trim().toLowerCase());
 if(headers.some(h=>!h)||new Set(headers).size!==headers.length||headers.length>20)throw Error('CSV column names must be unique and non-empty');
 return rows.map((values,index)=>{if(values.length!==headers.length)throw Error('CSV row has the wrong number of columns: '+(index+2));return Object.fromEntries(headers.map((h,i)=>[h,values[i]]))});
}
