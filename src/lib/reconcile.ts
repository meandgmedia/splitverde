export type CommissionRow = { policy: string; amountCents: number };
export type Result = { policy: string; expectedCents: number; paidCents: number; differenceCents: number; status: 'matched'|'underpaid'|'overpaid'|'missing'|'unexpected' };
export function parseCsv(input: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  for (let i=0;i<input.length;i++) { const c=input[i];
    if (c==='"') { if(quoted && input[i+1]==='"'){field+='"';i++;} else quoted=!quoted; }
    else if(c===',' && !quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw new Error('CSV contains an unclosed quoted field.');
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
export function parseCommissions(csv:string): CommissionRow[] {
  if(csv.length>500_000)throw new Error('CSV exceeds the 500 KB demo limit.');
  const rows=parseCsv(csv); if(!rows.length)throw new Error('CSV is empty.');
  const headers=rows[0].map(h=>h.trim().toLowerCase().replace(/^\uFEFF/,''));
  const policyIndex=headers.indexOf('policy');const amountIndex=headers.indexOf('amount');
  if(policyIndex<0||amountIndex<0)throw new Error('CSV needs policy,amount headers.');
  if(rows.length>5001)throw new Error('Demo limit is 5,000 rows per file.');
  return rows.slice(1).map((row,i)=>{
    const policy=(row[policyIndex]||'').trim();
    const amount=(row[amountIndex]||'').trim().replace(/^\$/,'');
    if(!policy)throw new Error('Row '+(i+2)+': missing policy.');
    if(!/^-?\d+(?:\.\d{1,2})?$/.test(amount))throw new Error('Row '+(i+2)+': invalid amount.');
    const [whole,decimal='']=amount.split('.');
    const cents=(whole.startsWith('-')?-1:1)*(Math.abs(Number(whole))*100+Number(decimal.padEnd(2,'0')));
    if(!Number.isSafeInteger(cents))throw new Error('Row '+(i+2)+': amount too large.');
    return {policy,amountCents:cents};
  });
}
export function reconcile(expected:CommissionRow[],actual:CommissionRow[]):Result[]{
  const totals=(rows:CommissionRow[])=>{const map=new Map<string,number>();for(const r of rows)map.set(r.policy,(map.get(r.policy)||0)+r.amountCents);return map;};
  const e=totals(expected),a=totals(actual);
  return [...new Set([...e.keys(),...a.keys()])].sort().map(policy=>{
    const expectedCents=e.get(policy)||0,paidCents=a.get(policy)||0,differenceCents=paidCents-expectedCents;
    const status:Result['status']=!e.has(policy)?'unexpected':!a.has(policy)?'missing':differenceCents===0?'matched':differenceCents<0?'underpaid':'overpaid';
    return {policy,expectedCents,paidCents,differenceCents,status};
  });
}
