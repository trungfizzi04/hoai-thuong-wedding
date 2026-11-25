"use client";

import * as React from "react";
import { ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SelectOption } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

type Mode = "v2" | "v1" | "manual";

interface FetchState {
  url: string;
  options: SelectOption[];
  error?: string;
}

/** Fetches `{ items: {code,name}[] }` from the internal proxy; loading is derived (no sync setState in effect). */
function useOptions(url: string | null) {
  const [state, setState] = React.useState<FetchState | null>(null);

  React.useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((d: { items?: { code: number; name: string }[]; error?: string }) => {
        if (cancelled) return;
        setState({
          url,
          options: (d.items ?? []).map((i) => ({ value: String(i.code), label: i.name })),
          error: d.error,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ url, options: [], error: "Không tải được dữ liệu. Hãy nhập tay." });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const ready = url !== null && state?.url === url;
  return {
    options: ready && state ? state.options : [],
    loading: url !== null && !ready,
    error: ready ? state?.error : undefined,
  };
}

const MODES: { id: Mode; label: string }[] = [
  { id: "v2", label: "Sau sáp nhập (2025)" },
  { id: "v1", label: "Trước sáp nhập" },
  { id: "manual", label: "Nhập tay" },
];

const labelOf = (options: SelectOption[], value: string) =>
  options.find((o) => o.value === value)?.label ?? "";

export function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = React.useState<Mode>(value ? "manual" : "v2");
  const [province, setProvince] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [ward, setWard] = React.useState("");
  const [converting, setConverting] = React.useState(false);
  const [convertError, setConvertError] = React.useState<string | null>(null);

  const provincesUrl = mode === "manual" ? null : `/api/locations?type=provinces&mode=${mode}`;
  const districtsUrl = mode === "v1" && province ? `/api/locations?type=districts&code=${province}` : null;
  const wardsUrl =
    mode === "v2" && province
      ? `/api/locations?type=wards&mode=v2&code=${province}`
      : mode === "v1" && district
        ? `/api/locations?type=wards&mode=v1&code=${district}`
        : null;

  const provinces = useOptions(provincesUrl);
  const districts = useOptions(districtsUrl);
  const wards = useOptions(wardsUrl);

  function switchMode(next: Mode) {
    setMode(next);
    setProvince("");
    setDistrict("");
    setWard("");
    setConvertError(null);
  }

  function pickWard(code: string) {
    setWard(code);
    const w = labelOf(wards.options, code);
    const p = labelOf(provinces.options, province);
    const d = labelOf(districts.options, district);
    onChange(mode === "v1" ? [w, d, p].filter(Boolean).join(", ") : [w, p].filter(Boolean).join(", "));
  }

  async function convertToNew() {
    setConverting(true);
    setConvertError(null);
    try {
      const res = await fetch(`/api/locations?type=convert&code=${ward}`);
      const data = (await res.json()) as {
        ward?: { name: string };
        province?: { name: string } | null;
        error?: string;
      };
      if (!res.ok || !data.ward) {
        setConvertError(data.error ?? "Không quy đổi được.");
        return;
      }
      onChange([data.ward.name, data.province?.name].filter(Boolean).join(", "));
      switchMode("manual");
    } catch {
      setConvertError("Không kết nối được dịch vụ quy đổi.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Kiểu địa chỉ" className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => switchMode(m.id)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors",
              mode === m.id
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-secondary hover:bg-sage-soft",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "manual" ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="VD: Phường Bến Nghé, Thành phố Hồ Chí Minh"
        />
      ) : (
        <div className={cn("grid gap-3", mode === "v1" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          <SearchableSelect
            options={provinces.options}
            value={province}
            loading={provinces.loading}
            placeholder="Tỉnh / Thành phố"
            onChange={(v) => {
              setProvince(v);
              setDistrict("");
              setWard("");
              onChange("");
            }}
          />
          {mode === "v1" ? (
            <SearchableSelect
              options={districts.options}
              value={district}
              loading={districts.loading}
              disabled={!province}
              placeholder="Quận / Huyện"
              onChange={(v) => {
                setDistrict(v);
                setWard("");
                onChange("");
              }}
            />
          ) : null}
          <SearchableSelect
            options={wards.options}
            value={ward}
            loading={wards.loading}
            disabled={mode === "v1" ? !district : !province}
            placeholder="Phường / Xã"
            onChange={pickWard}
          />
        </div>
      )}

      {provinces.error || districts.error || wards.error ? (
        <p className="text-xs text-rose-700 dark:text-rose-300">
          {provinces.error ?? districts.error ?? wards.error}
        </p>
      ) : null}

      {mode === "v1" && ward ? (
        <button
          type="button"
          onClick={convertToNew}
          disabled={converting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-sage-soft disabled:opacity-50"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          {converting ? "Đang quy đổi..." : "Quy đổi sang địa chỉ mới (2025)"}
        </button>
      ) : null}
      {convertError ? <p className="text-xs text-rose-700 dark:text-rose-300">{convertError}</p> : null}

      {mode !== "manual" && value ? (
        <p className="text-xs text-ink-secondary">
          Đã chọn: <strong className="text-ink">{value}</strong>
        </p>
      ) : null}
    </div>
  );
}
