import { NextRequest, NextResponse } from "next/server";
import { vkFetch } from "@/lib/vk";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, userId, message } = (await req.json()) as {
      token?: string;
      userId: number;
      message: string;
    };

    if (!userId || !message) {
      return NextResponse.json({ error: "userId ? message ???????????" }, { status: 400 });
    }

    const authToken = token || process.env.VK_TOKEN;
    if (!authToken) {
      return NextResponse.json({ error: "VK ????? ?? ?????" }, { status: 400 });
    }

    const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    const sendRes = await vkFetch<{ peer_id: number; message_id: number }>(
      "messages.send",
      {
        random_id: randomId,
        user_id: userId,
        message,
      },
      authToken
    );

    if ("error" in sendRes) {
      return NextResponse.json({ error: sendRes.error.error_msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: sendRes.response });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
