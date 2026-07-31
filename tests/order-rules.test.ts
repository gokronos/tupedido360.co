import assert from "node:assert/strict";
import test from "node:test";
import {canTransition} from "../lib/order-rules.ts";

test("requires sequential preparation states",()=>{assert.equal(canTransition("received","preparing","pickup",false),false);assert.equal(canTransition("received","accepted","pickup",false),true)});
test("does not deliver unpaid orders",()=>{assert.equal(canTransition("ready","delivered","pickup",false),false);assert.equal(canTransition("ready","delivered","pickup",true),true)});
test("only deliveries can go on the road",()=>{assert.equal(canTransition("ready","on_way","pickup",true),false);assert.equal(canTransition("ready","on_way","delivery",true),true)});
test("final states cannot reopen",()=>{assert.equal(canTransition("delivered","received","pickup",true),false);assert.equal(canTransition("cancelled","accepted","pickup",false),false)});
