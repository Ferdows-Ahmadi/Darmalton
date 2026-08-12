import assert from "node:assert/strict";
import test from "node:test";
import { inventoryActionPayload, inventoryStatusLabel } from "../lib/staff-inventory.ts";

test("inventory actions produce service endpoint payloads without direct quantity fields",()=>{
 assert.deepEqual(inventoryActionPayload("verify",{physical_quantity:"4",notes:"count"}),{physical_quantity:4,notes:"count"});
 assert.deepEqual(inventoryActionPayload("inspect",{decision:"QUARANTINED",notes:"seal"}),{decision:"QUARANTINED",notes:"seal"});
 assert.deepEqual(inventoryActionPayload("adjust",{transaction_type:"DAMAGE",direction:"DEDUCTION",quantity:"2",reference:"D-1",notes:"broken"}),{transaction_type:"DAMAGE",direction:"DEDUCTION",quantity:2,reference:"D-1",notes:"broken"});
});
test("inventory statuses have operator-readable Dari labels",()=>assert.equal(inventoryStatusLabel("STOCK_VERIFICATION"),"شمارش فیزیکی"));
