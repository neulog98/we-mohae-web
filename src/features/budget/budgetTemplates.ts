import type { BudgetCategory, PayerType } from "@/types/domain";

export interface BudgetTemplateItem {
  title: string;
  category: BudgetCategory;
  subCategory: string;
  estimatedAmount: number;
  payer: PayerType;
}

export const weddingBudgetTemplate: BudgetTemplateItem[] = [
  { title: "웨딩홀 계약", category: "웨딩홀", subCategory: "대관료", estimatedAmount: 12000000, payer: "shared" },
  { title: "식대", category: "웨딩홀", subCategory: "식대", estimatedAmount: 18000000, payer: "shared" },
  { title: "스드메 패키지", category: "스드메", subCategory: "패키지 추가금", estimatedAmount: 3500000, payer: "bride" },
  { title: "본식 드레스", category: "드레스", subCategory: "본식 드레스", estimatedAmount: 1500000, payer: "bride" },
  { title: "본식 스냅", category: "사진", subCategory: "본식 스냅", estimatedAmount: 1800000, payer: "shared" },
  { title: "영상", category: "사진", subCategory: "영상", estimatedAmount: 1200000, payer: "shared" },
  { title: "신랑 예복", category: "예복", subCategory: "맞춤 예복", estimatedAmount: 1200000, payer: "groom" },
  { title: "웨딩링", category: "예물", subCategory: "웨딩링", estimatedAmount: 2500000, payer: "shared" },
  { title: "신혼여행 항공", category: "신혼여행", subCategory: "항공", estimatedAmount: 2500000, payer: "shared" },
  { title: "청첩장/답례품", category: "기타", subCategory: "청첩장", estimatedAmount: 800000, payer: "shared" }
];
