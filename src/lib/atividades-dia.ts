export const ATIVIDADES_DO_DIA: string[] = [
  "Grave um vídeo curto de um corte de hoje pra postar nas redes sociais.",
  "Limpe e organize sua cadeira e sua estação de trabalho.",
  "Afie ou troque as lâminas/tesouras que já estão precisando.",
  "Mande mensagem pra 2 clientes que não vêm há um tempo, chamando pra voltar.",
  "Tire uma foto de um antes/depois pra postar no Instagram da barbearia.",
  "Organize os produtos e materiais da sua bancada.",
  "Peça avaliação pra pelo menos 1 cliente que atendeu hoje.",
  "Limpe as máquinas e ferramentas com cuidado.",
  "Grave um vídeo curto explicando alguma dica de cuidado com o cabelo/barba.",
  "Revise sua agenda da semana e confirme os horários com os clientes.",
  "Organize o estoque de produtos usados no seu posto de trabalho.",
  "Poste uma foto ou story mostrando o dia de trabalho.",
  "Limpe o espelho e a bancada da sua cadeira.",
  "Anote o nome de um cliente novo de hoje pra lembrar no próximo atendimento.",
  "Verifique se os produtos que você usa não estão acabando.",
];

export function atividadeDoDia(data: Date = new Date()): string {
  const inicioDoAno = new Date(data.getFullYear(), 0, 0);
  const diffMs = data.getTime() - inicioDoAno.getTime();
  const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const indice = (diaDoAno - 1 + ATIVIDADES_DO_DIA.length) % ATIVIDADES_DO_DIA.length;
  return ATIVIDADES_DO_DIA[indice];
}
