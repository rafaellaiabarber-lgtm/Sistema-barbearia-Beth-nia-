export type NavLink = { href: string; label: string; icone: string };
export type NavGrupo = { titulo: string | null; icone: string; links: NavLink[] };

export const gruposNav: NavGrupo[] = [
  {
    titulo: null,
    icone: "dashboard",
    links: [{ href: "/admin", label: "Visão geral", icone: "dashboard" }],
  },
  {
    titulo: "Gerente Virtual",
    icone: "gerenteVirtual",
    links: [{ href: "/admin/gerente-virtual", label: "Gerente Virtual", icone: "gerenteVirtual" }],
  },
  {
    titulo: "Clientes",
    icone: "clientes",
    links: [{ href: "/admin/clientes", label: "Clientes", icone: "clientes" }],
  },
  {
    titulo: "Barbeiros",
    icone: "barbeiros",
    links: [{ href: "/admin/barbeiros", label: "Barbeiros", icone: "barbeiros" }],
  },
  {
    titulo: "Serviços",
    icone: "servicos",
    links: [
      { href: "/admin/servicos", label: "Serviços", icone: "servicos" },
      { href: "/admin/produtos", label: "Produtos", icone: "produtos" },
    ],
  },
  {
    titulo: "Atendimentos",
    icone: "atendimentos",
    links: [
      { href: "/fila", label: "Fila de atendimento", icone: "atendimentos" },
      { href: "/indicacoes", label: "Indicações", icone: "indicacoes" },
      { href: "/ranking", label: "Ranking", icone: "ranking" },
      { href: "/admin/campanhas", label: "Campanhas de venda", icone: "campanhas" },
    ],
  },
  {
    titulo: "Assinaturas",
    icone: "assinaturas",
    links: [
      { href: "/admin/assinaturas", label: "Assinaturas", icone: "assinaturas" },
      { href: "/admin/planos", label: "Planos", icone: "planos" },
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
    ],
  },
  {
    titulo: "Relatórios",
    icone: "financeiro",
    links: [
      { href: "/admin/financeiro", label: "Financeiro", icone: "financeiro" },
      { href: "/admin/fluxo-caixa", label: "Fluxo de caixa", icone: "fluxoCaixa" },
      { href: "/admin/dre", label: "DRE simplificada", icone: "dre" },
      { href: "/admin/eficiencia", label: "Eficiência", icone: "eficiencia" },
    ],
  },
  {
    titulo: "Configurações",
    icone: "totem",
    links: [{ href: "/admin/totem", label: "Totem", icone: "totem" }],
  },
];

export const gruposNavFlat: NavLink[] = gruposNav.flatMap((g) => g.links);
