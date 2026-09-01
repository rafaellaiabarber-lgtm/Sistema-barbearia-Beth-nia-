import Link from "next/link";

export default function TermosPage() {
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
        <h1 className="text-2xl sm:text-3xl font-black mb-2">Termos de Uso</h1>
        <p className="text-neutral-400 text-sm mb-10">Última atualização: setembro de 2026</p>

        <div className="space-y-8 text-neutral-700 leading-relaxed">
          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">1. Aceitação dos termos</h2>
            <p>
              Ao criar uma conta no Sistema Barbearia, você (barbearia contratante, aqui chamada de
              &quot;Contratante&quot;) concorda com estes Termos de Uso e com a nossa{" "}
              <Link href="/privacidade" className="text-orange-600 hover:underline">
                Política de Privacidade
              </Link>
              . Se você não concorda com algum ponto, não deve criar uma conta ou continuar usando o sistema.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">2. O que é o serviço</h2>
            <p>
              O Sistema Barbearia é uma ferramenta de gestão para barbearias: fila de atendimento pelo totem,
              controle financeiro, comissão de barbeiros, planos de assinatura, roleta de prêmios, indicações,
              ranking da equipe e módulos relacionados. Cada barbearia contratante tem seu próprio espaço de
              dados, isolado das demais.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">3. Cadastro e responsabilidades da Contratante</h2>
            <p>
              A Contratante é responsável por: manter os dados de cadastro corretos e atualizados; guardar em
              sigilo o usuário e a senha de acesso; garantir que tem autorização para tratar os dados pessoais
              que cadastra no sistema (barbeiros, clientes) conforme a Lei Geral de Proteção de Dados (LGPD); e
              por tudo o que for feito através da sua conta.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">4. Assinatura e pagamento</h2>
            <p>
              O acesso ao sistema é pago através de um plano de assinatura, cobrado por fora do sistema através
              de um link de pagamento (Mercado Pago, PagSeguro, Asaas ou ferramenta equivalente). O acesso fica
              válido pelo período contratado e é renovado manualmente após a confirmação do pagamento. Contas
              sem pagamento confirmado dentro do prazo são bloqueadas automaticamente, sem aviso prévio
              adicional além deste termo.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">5. Uso adequado</h2>
            <p>
              Não é permitido usar o sistema para fins ilegais, tratar dados de terceiros sem base legal
              adequada, tentar acessar dados de outras barbearias contratantes, ou tentar comprometer a
              segurança do sistema.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">6. Cancelamento</h2>
            <p>
              A Contratante pode deixar de renovar a assinatura a qualquer momento, o que leva ao bloqueio
              automático do acesso ao fim do período pago. Dados podem ser solicitados ou removidos conforme
              descrito na nossa Política de Privacidade.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">7. Limitação de responsabilidade</h2>
            <p>
              O sistema é fornecido &quot;como está&quot;. Fazemos o possível pra manter tudo funcionando
              corretamente, mas não garantimos disponibilidade ininterrupta e não nos responsabilizamos por
              perdas decorrentes de uso indevido, falhas de conexão do usuário, ou informações incorretas
              cadastradas pela própria Contratante.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">8. Alterações destes termos</h2>
            <p>
              Estes termos podem ser atualizados de tempos em tempos. Alterações relevantes serão comunicadas
              através do próprio sistema ou por e-mail.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg text-neutral-900 mb-2">9. Contato</h2>
            <p>Dúvidas sobre estes termos podem ser enviadas para [e-mail de contato a definir].</p>
          </div>
        </div>
      </section>
    </div>
  );
}
