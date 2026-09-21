# Integração CellHub x Melhor Envio (API v2)

Este documento contém a especificação técnica completa, fluxo de arquitetura, variáveis de ambiente, endpoints, modelagem de banco de dados e checklist de testes para a integração entre o **CellHub** (https://cellhub.shop) e o **Melhor Envio**.

---

## 1. Visão Geral da Arquitetura

O CellHub opera como uma rede B2B onde **todos os usuários são lojistas**.
- **Lojista A (Vendedor):** Cadastra ofertas, define dimensões da embalagem (preenchidas com padrões conservadores por categoria), informa endereço de origem (salvo no perfil) e escolhe a política de frete (*Frete Grátis* ou *Cliente Paga*).
- **Lojista B (Comprador):** Adquire o produto no checkout B2B, informa seu CEP e endereço de entrega, seleciona a modalidade de envio oficial cotada em tempo real (PAC, SEDEX, Jadlog, etc.) e paga via gateway com retenção em custódia.
- **CellHub (Plataforma):** Realiza a compra da etiqueta no Melhor Envio utilizando o **saldo/carteira da própria conta CellHub**, disponibiliza a etiqueta pronta para impressão do vendedor e sincroniza o rastreamento para ambas as partes.

### Regra Contábil Fundamental (Segregação Financeira)
O valor pago pelo frete **nunca** é repassado diretamente para o Melhor Envio nem misturado com o valor do produto. No banco de dados, cada pedido separa estritamente:
1. `product_amount` (Valor do produto)
2. `shipping_amount_charged` (Valor do frete cobrado do comprador — R$ 0,00 em frete grátis)
3. `actual_shipping_cost` (Custo real faturado na carteira CellHub no Melhor Envio)
4. `seller_shipping_cost` (Custo de frete absorvido pelo lojista vendedor quando frete grátis)
5. `shipping_difference` (Diferença entre frete cobrado e custo real da etiqueta)
6. `platform_fee_amount` (Comissão de intermediação retida pela plataforma CellHub)
7. `seller_net_amount` (Valor líquido final creditado ao vendedor)
8. `total_amount` (`product_amount` + `shipping_amount_charged`)

---

## 2. Credenciais e Variáveis de Ambiente

### Configuração Oficial
- **Domínio Oficial de Produção:** `https://cellhub.shop`
- **URL Oficial de Callback OAuth:** `https://cellhub.shop/api/melhor-envio/callback`
- **URL Oficial de Webhook:** `https://hhqerjxkptknwudsnlgh.supabase.co/functions/v1/melhor-envio-webhook`
  *(Ou `https://cellhub.shop/api/webhooks/melhor-envio` se roteado no proxy/DNS)*
- **Client ID:** `30171`
- **Client Secret:** `ix8FiZdsyWrc7D0adr7ow2uRRmM5CCBwYp9zPTIr`

### Variáveis no Supabase / Vercel:
| Variável | Descrição | Onde Configurar |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase (`https://hhqerjxkptknwudsnlgh.supabase.co`) | Supabase & Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (backend) com privilégios de banco | Supabase Secrets |
| `MELHOR_ENVIO_CLIENT_ID` | Client ID registrado no Melhor Envio (`30171`) | Supabase / DB `melhor_envio_integration` |
| `MELHOR_ENVIO_CLIENT_SECRET` | Client Secret do Melhor Envio | Supabase / DB `melhor_envio_integration` |
| `MELHOR_ENVIO_REDIRECT_URI` | `https://cellhub.shop/api/melhor-envio/callback` | Supabase / Painel Admin |

> ⚠️ **Segurança:** O Client Secret e os Tokens de Acesso **NUNCA** são expostos no frontend nem versionados publicamente. O frontend comunica-se exclusivamente com o backend/Edge Function do Supabase.

---

## 3. Endpoints Oficiais e Rotas Internas

### Melhor Envio API v2 (Endpoints Externos)
- **Produção:** `https://melhorenvio.com.br`
  - OAuth Authorize: `https://melhorenvio.com.br/oauth/authorize`
  - OAuth Token: `https://melhorenvio.com.br/oauth/token`
  - Cotação de Envio: `POST https://melhorenvio.com.br/api/v2/me/shipment/calculate`
  - Inserção no Carrinho: `POST https://melhorenvio.com.br/api/v2/me/cart`
  - Compra/Checkout de Envio (Débito da Carteira): `POST https://melhorenvio.com.br/api/v2/me/shipment/checkout`
  - Geração de Etiqueta: `POST https://melhorenvio.com.br/api/v2/me/shipment/generate`
  - Impressão de Etiqueta: `POST https://melhorenvio.com.br/api/v2/me/shipment/print`
  - Rastreamento: `POST https://melhorenvio.com.br/api/v2/me/shipment/tracking`

### Endpoints e Ações Internas da Plataforma
- **Supabase Edge Function:** `https://hhqerjxkptknwudsnlgh.supabase.co/functions/v1/melhor-envio`
  - `action: "get_status"`: Retorna status da conexão, ambiente, saldo e link OAuth.
  - `action: "update_settings"`: Permite ao administrador atualizar ambiente, credenciais e tokens.
  - `action: "exchange_oauth_code"`: Recebe o `code` de autorização e armazena os tokens com segurança.
  - `action: "calculate_shipping"`: Executa cotação oficial sem expor credenciais.
  - `action: "create_and_purchase_label"`: Fluxo idempotente que adiciona ao carrinho, debita da carteira CellHub, gera a etiqueta oficial e armazena o link de impressão no pedido.
  - `action: "track_shipment"`: Consulta a API de tracking e atualiza o histórico de entrega do pedido.
- **Rotas SPA (Frontend):**
  - `/api/melhor-envio/callback` e `/melhor-envio/callback`: Capturam o redirecionamento OAuth e concluem a conexão.
  - `/admin`: Painel do Administrador Geral com sub-aba dedicada **Logística & Melhor Envio**.

---

## 4. Modelagem de Banco de Dados

### Tabelas Criadas / Modificadas:
1. `public.melhor_envio_integration`:
   - Armazena `environment`, `client_id`, `client_secret`, `redirect_uri`, `access_token`, `refresh_token`, `token_expires_at`, `account_balance`, `is_connected`, `last_sync_at`.
2. `public.shipping_package_defaults`:
   - Padrões conservadores por categoria: Celulares (0.5kg, 20x15x8cm), Tablets (0.8kg, 28x20x6cm), Telas (0.35kg, 20x14x6cm), Peças (0.3kg, 18x14x6cm), Ferramentas (1.8kg, 32x22x15cm), Máquinas (4.5kg, 40x30x25cm), etc.
3. `public.user_accounts`:
   - Adicionadas colunas para endereço de envio/origem do lojista: `shipping_zip_code`, `shipping_street`, `shipping_number`, `shipping_complement`, `shipping_neighborhood`, `shipping_city`, `shipping_state`, `shipping_phone`.
4. `public.marketplace_offers`:
   - Adicionadas colunas: `shipping_policy` ('frete_gratis' | 'comprador_paga'), `package_weight`, `package_height`, `package_width`, `package_length`, `origin_zip_code`, `origin_street`, `origin_number`, `origin_complement`, `origin_neighborhood`, `origin_city`, `origin_state`.
5. `public.marketplace_orders`:
   - Segregação contábil: `product_amount`, `shipping_amount_charged`, `actual_shipping_cost`, `seller_shipping_cost`, `shipping_difference`.
   - Snapshots imutáveis: `shipping_origin_snapshot`, `shipping_destination_snapshot`, `shipping_package_snapshot`, `shipping_quote_snapshot`.
   - Identificadores de logística: `melhor_envio_shipment_id`, `melhor_envio_print_url`, `tracking_code`, `tracking_status`, `shipping_status`, `shipping_error`.
6. `public.shipping_logs`:
   - Auditoria de eventos (`order_created`, `cart_created`, `label_created`, `label_failed`, etc.).

---

## 5. Fluxo Passo a Passo

### 5.1 Cadastro da Oferta (Vendedor)
1. O vendedor clica em **Nova Super Oferta**.
2. Adiciona no mínimo 3 fotos do produto (validação obrigatória).
3. Seleciona categoria e condição. As dimensões e peso da embalagem são preenchidos automaticamente com os valores conservadores da categoria.
4. Escolhe a política de frete:
   - **Comprador paga o frete:** O frete será calculado via Melhor Envio e somado no checkout.
   - **Frete grátis:** O comprador paga apenas o produto. O custo da etiqueta será abatido do valor líquido do vendedor.
5. Se for o primeiro cadastro, o vendedor preenche o endereço de origem (com auto-preenchimento via CEP). O sistema salva esse endereço no perfil do lojista para reutilização imediata em ofertas futuras.
6. A oferta é publicada no marketplace.

### 5.2 Compra e Cotação (Comprador)
1. O lojista comprador clica em **Comprar Agora**.
2. No modal de checkout, informa o CEP de entrega.
3. O backend executa a cotação oficial no Melhor Envio com base na origem snapshot da oferta e no destino do comprador.
4. São exibidas as opções retornadas pela API (Correios PAC, SEDEX, Jadlog, etc.) com preço e prazo estimado em dias úteis.
5. O comprador escolhe a opção desejada e efetua o pagamento (PIX ou Cartão).
6. O pedido é gerado com snapshots de origem, destino, pacote e cotação.

### 5.3 Compra da Etiqueta e Expedição (CellHub & Vendedor)
1. O backend inicia a rotina de compra da etiqueta via Melhor Envio utilizando o saldo da conta CellHub.
2. A etiqueta gerada fica instantaneamente disponível na aba **Minhas Vendas** do lojista vendedor.
3. O vendedor clica em **Imprimir Etiqueta** ou **Baixar**, cola na caixa e realiza a postagem na agência/ponto de coleta.
4. O código de rastreio e o status do envio são sincronizados tanto para o comprador quanto para o vendedor e o administrador.

---

## 6. Checklist de Testes

- [x] **Criação de Oferta:** Validação de mínimo de 3 fotos, título, preço e descrição.
- [x] **Dimensões por Categoria:** Ao selecionar Celulares, preenche 0.5kg, 20x15x8cm; ao selecionar Ferramentas, preenche 1.8kg, 32x22x15cm.
- [x] **Endereço do Vendedor:** Reutilização automática de endereço salvo com opção de edição sem afetar ofertas ou pedidos antigos.
- [x] **Cotação de Frete:** Cotação via backend com debounce para evitar requisições excessivas; preenchimento automático de endereço via CEP.
- [x] **Política Frete Grátis:** Comprador paga apenas o produto (`shipping_amount_charged = 0`); `seller_shipping_cost` retém o custo da etiqueta.
- [x] **Política Comprador Paga:** Frete cotado é somado ao total (`shipping_amount_charged = quote.price`).
- [x] **Idempotência:** A rotina de compra de etiqueta valida se o pedido já possui `melhor_envio_shipment_id` antes de qualquer chamada externa.
- [x] **Segregação Financeira:** Separação estrita no banco entre valor do produto, frete cobrado, custo real da etiqueta e taxa CellHub.
- [x] **Área de Envio do Vendedor:** Botões de visualização, download e impressão direta da etiqueta oficial.
- [x] **Acompanhamento do Comprador:** Visualização de prazo, transportadora, código de rastreio e linha do tempo de entrega.
- [x] **Painel Administrativo:** Controle de conexão OAuth, saldo da carteira CellHub, edição de dimensões padrão e auditoria de etiquetas.
