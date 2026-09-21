import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  Building2, 
  Lock, 
  ArrowRight,
  PackageCheck,
  Receipt
} from 'lucide-react';
import { MarketplaceOffer, MarketplaceFeeSettings } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface CheckoutModalProps {
  offer: MarketplaceOffer;
  currentUser: UserAccount;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  offer,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [feeSettings, setFeeSettings] = useState<MarketplaceFeeSettings>({
    defaultFeePercent: 6.5,
    pixDiscountPercent: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartao'>('PIX');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompletedId, setOrderCompletedId] = useState<string | null>(null);

  // Delivery Address Form
  const [address, setAddress] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
  });

  // Card Inputs
  const [cardData, setCardData] = useState({
    number: '',
    holder: currentUser.ownerName || '',
    expiry: '',
    cvv: '',
    installments: '1',
  });

  useEffect(() => {
    marketplaceService.getFeeSettings().then(setFeeSettings);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const productPrice = offer.price;
  const shippingCost = offer.freeShipping ? 0 : (offer.shippingCost || 0);
  const feePercent = feeSettings.defaultFeePercent || 6.5;
  const platformFeeAmount = (productPrice * feePercent) / 100;
  const sellerNetAmount = productPrice - platformFeeAmount;
  const totalAmount = productPrice + shippingCost;

  const pixCode = `00020126580014br.gov.bcb.pix0136${offer.id}-cellhub520400005303986540${totalAmount.toFixed(2)}5802BR5925CellHub Intermediacao6009Sao Paulo62070503***6304`;

  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixCode);
      setCopiedPix(true);
      toast.success('Código PIX Copia e Cola copiado com sucesso!');
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.street.trim() || !address.number.trim()) {
      toast.error('Preencha os dados de endereço de entrega para envio da mercadoria.');
      return;
    }

    if (paymentMethod === 'Cartao' && (!cardData.number || !cardData.expiry || !cardData.cvv)) {
      toast.error('Preencha os dados do cartão de crédito corporativo.');
      return;
    }

    setIsProcessing(true);

    // Simulate gateway confirmation
    setTimeout(async () => {
      const result = await marketplaceService.createOrder({
        offerId: offer.id,
        buyerId: currentUser.id,
        buyerCompany: currentUser.companyName,
        buyerOwner: currentUser.ownerName,
        buyerEmail: currentUser.email,
        buyerCnpj: currentUser.cnpj,
        sellerId: offer.sellerId,
        sellerCompany: offer.sellerCompany,
        productTitle: offer.title,
        productImage: offer.images?.[0] || '',
        productPrice,
        shippingCost,
        platformFeePercent: feePercent,
        platformFeeAmount,
        sellerNetAmount,
        totalAmount,
        paymentMethod,
        paymentStatus: 'pago',
        orderStatus: 'aguardando_envio',
        shippingAddress: address,
      });

      setIsProcessing(false);

      if (result.success && result.orderId) {
        setOrderCompletedId(result.orderId);
        toast.success('Pagamento B2B confirmado! O valor foi retido com segurança em custódia.');
      } else {
        toast.error(result.error || 'Erro ao processar pedido.');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#070b16] border border-[#00D287]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080c17]/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#00D287]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                Checkout B2B Seguro • CellHub Custódia
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Garantia de entrega: o vendedor só recebe após o envio comprovado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {orderCompletedId ? (
            /* Order Success View */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#00D287]/20 border-2 border-[#00D287] text-[#00D287] mx-auto flex items-center justify-center">
                <PackageCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Pedido B2B Gerado com Sucesso!
                </span>
                <h3 className="text-2xl font-black text-white mt-3">
                  Pagamento Confirmado em Custódia
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Número do Pedido: <span className="text-white font-mono font-bold">{orderCompletedId}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Produto:</span>
                  <span className="text-white font-semibold">{offer.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lojista Vendedor:</span>
                  <span className="text-slate-200">{offer.sellerCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Total Pago:</span>
                  <span className="text-[#00D287] font-bold">{formatBRL(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-400 font-semibold">Aguardando Envio pelo Vendedor</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O lojista vendedor foi notificado e despachará seu pedido com código de rastreamento. Você pode acompanhar a entrega na aba <strong>Minhas Compras</strong>.
              </p>

              <button
                onClick={() => {
                  onSuccess(orderCompletedId);
                  onClose();
                }}
                className="px-8 py-3 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-sm shadow-lg shadow-[#00D287]/20"
              >
                Ir para Minhas Compras
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleConfirmOrder} className="space-y-6">
              {/* Product Summary Mini Card */}
              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex-shrink-0">
                  <img
                    src={offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#00D287] uppercase tracking-wider">
                    {offer.category} • {offer.condition}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{offer.title}</h4>
                  <p className="text-xs text-slate-400">Vendedor: {offer.sellerCompany}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white">{formatBRL(productPrice)}</span>
                  <span className="text-[11px] text-emerald-400 block">
                    {offer.freeShipping ? 'Frete Grátis' : `+ ${formatBRL(shippingCost)}`}
                  </span>
                </div>
              </div>

              {/* Delivery Address Form */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#00D287]" /> Endereço de Entrega da Loja
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CEP *</label>
                    <input
                      type="text"
                      required
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      placeholder="00000-000"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Logradouro / Rua *</label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="Av. Paulista, Rua Santa Ifigênia..."
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      value={address.number}
                      onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      placeholder="Ex: 1020"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Complemento / Sala</label>
                    <input
                      type="text"
                      value={address.complement}
                      onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      placeholder="Sala 4B, Loja 12..."
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Bairro *</label>
                    <input
                      type="text"
                      value={address.neighborhood}
                      onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                      placeholder="Centro"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Estado</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#00D287]" /> Método de Pagamento Lojista
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'PIX'
                        ? 'border-[#00D287] bg-[#00D287]/10 text-white shadow-md'
                        : 'border-white/10 bg-slate-950 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <QrCode className={`w-5 h-5 ${paymentMethod === 'PIX' ? 'text-[#00D287]' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="text-xs font-bold">PIX Instantâneo</div>
                      <div className="text-[10px] text-[#00D287]">Aprovação Imediata</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cartao')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'Cartao'
                        ? 'border-[#00D287] bg-[#00D287]/10 text-white shadow-md'
                        : 'border-white/10 bg-slate-950 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'Cartao' ? 'text-[#00D287]' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="text-xs font-bold">Cartão de Crédito</div>
                      <div className="text-[10px] text-slate-400">Até 12x para PJ</div>
                    </div>
                  </button>
                </div>

                {/* PIX Details */}
                {paymentMethod === 'PIX' ? (
                  <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-300 font-semibold">
                        Código PIX Copia e Cola
                      </div>
                      <span className="text-[10px] text-[#00D287] font-bold">Chave Dinâmica Gerada</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 font-mono text-[11px] text-slate-400 break-all select-all">
                      {pixCode}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/10 transition-colors"
                    >
                      {copiedPix ? <Check className="w-4 h-4 text-[#00D287]" /> : <Copy className="w-4 h-4" />}
                      {copiedPix ? 'Copiado para a área de transferência!' : 'Copiar Código PIX'}
                    </button>
                  </div>
                ) : (
                  /* Card Inputs */
                  <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Número do Cartão</label>
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        placeholder="0000 0000 0000 0000"
                        className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Validade (MM/AA)</label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="12/28"
                          className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">CVV</label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="123"
                          className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#00D287] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Breakdown / Escrow Transparency */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-[#0c1224] border border-[#00D287]/20 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal do Produto:</span>
                  <span className="text-slate-200">{formatBRL(productPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Frete de Envio:</span>
                  <span className="text-slate-200">{offer.freeShipping ? 'Grátis' : formatBRL(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Taxa Operacional CellHub ({feePercent}%):</span>
                  <span className="text-emerald-400">{formatBRL(platformFeeAmount)}</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-white block">Total a Pagar</span>
                    <span className="text-[10px] text-slate-400">Proteção de compra ativa</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {formatBRL(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  {isProcessing ? 'Confirmando Custódia...' : 'Confirmar e Pagar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
