export function getHttpError(status: number): string {
  switch (status) {
    case 401: return 'Токен доступа не принят. Проверьте apiTokenInstance.'
    case 403: return 'Доступ запрещён. Проверьте ID инстанса и токен доступа.'
    case 404: return 'Ресурс не найден. Проверьте ID инстанса и адрес API.'
    case 429: return 'Слишком много запросов. Подождите немного и повторите попытку.'
    default: return status >= 500
      ? 'Сервис GREEN-API временно недоступен. Попробуйте позже.'
      : 'Не удалось выполнить запрос. Проверьте данные и состояние инстанса в личном кабинете.'
  }
}
