import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for https://provinces.open-api.vn with 24h caching.
 *
 *   GET /api/locations?type=provinces&mode=v1|v2
 *   GET /api/locations?type=districts&code={provinceCode}          (v1 only)
 *   GET /api/locations?type=wards&mode=v2&code={provinceCode}      (after-merger)
 *   GET /api/locations?type=wards&mode=v1&code={districtCode}      (before-merger)
 *   GET /api/locations?type=convert&code={legacyWardCode}          (legacy ward -> 2025 ward)
 *
 * Always responds with a normalized shape: `{ items: { code: number; name: string }[] }`
 * (convert responds with `{ ward, province }`).
 */

const BASE = "https://provinces.open-api.vn/api";
const CACHE_SECONDS = 86400;

interface RawDivision {
  code: number;
  name: string;
  province_code?: number;
  districts?: RawDivision[];
  wards?: RawDivision[];
}

const FALLBACK_PROVINCES = [
  { code: 79, name: "Thành phố Hồ Chí Minh" },
  { code: 1, name: "Thành phố Hà Nội" },
  { code: 48, name: "Thành phố Đà Nẵng" },
  { code: 92, name: "Thành phố Cần Thơ" },
  { code: 31, name: "Thành phố Hải Phòng" },
];

async function upstream<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(5000),
    next: { revalidate: CACHE_SECONDS },
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return (await res.json()) as T;
}

const slim = (list: RawDivision[] | undefined) =>
  (list ?? []).map(({ code, name }) => ({ code, name }));

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const mode = sp.get("mode") === "v1" ? "v1" : "v2";
  const code = Number.parseInt(sp.get("code") ?? "", 10);

  try {
    if (type === "provinces") {
      const list = await upstream<RawDivision[]>(`/${mode}/p/`);
      // Ho Chi Minh City first (primary operating area), then alphabetical-as-served.
      const items = slim(list).sort((a, b) => Number(b.code === 79) - Number(a.code === 79));
      return json({ items });
    }

    if (type === "districts" && Number.isFinite(code)) {
      const data = await upstream<RawDivision>(`/v1/p/${code}?depth=2`);
      return json({ items: slim(data.districts) });
    }

    if (type === "wards" && Number.isFinite(code)) {
      const data =
        mode === "v2"
          ? await upstream<RawDivision>(`/v2/p/${code}?depth=2`)
          : await upstream<RawDivision>(`/v1/d/${code}?depth=2`);
      return json({ items: slim(data.wards) });
    }

    if (type === "convert" && Number.isFinite(code)) {
      const result = await upstream<{ source_code: number; ward: RawDivision }[]>(
        `/v2/w/from-legacy/?legacy_code=${code}`,
      );
      const ward = result[0]?.ward;
      if (!ward) return json({ error: "Không tìm thấy đơn vị mới tương ứng." }, 404);
      const province = ward.province_code
        ? await upstream<RawDivision>(`/v2/p/${ward.province_code}`)
        : null;
      return json({
        ward: { code: ward.code, name: ward.name },
        province: province ? { code: province.code, name: province.name } : null,
      });
    }

    return json({ error: "Tham số không hợp lệ." }, 400);
  } catch {
    if (type === "provinces") {
      return json({ items: FALLBACK_PROVINCES, fallback: true });
    }
    return json({ error: "Không tải được dữ liệu địa giới. Hãy nhập tay." }, 502);
  }
}
