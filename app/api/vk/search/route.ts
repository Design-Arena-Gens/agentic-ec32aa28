import { NextRequest, NextResponse } from "next/server";
import { resolveCityIdByName, vkFetch } from "@/lib/vk";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, q, city } = (await req.json()) as {
      token?: string;
      q: string;
      city?: string;
    };

    if (!q || typeof q !== "string") {
      return NextResponse.json({ error: "??????????? ???????? q" }, { status: 400 });
    }

    const authToken = token || process.env.VK_TOKEN;

    let cityId: number | undefined = undefined;
    if (city && city.trim()) {
      cityId = await resolveCityIdByName(city.trim(), authToken);
    }

    const searchRes = await vkFetch<{
      count: number;
      items: Array<{
        id: number;
        first_name: string;
        last_name: string;
        domain?: string;
        photo_100?: string;
        about?: string;
        can_write_private_message?: number;
        city?: { id: number; title: string };
      }>;
    }>(
      "users.search",
      {
        q,
        count: 50,
        fields: [
          "domain",
          "photo_100",
          "about",
          "can_write_private_message",
          "city"
        ].join(","),
        city: cityId,
      },
      authToken
    );

    if ("error" in searchRes) {
      return NextResponse.json({ error: searchRes.error.error_msg }, { status: 400 });
    }

    // ??????? ?????????? ?? ?????????????
    const keywords = ["???????", "???????", "????", "nail", "????????", "????????"];
    const users = (searchRes.response.items || []).filter((u) => {
      const hay = `${u.first_name} ${u.last_name} ${u.about || ""}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    });

    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
