import dayjs from 'dayjs';
import 'dayjs/locale/ko';

export function formatGameDate(value: string) {
  const date = dayjs(value);
  return date.isValid() ? date.locale('ko').format('YYYY. M. D.') : '날짜 없음';
}
