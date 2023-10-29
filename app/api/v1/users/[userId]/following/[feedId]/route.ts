import db from "@/lib/db";
import { userFeed } from "@/lib/db/schema";
import { resourceNotFound } from "@/lib/utils/api";
import { getCount } from "@/lib/utils/db";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { NextRequest, NextResponse } from "next/server";

// Follow
export async function POST(
  req: NextRequest,
  { params }: { params: { feedId: string; userId: string } }
) {
  let body = { feedId: params.feedId, userId: params.userId };
  const validator = createInsertSchema(userFeed).safeParse({
    ...body,
  });

  if (validator.success === false) {
    return NextResponse.json(validator.error, { status: 400 });
  }

  // Confirm user exists
  const userExists = await getCount("user", "id", params.userId);
  if (!userExists) {
    return resourceNotFound("user", params.userId);
  }

  // Confirm feed exists
  const feedExists = await getCount("feed", "id", params.feedId);
  if (!feedExists) {
    return resourceNotFound("feed", params.feedId);
  }

  const res = await db
    .insert(userFeed)
    .values({ ...body })
    .returning({ userId: userFeed.userId, feedId: userFeed.feedId });

  return NextResponse.json(res, { status: 201 });
}

// Unfollow
export async function DELETE(
  req: NextRequest,
  { params }: { params: { feedId: string; userId: string } }
) {
  // Confirm user exists
  const userExists = await getCount("user", "id", params.userId);
  if (!userExists) {
    return resourceNotFound("user", params.userId);
  }

  // Confirm feed exists
  const feedExists = await getCount("feed", "id", params.feedId);
  if (!feedExists) {
    return resourceNotFound("feed", params.feedId);
  }

  const res = await db
    .delete(userFeed)
    .where(
      and(
        eq(userFeed.userId, params.userId),
        eq(userFeed.feedId, params.feedId)
      )
    )
    .returning({ id: userFeed.feedId });

  return NextResponse.json(res[0]);
}
