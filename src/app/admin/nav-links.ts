export type NavLink = { href: string; label: string; icone: string };
export type NavGrupo = { titulo: string | null; icone: string; links: NavLink[] };

export const gruposNav: NavGrupo[] = [
  {
    titulo: "Operação",
    icone: "dashboard",
    links: [
      { href: "/admin", label: "Visão geral", icone: "dashboard" },
      { href: "/fila", label: "Fila", icone: "atendimentos" },
      { href: "/admin/clientes", label: "Clientes", icone: "clientes" },
      { href: "/admin/barbeiros", label: "Barbeiros", icone: "barbeiros" },
      { href: "/admin/servicos", label: "Serviços", icone: "servicos" },
      { href: "/admin/produtos", label: "Produtos", icone: "produtos" },
    ],
  },
  {
    titulo: "Vendas e relacionamento",
    icone: "vendas",
    links: [
      { href: "/admin/assinaturas", label: "Assinaturas", icone: "assinaturas" },
      { href: "/admin/planos", label: "Planos", icone: "planos" },
      { href: "/indicacoes", label: "Indicações", icone: "indicacoes" },
      { href: "/admin/campanhas", label: "Campanhas", icone: "campanhas" },
    ],
  },
  {
    titulo: "Equipe",
    icone: "barbeiros",
    links: [
      { href: "/admin/barbeiros", label: "Barbeiros", icone: "barbeiros" },
      { href: "/ranking", label: "Ranking", icone: "ranking" },
      { href: "/admin/metas", label: "Metas", icone: "metas" },
      { href: "/admin/comissoes", label: "Comissões", icone: "comissoes" },
      { href: "/admin/treinamento", label: "Treinamentos", icone: "treinamento" },
      { href: "/admin/feedback", label: "Feedback", icone: "feedback" },
    ],
  },
  {
    titulo: "Financeiro",
    icone: "caixa",
    links: [
      { href: "/admin/caixa", label: "Caixa", icone: "caixa" },
      { href: "/admin/contas", label: "Contas a pagar/receber", icone: "contas" },
      { href: "/admin/comissoes", label: "Comissões", icone: "comissoes" },
      { href: "/admin/metas", label: "Metas", icone: "metas" },
      { href: "/admin/precificacao", label: "Precificação", icone: "precificacao" },
    ],
  },
  {
    titulo: "Relatórios",
    icone: "financeiro",
    links: [
      { href: "/admin/financeiro", label: "Financeiro", icone: "financeiro" },
      { href: "/admin/fluxo-caixa", label: "Fluxo de caixa", icone: "fluxoCaixa" },
      { href: "/admin/dre", label: "DRE", icone: "dre" },
      { href: "/admin/eficiencia", label: "Eficiência", icone: "eficiencia" },
    ],
  },
  {
    titulo: "Inteligência",
    icone: "gerenteVirtual",
    links: [{ href: "/admin/gerente-virtual", label: "Gerente Virtual", icone: "gerenteVirtual" }],
  },
  {
    titulo: "Configurações",
    icone: "configuracoes",
    links: [{ href: "/admin/totem", label: "Totem", icone: "totem" }],
  },
];

export const gruposNavFlat: NavLink[] = gruposNav.flatMap((g) => g.links);
