export const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);

export const formatDate = (value?: string | null) => {
  if (!value) return 'Sem vencimento';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const maybeAxiosError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = maybeAxiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || fallback;
};
