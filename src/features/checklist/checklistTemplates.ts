import type { AssigneeType } from "@/types/domain";

export interface ChecklistTemplateItem {
  title: string;
  description: string;
  daysBeforeWedding: number;
  assignee: AssigneeType;
}

export const weddingChecklistTemplate: ChecklistTemplateItem[] = [
  { title: "예식장 후보 정리", description: "지역, 보증 인원, 식대 기준으로 후보를 정리하세요.", daysBeforeWedding: 300, assignee: "shared" },
  { title: "웨딩홀 투어 예약", description: "방문 일정과 상담 담당자를 기록하세요.", daysBeforeWedding: 270, assignee: "shared" },
  { title: "스드메 계약 확인", description: "포함 상품, 추가금, 촬영일을 확인하세요.", daysBeforeWedding: 240, assignee: "bride" },
  { title: "본식 스냅/영상 예약", description: "계약금, 잔금일, 납품 범위를 기록하세요.", daysBeforeWedding: 210, assignee: "shared" },
  { title: "예복/드레스 일정 확정", description: "피팅일과 최종 가봉일을 캘린더에 연결하세요.", daysBeforeWedding: 150, assignee: "shared" },
  { title: "청첩장 제작", description: "모바일/종이 청첩장 문구와 발송 대상을 정리하세요.", daysBeforeWedding: 100, assignee: "shared" },
  { title: "혼주 일정 확인", description: "혼주 의상, 메이크업, 이동 일정을 확인하세요.", daysBeforeWedding: 80, assignee: "shared" },
  { title: "식순과 사회자 큐시트 정리", description: "축사, 축가, 행진곡, 이벤트 순서를 확정하세요.", daysBeforeWedding: 45, assignee: "groom" },
  { title: "최종 잔금 확인", description: "예식 전 결제해야 할 잔금을 모두 확인하세요.", daysBeforeWedding: 14, assignee: "shared" },
  { title: "예식 전날 준비물 점검", description: "반지, 혼인서약서, 사례비, 비상 키트를 확인하세요.", daysBeforeWedding: 1, assignee: "shared" }
];

