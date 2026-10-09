// Run with: node --experimental-strip-types --test src/lib/reconcile.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCommissions,reconcile} from './reconcile.ts';
test('detects underpayment, missing, unexpected and exact matches',()=>{
 const expected=parseCommissions('policy,amount\nA,10.00\nB,20.00\nC,5.00');
 const actual=parseCommissions('policy,amount\nA,10.00\nB,18.00\nD,2.00');
 assert.deepEqual(reconcile(expected,actual).map(x=>x.status),['matched','underpaid','missing','unexpected']);
});
test('aggregates multiple transactions for one policy',()=>{
 const result=reconcile(parseCommissions('policy,amount\nA,10.00'),parseCommissions('policy,amount\nA,4.00\nA,6.00'));
 assert.equal(result[0].status,'matched');
});
test('parses quoted policy IDs and rejects invalid money',()=>{
 assert.equal(parseCommissions('policy,amount\n"A, B",1.25')[0].policy,'A, B');
 assert.throws(()=>parseCommissions('policy,amount\nA,1.234'));
});
