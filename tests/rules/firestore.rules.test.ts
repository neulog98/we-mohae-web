import { afterEach, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeEach(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: `woori-mwohae-test-${Date.now()}`,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8")
    }
  });
});

afterEach(async () => {
  await testEnv?.cleanup();
});

describe.sequential("firestore security rules", () => {
  it("allows users to read their own profile and blocks unrelated profiles", async () => {
    const alice = testEnv.authenticatedContext("profileAlice").firestore();
    const bob = testEnv.authenticatedContext("profileBob").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/profileAlice"), { uid: "profileAlice" });
    });

    await assertSucceeds(getDoc(doc(alice, "users/profileAlice")));
    await assertFails(getDoc(doc(bob, "users/profileAlice")));
  });

  it("allows connected partners to read each other's profile", async () => {
    const alice = testEnv.authenticatedContext("partnerAlice").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();
      await setDoc(doc(firestore, "couples/couplePartners"), {
        coupleId: "couplePartners",
        mode: "wedding",
        memberIds: ["partnerAlice", "partnerBob"]
      });
      await setDoc(doc(firestore, "users/partnerBob"), {
        uid: "partnerBob",
        coupleId: "couplePartners",
        displayName: "파트너",
        email: "partner@example.com"
      });
    });

    await assertSucceeds(getDoc(doc(alice, "users/partnerBob")));
  });

  it("allows a connected member to leave into a new personal couple", async () => {
    const alice = testEnv.authenticatedContext("leaveAlice").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();
      await setDoc(doc(firestore, "couples/sharedCouple"), {
        coupleId: "sharedCouple",
        mode: "wedding",
        memberIds: ["leaveAlice", "leaveBob"],
        inviteCode: "OLDINVITE"
      });
      await setDoc(doc(firestore, "users/leaveAlice"), {
        uid: "leaveAlice",
        coupleId: "sharedCouple",
        mode: "wedding"
      });
      await setDoc(doc(firestore, "inviteCodes/OLDINVITE"), {
        coupleId: "sharedCouple",
        createdBy: "leaveAlice"
      });
      await setDoc(doc(firestore, "couples/sharedCouple/fcmTokens/aliceToken"), {
        token: "aliceToken",
        userId: "leaveAlice",
        platform: "android"
      });
    });

    const batch = writeBatch(alice);
    batch.update(doc(alice, "couples/sharedCouple"), {
      memberIds: ["leaveBob"],
      inviteCode: "BOBNEWCODE"
    });
    batch.delete(doc(alice, "inviteCodes/OLDINVITE"));
    batch.set(doc(alice, "inviteCodes/BOBNEWCODE"), {
      coupleId: "sharedCouple",
      createdBy: "leaveAlice"
    });
    batch.set(doc(alice, "couples/aliceNewCouple"), {
      coupleId: "aliceNewCouple",
      mode: "wedding",
      memberIds: ["leaveAlice"],
      inviteCode: "ALICENEW",
      createdBy: "leaveAlice"
    });
    batch.set(doc(alice, "inviteCodes/ALICENEW"), {
      coupleId: "aliceNewCouple",
      createdBy: "leaveAlice"
    });
    batch.update(doc(alice, "users/leaveAlice"), {
      coupleId: "aliceNewCouple",
      mode: "wedding"
    });
    batch.delete(doc(alice, "couples/sharedCouple/fcmTokens/aliceToken"));

    await assertSucceeds(batch.commit());
  });

  it("blocks budget access for couple mode", async () => {
    const alice = testEnv.authenticatedContext("budgetAlice").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "couples/coupleA"), {
        coupleId: "coupleA",
        mode: "couple",
        memberIds: ["budgetAlice"]
      });
    });

    await assertFails(setDoc(doc(alice, "couples/coupleA/budgets/budgetA"), { title: "웨딩홀" }));
  });
});
