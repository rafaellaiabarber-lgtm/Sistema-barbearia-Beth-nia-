import {
  LayoutDashboard,
  Users,
  Scissors,
  Tag,
  Clock,
  CreditCard,
  Layers,
  Wallet,
  HandCoins,
  TrendingUp,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export const ICONES_NAV: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  clientes: Users,
  barbeiros: Scissors,
  servicos: Tag,
  atendimentos: Clock,
  assinaturas: CreditCard,
  planos: Layers,
  caixa: Wallet,
  comissoes: HandCoins,
  financeiro: TrendingUp,
  eficiencia: Gauge,
};
