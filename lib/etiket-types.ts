// ── Etiket Tasarım Tipleri ──────────────────────────────────────────────────

export type ElementType = "text" | "barcode" | "qrcode" | "line" | "rectangle";

export type BarcodeFormat = "CODE128" | "CODE39" | "EAN13" | "EAN8";

export type TextAlign = "left" | "center" | "right";

export type FontWeight = "normal" | "bold";

export type PrinterType = "ETIKET_YAZICI" | "A4";

export interface LabelElement {
    id: string;
    type: ElementType;
    x: number; // mm
    y: number; // mm
    width: number; // mm
    height: number; // mm

    // Text
    content?: string; // template: {baslik}, {barkod|upper}, vb.
    fontSize?: number; // pt
    fontWeight?: FontWeight;
    fontStyle?: "normal" | "italic";
    textAlign?: TextAlign;
    color?: string;
    maxLines?: number;

    // Barcode
    barcodeFormat?: BarcodeFormat;
    showText?: boolean;
    barcodeRotation?: 0 | 90; // 0=yatay, 90=dikey

    // QR
    errorLevel?: "L" | "M" | "Q" | "H";

    // Line
    direction?: "horizontal" | "vertical";
    lineWidth?: number; // pt
    lineColor?: string;

    // Rectangle
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
}

export interface LabelTemplate {
    elements: LabelElement[];
}

// ── Kitap Alanları (Placeholder) ────────────────────────────────────────────

export interface BookField {
    key: string;
    label: string;
    example: string;
}

export const BOOK_FIELDS: BookField[] = [
    { key: "baslik", label: "Başlık", example: "Savaş ve Barış" },
    { key: "yazarlar", label: "Yazarlar", example: "Tolstoy, Lev Nikolayeviç" },
    { key: "isbn", label: "ISBN", example: "978-975-07-0348-4" },
    { key: "barkod", label: "Barkod", example: "BRK-000001" },
    { key: "demirbasNo", label: "Demirbaş No", example: "DMB-2024-001" },
    { key: "yayinevi", label: "Yayınevi", example: "Can Yayınları" },
    { key: "yayinYili", label: "Yayın Yılı", example: "2020" },
    { key: "dil", label: "Dil", example: "Türkçe" },
    { key: "sayfaSayisi", label: "Sayfa Sayısı", example: "1225" },
    { key: "kutuphaneAdi", label: "Kütüphane Adı", example: "Merkez Kütüphane" },
    { key: "kutuphaneKodu", label: "Kütüphane Kodu", example: "MRK001" },
    { key: "uuid", label: "UUID", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
];

export const SAMPLE_BOOK: Record<string, string> = Object.fromEntries(
    BOOK_FIELDS.map((f) => [f.key, f.example])
);

/** Format-specific sample barcode values for design preview */
export const BARCODE_SAMPLE_VALUES: Record<string, string> = {
    CODE128: "BRK-000001",
    CODE39: "BRK-000001",
    EAN13: "9789750730481",
    EAN8: "97897507",
};

export function getSampleBarcodeValue(format: string): string {
    return BARCODE_SAMPLE_VALUES[format] || "BRK-000001";
}

// ── Transform Fonksiyonları ─────────────────────────────────────────────────

export interface TransformDef {
    key: string;
    label: string;
    hasParam?: boolean;
    placeholder?: string;
}

export const TRANSFORMS: TransformDef[] = [
    { key: "upper", label: "Büyük Harf" },
    { key: "lower", label: "Küçük Harf" },
    { key: "truncate", label: "Kısalt", hasParam: true, placeholder: "20" },
    { key: "split", label: "Böl (boşluk)", hasParam: true, placeholder: "0" },
    { key: "splitBy", label: "Böl (karakter)", hasParam: true, placeholder: "-:0" },
    { key: "first", label: "İlk Öğe" },
    { key: "last", label: "Son Öğe" },
    { key: "initials", label: "Baş Harfler" },
    { key: "trim", label: "Boşluk Temizle" },
];

// ── Varsayılan Eleman Değerleri ─────────────────────────────────────────────

export function defaultTextElement(): LabelElement {
    return {
        id: crypto.randomUUID(),
        type: "text",
        x: 2,
        y: 2,
        width: 40,
        height: 6,
        content: "{baslik}",
        fontSize: 8,
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "left",
        color: "#000000",
        maxLines: 1,
    };
}

export function defaultBarcodeElement(): LabelElement {
    return {
        id: crypto.randomUUID(),
        type: "barcode",
        x: 5,
        y: 10,
        width: 50,
        height: 12,
        content: "{barkod}",
        barcodeFormat: "CODE128",
        showText: true,
        barcodeRotation: 0,
    };
}

export function defaultQRElement(): LabelElement {
    return {
        id: crypto.randomUUID(),
        type: "qrcode",
        x: 2,
        y: 2,
        width: 15,
        height: 15,
        content: "{uuid}",
        errorLevel: "M",
    };
}

export function defaultLineElement(): LabelElement {
    return {
        id: crypto.randomUUID(),
        type: "line",
        x: 0,
        y: 15,
        width: 70,
        height: 0,
        direction: "horizontal",
        lineWidth: 0.3,
        lineColor: "#000000",
    };
}

export function defaultRectangleElement(): LabelElement {
    return {
        id: crypto.randomUUID(),
        type: "rectangle",
        x: 1,
        y: 1,
        width: 68,
        height: 28,
        borderWidth: 0.3,
        borderColor: "#000000",
        backgroundColor: "transparent",
    };
}

// ── Preset Etiket Boyutları ─────────────────────────────────────────────────

export const LABEL_PRESETS = [
    { name: "Küçük Sırt Etiketi", width: 25, height: 70 },
    { name: "Standart Etiket", width: 70, height: 30 },
    { name: "Geniş Etiket", width: 100, height: 40 },
    { name: "Kare Etiket", width: 50, height: 50 },
    { name: "Barkod Etiketi (58mm)", width: 58, height: 30 },
    { name: "Barkod Etiketi (80mm)", width: 80, height: 40 },
];

export const A4_PRESETS = [
    { name: "3×10 (70×29.7mm — Avery L7158)", rows: 10, cols: 3, labelW: 70, labelH: 29.7, top: 0, left: 0, rowGap: 0, colGap: 0 },
    { name: "3×8 (70×36mm — Avery L7160)", rows: 8, cols: 3, labelW: 70, labelH: 36, top: 4.5, left: 0, rowGap: 0, colGap: 0 },
    { name: "2×7 (99.1×38.1mm — Avery L7163)", rows: 7, cols: 2, labelW: 99.1, labelH: 38.1, top: 10.7, left: 4.7, rowGap: 0, colGap: 2.5 },
    { name: "2×4 (99.1×67.7mm)", rows: 4, cols: 2, labelW: 99.1, labelH: 67.7, top: 10, left: 4.7, rowGap: 0, colGap: 2.5 },
];
