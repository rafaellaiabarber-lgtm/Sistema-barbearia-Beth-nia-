import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            Sistema Barbearia
          </Link>
          <Link href="/login" className="text-sm text-neutral-500 hover:text-orange-600">
            Já tenho conta — Entrar
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl sm:text-3xl font-black mb-2">Política de Privacidade</h1>
        <p className="text-neutral-400 text-sm mb-10">Última atualização: setembro de 2026</p>

        <div className="space-y-8 text-neutral-700 leading-relaxed">
          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">1. Quem trata os dados</h2>
            <p>
              O Sistema Barbearia trata os dados descritos nesta política como controlador dos dados da própria
              barbearia contratante (cadastro, usuários, financeiro) e como operador dos dados que a barbearia
              cadastra sobre os próprios clientes dela (nome e telefone informados no totem), seguindo as
              instruções da barbearia contratante, que é a responsável por esses dados perante os próprios
              clientes.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">2. Quais dados coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Da barbearia contratante: nome, CNPJ (opcional), link de acesso, e-mail e dados de login.</li>
              <li>Dos barbeiros cadastrados: nome, telefone, foto (opcional).</li>
              <li>
                Dos clientes finais da barbearia: nome e telefone informados no totem de autoatendimento, e
                histórico de atendimentos e serviços.
              </li>
              <li>Dados financeiros da operação da barbearia: valores de serviços, comissões e despesas.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">3. Para que usamos esses dados</h2>
            <p>
              Os dados são usados exclusivamente para o funcionamento do sistema: organizar a fila de
              atendimento, calcular comissões e faturamento, identificar clientes recorrentes, enviar
              lembretes/pedidos de avaliação via WhatsApp (a pedido da própria barbearia) e gerenciar o acesso
              e a cobrança da assinatura.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">4. Base legal (LGPD)</h2>
            <p>
              O tratamento se baseia na execução do contrato de uso do sistema (para os dados da barbearia
              contratante) e no legítimo interesse da barbearia contratante em gerenciar o próprio negócio (para
              os dados dos clientes finais), sendo a barbearia contratante responsável por garantir que tem
              base legal adequada para coletar os dados dos próprios clientes.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">5. Com quem compartilhamos</h2>
            <p>
              Não vendemos nem compartilhamos dados com terceiros para fins de marketing. Os dados ficam
              armazenados em provedores de infraestrutura (banco de dados e hospedagem), que atuam apenas como
              operadores técnicos e não têm acesso independente aos dados além do necessário para manter o
              sistema no ar. Pagamentos de assinatura são processados fora do sistema, diretamente na
              ferramenta de pagamento escolhida pela barbearia (Mercado Pago, PagSeguro, Asaas ou equivalente),
              que tem sua própria política de privacidade.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">6. Cada barbearia só vê os próprios dados</h2>
            <p>
              O sistema é multi-tenant: cada barbearia contratante só tem acesso aos dados que ela mesma
              cadastrou. Nenhuma barbearia consegue ver dados de outra.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">7. Direitos do titular dos dados</h2>
            <p>
              Qualquer pessoa cujos dados estejam no sistema pode solicitar confirmação, acesso, correção ou
              exclusão dos seus dados. O pedido pode ser feito diretamente à barbearia onde os dados foram
              cadastrados (que é quem tem contato direto com o cliente final) ou através do contato abaixo.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">8. Retenção e exclusão</h2>
            <p>
              Os dados de uma barbearia são mantidos enquanto a conta estiver ativa. Ao cancelar a assinatura,
              o acesso é bloqueado; a exclusão definitiva dos dados pode ser solicitada pelo contato abaixo.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">9. Cookies</h2>
            <p>
              Usamos apenas um cookie técnico de sessão, necessário para manter o usuário logado. Não usamos
              cookies de rastreamento ou publicidade.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">10. Alterações nesta política</h2>
            <p>
              Esta política pode ser atualizada de tempos em tempos. Alterações relevantes serão comunicadas
              através do próprio sistema ou por e-mail.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">11. Contato</h2>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato pelo
              [e-mail de contato a definir].
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
