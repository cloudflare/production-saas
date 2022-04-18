import test from "ava";
import { getMiniflare, getJwt, getUser } from '../fixtures/util.js'


test.beforeEach((t) => {
    // Create a new Miniflare environment for each test
    const uid = 1071
    const salt = 1000
    const mf = getMiniflare()
    const token = getJwt(uid, salt)
    t.context = { mf, token, uid, salt };
});

test("load spaces when none are created for user", async (t) => {
    //GIVEN
    const { mf, token, uid, salt } = t.context;
    const ns = await mf.getKVNamespace("DATABASE");
    const user = getUser(uid, salt)
    await ns.put(`users::${uid}`, JSON.stringify(user));

    //WHEN
    const res = await mf.dispatchFetch("http://localhost:8787/spaces", {
        headers: {
            "authorization": `bearer ${token}`,
        }
    });

    //THEN
    t.is(await res.text(), "[]")
    t.is(await res.status, 200)
});