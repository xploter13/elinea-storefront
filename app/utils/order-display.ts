const orderStatuses: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Em preparação',
  order_shipped: 'Enviado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export function orderStatusLabel(status: string): string {
  return orderStatuses[status] || status.replaceAll('_', ' ')
}
