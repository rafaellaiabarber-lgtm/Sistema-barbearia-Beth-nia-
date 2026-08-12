export type NavLink = { href: string; label: string };
export type NavGrupo = { titulo: string | null; links: NavLink[] };

export const gruposNav: NavGrupo[] = [
  { titulo: null, links: [{ href: "/admin", label: "Visão geral" }] },
  { titulo: "Clientes", links: [{ href: "/admin/clientes", label: "Clientes" }] },
  { titulo: "Barbeiros", links: [{ href: "/admin/barbeiros", label: "Barbeiros" }] },
  { titulo: "Serviços", links: [{ href: "/admin/servicos", label: "Serviços" }] },
  { titulo: "Atendimentos", links: [{ href: "/fila", label: "Fila de atendimento" }] },
  {
    titulo: "Assinaturas",
    links: [
      { href: "/admin/assinaturas", label: "Assinaturas" },
      { href: "/admin/planos", label: "Planos" },
    ],
  },
  {
    titulo: "Financeiro",
    links: [
      { href: "/admin/caixa", label: "Caixa" },
      { href: "/admin/comissoes", label: "Comissões" },
    ],
  },
  {
    titulo: "Relatórios",
    links: [
      { href: "/admin/financeiro", label: "Financeiro" },
      { href: "/admin/eficiencia", label: "Eficiência" },
    ],
  },
];

export const gruposNavFlat: NavLink[] = gruposNav.flatMap((g) => g.links);
