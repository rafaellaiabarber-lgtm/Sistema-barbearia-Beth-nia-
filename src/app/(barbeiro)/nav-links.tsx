export type BarbeiroNavLink = { href: string; label: string; icone: string };

export const barbeiroNavLinks: BarbeiroNavLink[] = [
  { href: "/fila", label: "Início", icone: "inicio" },
  { href: "/cronometro", label: "Cronômetro de corte", icone: "cronometro" },
  { href: "/indicacoes", label: "Indicações", icone: "indicacoes" },
  { href: "/ranking", label: "Ranking", icone: "ranking" },
  { href: "/planos", label: "Planos", icone: "planos" },
  { href: "/despesas", label: "Minhas despesas", icone: "despesas" },
  { href: "/treinamento", label: "Treinamento", icone: "treinamento" },
];
