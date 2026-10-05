import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "../src/server/db";
import {
  getOverview,
  getProfile,
  updateProfile,
} from "../src/features/account/account.service";

const suffix = randomUUID().replaceAll("-", "");
const ids: string[] = [];
const fields = { fullName: "Photo test", mobile: null };
try {
  for (let index = 0; index < 2; index++) {
    const user = await db.user.create({
      data: {
        username: `photo_test_${suffix}_${index}`,
        fullName: "Photo test",
        accountNumber: `photo-test-${suffix}-${index}`,
        pinHash: "test-only-not-a-valid-pin",
      },
    });
    ids.push(user.id);
  }
  const userId = ids[0]!;
  assert.equal((await getProfile(userId)).profilePhoto, null);
  for (const color of ["#71d5f3", "#6debbd"]) {
    const bytes = await sharp({
      create: { width: 320, height: 240, channels: 3, background: color },
    })
      .png()
      .toBuffer();
    await updateProfile(userId, {
      ...fields,
      profilePhoto: `data:image/png;base64,${bytes.toString("base64")}`,
    });
    const profile = await getProfile(userId);
    assert.ok(profile.profilePhoto?.startsWith("data:image/webp;base64,"));
    assert.equal(
      (await getOverview(userId)).profilePhoto,
      profile.profilePhoto,
    );
  }
  const saved = (await getProfile(userId)).profilePhoto;
  await updateProfile(userId, { ...fields, fullName: "Photo test" });
  assert.equal((await getProfile(userId)).profilePhoto, saved);
  await assert.rejects(
    updateProfile(userId, {
      ...fields,
      fullName: "Must not save",
      profilePhoto: "data:image/png;base64,AAAA",
    }),
  );
  assert.equal((await getProfile(userId)).fullName, "Photo test");
  assert.equal((await getProfile(userId)).profilePhoto, saved);
  assert.equal((await getProfile(ids[1]!)).profilePhoto, null);
  await updateProfile(userId, { ...fields, profilePhoto: null });
  assert.equal((await getProfile(userId)).profilePhoto, null);
  console.log(
    "Profile photo integration passed: saved/replaced/removed photos, dashboard visibility, preservation when omitted, rejected-upload rollback, and account isolation.",
  );
} finally {
  if (ids.length) await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
}
