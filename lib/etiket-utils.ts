import type { LabelElement } from "./etiket-types";

// ── Template İşleme (Placeholder → Değer) ──────────────────────────────────

/**
 * Şablon içindeki {alan} ve {alan|transform} ifadelerini kitap verileriyle doldurur.
 */
export function processTemplate(
    template: string,
    data: Record<string, string>
): string {
    return template.replace(/\{([^}]+)\}/g, (_match, expr: string) => {
        const parts = expr.split("|").map((p: string) => p.trim());
        const field = parts[0];
        let value = data[field] ?? "";

        for (let i = 1; i < parts.length; i++) {
            const transform = parts[i];
            const colonIdx = transform.indexOf(":");
            const fn = colonIdx >= 0 ? transform.substring(0, colonIdx) : transform;
            const arg = colonIdx >= 0 ? transform.substring(colonIdx + 1) : "";

            switch (fn) {
                case "upper":
                    value = value.toUpperCase();
                    break;
                case "lower":
                    value = value.toLowerCase();
                    break;
                case "trim":
                    value = value.trim();
                    break;
                case "truncate": {
                    const n = parseInt(arg) || 20;
                    if (value.length > n) value = value.substring(0, n) + "…";
                    break;
                }
                case "split": {
                    const idx = parseInt(arg) || 0;
                    const splitParts = value.split(" ");
                    value = splitParts[idx] ?? "";
                    break;
                }
                case "splitBy": {
                    const [sep, idxStr] = arg.split(":");
                    const idx2 = parseInt(idxStr) || 0;
                    const parts2 = value.split(sep || " ");
                    value = parts2[idx2] ?? "";
                    break;
                }
                case "first": {
                    const items = value.split(",").map((s) => s.trim());
                    value = items[0] ?? "";
                    break;
                }
                case "last": {
                    const items = value.split(",").map((s) => s.trim());
                    value = items[items.length - 1] ?? "";
                    break;
                }
                case "initials":
                    value = value
                        .split(" ")
                        .map((w) => w[0] ?? "")
                        .join("");
                    break;
            }
        }

        return value;
    });
}

// ── Kitap Verisini Placeholder Map'e Dönüştür ──────────────────────────────

export function bookToPlaceholders(
    book: Record<string, unknown>,
    kutuphane?: { adi?: string; kodu?: string }
): Record<string, string> {
    return {
        baslik: String(book.baslik ?? ""),
        yazarlar: String(book.yazarlar ?? ""),
        isbn: String(book.isbn ?? ""),
        barkod: String(book.barkod ?? ""),
        demirbasNo: String(book.demirbasNo ?? ""),
        yayinevi: String(book.yayinevi ?? ""),
        yayinYili: String(book.yayinYili ?? ""),
        dil: String(book.dil ?? ""),
        sayfaSayisi: String(book.sayfaSayisi ?? ""),
        kutuphaneAdi: String(kutuphane?.adi ?? book.kutuphaneAdi ?? ""),
        kutuphaneKodu: String(kutuphane?.kodu ?? book.kutuphaneKodu ?? ""),
        uuid: String(book.uuid ?? ""),
    };
}

// ── Eleman Validasyonu ─────────────────────────────────────────────────────

export function validateElement(el: LabelElement, labelW: number, labelH: number): string[] {
    const errors: string[] = [];
    if (el.x < 0) errors.push("X negatif olamaz");
    if (el.y < 0) errors.push("Y negatif olamaz");
    if (el.width <= 0) errors.push("Genişlik 0'dan büyük olmalı");
    if (el.height < 0) errors.push("Yükseklik negatif olamaz");
    if (el.x + el.width > labelW + 0.5) errors.push("Eleman etiket dışına taşıyor (yatay)");
    if (el.y + el.height > labelH + 0.5) errors.push("Eleman etiket dışına taşıyor (dikey)");
    if ((el.type === "text" || el.type === "barcode" || el.type === "qrcode") && !el.content) {
        errors.push("İçerik boş olamaz");
    }
    return errors;
}

// ── mm ↔ px dönüşüm (96 DPI) ───────────────────────────────────────────────

export const MM_TO_PX = 3.7795275591; // 1mm = 96/25.4 px

export function mmToPx(mm: number, scale: number = 1): number {
    return mm * MM_TO_PX * scale;
}
